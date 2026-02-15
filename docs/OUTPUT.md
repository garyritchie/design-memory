# Output: what’s in .design-memory/

After you run `design-memory learn <url>`, the tool writes a **.design-memory/** folder (by default in the current directory, or under `--project-root`). This document describes what’s inside.

---

## Folder layout

```
.design-memory/
├── INSTRUCTIONS.md      # How to use this design memory (start here)
├── principles.md        # Design doctrine: hierarchy, principles, constraints, anti-patterns
├── style.md             # Tokens: colors, typography, spacing, radius, CSS variables, breakpoints
├── layout.md            # Layout primitives + section-by-section spec from vision
├── components.md        # Component recipes (usage, do/don’t)
├── motion.md            # Motion: transitions, animations, transforms
├── qa.md                # QA checklist
├── reference.md         # Single consolidated reference (tokens, Tailwind, palette, etc.)
├── skills/              # Skill files for AI replication
│   ├── design-system.md
│   ├── color-palette.md
│   ├── typography.md
│   ├── component-patterns.md
│   ├── layout-structure.md
│   └── motion-guidelines.md
└── .cache/              # Optional: cached crawl bundles (by URL hash), 24h TTL
    └── <hash>.json
```

---

## Core files (human- and AI-readable)

| File | Contents |
|------|----------|
| **INSTRUCTIONS.md** | Short guide: what this folder is, where to start (`reference.md`, `skills/design-system.md`), and what each part is for. |
| **principles.md** | Design doctrine: visual hierarchy, principles, constraints, and anti-patterns (from the LLM). |
| **style.md** | Design tokens: color palette, typography scale, spacing, radius, elevation. If the site uses CSS variables, a `:root { ... }` block. If breakpoints were found, a breakpoints section. If Tailwind was detected, a note and optional Tailwind snippet. |
| **layout.md** | Layout primitives (from analyze) plus a section-by-section layout spec (from the vision model): hero, features, footer, etc., with structure and styling hints. |
| **components.md** | One section per detected component (buttons, cards, nav, forms, etc.): usage, do’s and don’ts, and optional code hints. |
| **motion.md** | Detected transitions, animations, and transforms with short guidelines. |
| **qa.md** | Checklist for checking that a built UI matches the design (contrast, typography, spacing, etc.). |

---

## reference.md (single consolidated reference)

**reference.md** is the main “paste into a prompt” or “give to an AI” file. It pulls together:

- **Design tokens (CSS variables)** — A `:root { ... }` block with color, typography, spacing, radius (and any other extracted variables).
- **Tailwind** — If Tailwind was detected, a `theme.extend`-style snippet (colors, borderRadius, fontFamily, etc.).
- **Color palette** — Roles and hex values.
- **Typography scale** — Fonts, sizes, weights, roles.
- **Component summary** — Short descriptions and usage.
- **Layout summary** — Sections and structure from the vision spec.
- **Breakpoints** — Extracted breakpoint values.
- **Design principles** — Short list of principles and constraints.

Use this when you want one file to point an AI or a human at “the whole design system.”

---

## skills/ (for AI replication)

The **skills/** folder holds structured instructions (skill files) so an AI can replicate the design system precisely. Each file is markdown with context, rules, anti-patterns, and code examples derived from the extracted IR.

| File | Focus |
|------|--------|
| **design-system.md** | Master skill: tokens, CSS variables, framework (e.g. Tailwind), breakpoints, global rules and anti-patterns. |
| **color-palette.md** | Color roles, hex values, usage and don’ts. |
| **typography.md** | Font families, sizes, weights, roles, and guidelines. |
| **component-patterns.md** | Component types, usage, and code snippets (e.g. button, card). |
| **layout-structure.md** | Sections, layout patterns, and breakpoints. |
| **motion-guidelines.md** | Transitions, animations, and motion do’s and don’ts. |

These are intended for use with AI assistants (e.g. Cursor, Claude) that can load or be prompted with “follow the design in `.design-memory/skills/`.”

---

## .cache/ (crawl cache)

- **Location:** `.design-memory/.cache/`.
- **Contents:** One JSON file per learned URL (keyed by URL hash). Each file stores the raw **capture bundle** (HTML, screenshot as base64, styles, CSS variables) so the next `learn` for that URL can skip the browser and only re-run analyze, interpret, and project.
- **TTL:** Cache entries are treated as valid for 24 hours. Older entries are ignored and re-acquired.
- **Bypass:** Use `design-memory learn <url> --no-cache` to force a fresh crawl and ignore cache.

---

## Integration with AI tools

After writing `.design-memory/`, the tool can **append** a short design-reference block to:

- **CLAUDE.md** (if present at project root), or  
- **.cursorrules** (if present), or  
- **.cursorrules** (created if neither exists),

so that AI tools are reminded to “reference `.design-memory/` for tokens, components, and layout.” The block is guarded by a marker so it isn’t duplicated on repeated runs.

---

## install and these files

When you run **design-memory install**:

- The installer reads tokens from **reference.md** (or **style.md**) and looks for:
  - A CSS `:root { ... }` block.
  - A Tailwind `extend: { ... }`-style block (if the project uses Tailwind).
- It then writes:
  - Appended tokens into your main CSS (e.g. `app/globals.css`, `src/index.css`).
  - An optional Tailwind extend snippet as a comment in your Tailwind config.
  - An optional **design-tokens.ts** (or similar) exporting the same tokens.

So **reference.md** and **style.md** are the source of truth for “install” when you want to bring the learned design into your app’s codebase.
