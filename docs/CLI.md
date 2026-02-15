# CLI reference

All commands and options for the **design-memory** CLI.

---

## Global

```bash
design-memory --version
design-memory --help
```

- **--version** — Print version (e.g. 0.1.0).
- **--help** — List commands and global help.

---

## learn

Learn a design system from a URL, from a local image, or from multiple URLs.

```bash
design-memory learn <url> [options]
```

**Argument:** `url` — URL to crawl (e.g. https://stripe.com). With `--from-image`, the path to an image file.

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| --api-key | OPENAI_API_KEY env or .env | OpenAI API key for interpret and vision. |
| --model | gpt-4o-mini | OpenAI model for text. Vision uses gpt-4o for layout. |
| --from-image | — | Learn from a local image; url is then the image path. Skips crawl and computed styles. |
| --pages | — | Multi-page: crawl primary URL plus these URLs, merge into one design system. |
| --no-cache | — | Skip crawl cache; always re-acquire from the browser. |
| --project-root | cwd | Directory where .design-memory/ is written. |

**Examples:**

```bash
design-memory learn https://example.com --api-key sk-...
design-memory learn ./hero.png --from-image --api-key sk-...
design-memory learn https://example.com --pages https://example.com/about --api-key sk-...
design-memory learn https://example.com --no-cache --api-key sk-...
```

Progress is shown as [step/total] with elapsed time.

---

## install

Install design tokens from `.design-memory/` into the current project.

```bash
design-memory install
```

Requires a `.design-memory/` folder in the current directory. Detects framework (Next.js, Vite, CRA, plain) and Tailwind, then writes:

- Appended `:root { ... }` block to globals.css (or main CSS).
- Optional Tailwind theme.extend snippet as a comment in tailwind.config.
- Optional design-tokens.ts with exported designTokens.

Idempotent: won't duplicate if blocks are already present. No API key needed.

---

## diff

Compare design systems of two URLs and write a diff report.

```bash
design-memory diff <a> <b> [options]
```

**Arguments:** `a` and `b` — Two URLs to compare.

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| --api-key | OPENAI_API_KEY | Used to run learn for both URLs. |
| --model | gpt-4o-mini | OpenAI model for interpret. |
| --output | design-diff.md | Path for the markdown diff report. |

Runs learn for both URLs in memory, diffs the IRs (colors, typography, components, variables), writes the report. Requires API key.

---

## add (stub)

```bash
design-memory add <package>
```

Reserved for adding a design memory package. Not implemented.

---

## mix (stub)

```bash
design-memory mix
```

Reserved for mixing design memories. Not implemented.

---

## Environment

- **OPENAI_API_KEY** — Used by learn and diff if --api-key is not set. Can be in .env.
- **LOG_LEVEL** — Optional (e.g. debug, info, error).

Exit code 0 on success, 1 on error (e.g. missing API key, no .design-memory/ for install).
