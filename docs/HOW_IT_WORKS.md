# How design-memory works

A plain-English explanation of what the tool does and how the browser fits in.

**See also:** [CLI reference](./CLI.md) · [Output structure](./OUTPUT.md) · [Architecture](./ARCHITECTURE.md) · [Docs index](./README.md)

---

## What is design-memory?

**design-memory** is a CLI tool that **learns a design system from a live website** (or from a screenshot) and writes it into a folder (`.design-memory/`) so that **you or an AI** can reuse the same colors, typography, spacing, components, and layout when building UI.

**In one sentence:** You give it a URL (or an image); it opens the site in a headless browser, extracts styles and structure, asks an AI to label and explain them, and outputs markdown files and skills that describe the design system.

---

## The big picture

When you run:

```bash
design-memory learn https://stripe.com
```

the tool runs a **pipeline** in four stages:

```
  URL (or image / multi-page)
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. ACQUIRE (browser, or image / cache)                         │
│     One Chromium: crawl, screenshot, computed styles, CSS vars   │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ANALYZE (no browser)                                         │
│     Parse: colors, fonts, spacing, components, motion, etc.     │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. INTERPRET (OpenAI)                                           │
│     LLM: roles, doctrine; Vision: layout spec from screenshot   │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. PROJECT (no browser)                                         │
│     Write .design-memory/: reference.md, skills/, style, etc.   │
└─────────────────────────────────────────────────────────────────┘
   │
   ▼
  .design-memory/  (ready for AI or humans to use)
```

Only **stage 1 (Acquire)** uses the browser (unless you use `--from-image` or a cache hit). The rest is data processing and file writing.

---

## How the browser is used

We use **Playwright** to control **Chromium** in **headless** mode (no visible window). The browser is used only to load the page and read data from it.

### One browser, four jobs (in parallel)

We launch **one** Chromium process. Inside it we run **four jobs in parallel**, each in its own **page** (tab):

| Job               | What it does |
|-------------------|--------------|
| **Crawl**         | Go to the URL, wait for `networkidle`, optionally wait for SPA hydration, then read the **HTML** (full DOM). |
| **Screenshot**    | Go to the same URL, set viewport (1920×1080), wait, then take a **full-page screenshot** (PNG). |
| **Computed styles** | Go to the same URL, wait, then for **semantic elements** (headings, buttons, links, etc.) read **computed CSS** (color, font, padding, motion, etc.) via `getComputedStyle()`. |
| **CSS variables** | Go to the same URL, wait, then read **custom properties** (`--*`) from `:root` and `body`. |

All four run at the same time (`Promise.all`), so we pay for **one** browser startup. Each navigation can be **retried** (e.g. 2 retries with exponential backoff) if the page fails to load.

### Alternatives to live crawl

- **`--from-image <path>`** — Skip the browser. Use a local image (screenshot or mockup) as the only visual input. Analyze and interpret still run; layout comes from the vision model. No HTML or computed styles.
- **Multi-page** — `learn <url> --pages <url2> <url3>`: crawl several URLs with the same browser, then **merge** HTML, styles, and variables into one design system.
- **Cache** — The first time you run `learn` for a URL, we save the raw capture under `.design-memory/.cache/`. The next run can **reuse** it (within 24 hours) and only re-run analyze, interpret, and project (faster, no browser).

### Why a real browser?

- To get **real** computed styles (after CSS and JS run), not just raw stylesheets.
- To get a **screenshot** so the vision model can describe layout and sections.
- To get **final HTML** after client-side rendering (SPAs). We optionally wait for framework hydration (Next.js, React, Vue, etc.) before reading the DOM.

### What we do *not* do

- We don’t click or scroll (except as needed for a full-page screenshot).
- We don’t log in or fill forms.
- We don’t run multiple sites in one run; one `learn` = one design system (optionally built from one primary URL + extra pages).

---

## What each stage does in detail

### 1. Acquire (browser, or image / cache)

- **Input:** A URL (e.g. `https://stripe.com`), or an image path (`--from-image`), or a cache key for the URL.
- **Process:**
  - **URL mode:** Launch Chromium (cached path). Create four pages; in parallel (with retry and optional SPA wait):
    - **Crawl:** `page.goto(url)` → `networkidle` → optional `waitForSPA` → `page.content()`.
    - **Screenshot:** `page.goto(url)` → wait → `page.screenshot({ fullPage: true })`.
    - **Computed styles:** `page.goto(url)` → wait → for each semantic selector get `getComputedStyle()` (color, font, spacing, motion, etc.).
    - **CSS variables:** `page.goto(url)` → wait → read `--*` from `:root` and `body`.
  - **Image mode:** Read image file, build a minimal bundle (no HTML, no styles; screenshot = image).
  - **Cache:** If cache exists and is fresh, load bundle from disk and skip browser.
- **Output:** A **capture bundle**: `{ url, crawl, screenshot, styles, variables }`.

### 2. Analyze (no browser)

- **Input:** The capture bundle.
- **Process:** Pure TypeScript:
  - **Colors** — From `color`, `backgroundColor`; normalize to hex; dedupe.
  - **Typography** — From `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`; build tokens.
  - **Spacing / radius / elevation** — From `padding`, `margin`, `borderRadius`, `boxShadow`.
  - **Layout** — From `display`, `gridTemplateColumns`, `flexDirection`, etc.
  - **Components** — Pattern-based detection (card, nav, hero, footer, form, etc.).
  - **Motion** — `transition`, `animation`, `transform` from computed styles.
  - **Breakpoints** — Parse `@media (min|max)-width` from inline styles in HTML.
  - **Class / Tailwind** — Scan `class` attributes; detect Tailwind usage.
- **Output:** A **partial design IR** (tokens without semantic roles or doctrine).

### 3. Interpret (OpenAI, no browser)

- **Input:** Partial IR + screenshot + your OpenAI API key.
- **Process:**
  - **Colors** → LLM assigns roles (primary, text, muted, etc.) and usage.
  - **Typography** → LLM assigns roles (heading, body, caption, etc.).
  - **Components** → LLM enriches with usage, do’s and don’ts.
  - **Doctrine** → LLM produces principles, constraints, anti-patterns.
  - **Layout spec** → Vision model describes sections (hero, features, etc.) from the screenshot.
- **Output:** **Full design IR** + **layout spec**.

### 4. Project (no browser)

- **Input:** Full IR + layout spec + URL + optional project root.
- **Process:** Write `.design-memory/`:
  - Core files: `INSTRUCTIONS.md`, `principles.md`, `style.md`, `layout.md`, `components.md`, `motion.md`, `qa.md`.
  - **reference.md** — Single consolidated file (tokens, Tailwind snippet, palette, typography, components, layout, breakpoints, principles).
  - **skills/** — One file per skill (design-system, color-palette, typography, component-patterns, layout-structure, motion-guidelines) for AI replication.
  - Optionally append a design-reference block to `CLAUDE.md` or `.cursorrules` in the project root.
- **Output:** A folder that an AI (e.g. Cursor) or a human can use to replicate the design.

---

## What you get at the end

After `design-memory learn <url>`:

- **.design-memory/** in your project root (or the path you passed).
- **reference.md** — One place for tokens, Tailwind, and guidelines (paste into prompts or use with AI).
- **skills/** — Structured instructions so an AI can follow the design system precisely.
- Other markdown files for principles, style, layout, components, motion, and QA.

So the “feature” is: **turn a live website (or image) into a written design system** so it can be reused consistently by humans and AI.

---

## Summary table

| Stage    | Uses browser? | Uses OpenAI? | Input              | Output                    |
|----------|----------------|--------------|--------------------|---------------------------|
| Acquire  | Yes (or image/cache) | No  | URL / image        | HTML, screenshot, styles, variables |
| Analyze  | No             | No           | Capture bundle     | Partial IR (tokens)       |
| Interpret| No             | Yes          | Partial IR + screenshot | Full IR + layout spec |
| Project  | No             | No           | Full IR + layout spec   | .design-memory/*          |

---

## Commands overview

| Command | What it does |
|---------|----------------|
| `design-memory learn <url>` | Full pipeline; create/update `.design-memory/`. Supports `--from-image`, `--pages`, `--no-cache`. |
| `design-memory install` | Detect project (Next/Vite/CRA/plain + Tailwind), write tokens to globals.css, tailwind config, and optional `design-tokens.ts`. |
| `design-memory diff <url-a> <url-b>` | Learn both URLs, compare design systems, write a diff report (e.g. `design-diff.md`). |
| `design-memory add <pkg>` | Stub. |
| `design-memory mix` | Stub. |

Only **learn** uses the browser (in URL mode, when not using cache or `--from-image`). For full options, see [CLI reference](./CLI.md).
