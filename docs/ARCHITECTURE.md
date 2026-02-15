# Architecture

High-level view of the pipeline and main modules. For file-level detail, see [IMPLEMENTATION.md](../IMPLEMENTATION.md).

---

## Pipeline stages

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  ACQUIRE    │────▶│  ANALYZE    │────▶│ INTERPRET   │────▶│  PROJECT    │
│  (browser   │     │  (pure TS)  │     │ (OpenAI)    │     │  (write     │
│   or image  │     │             │     │             │     │   files)    │
│   or cache) │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
  CaptureBundle        Partial<DesignIR>     DesignIR +           .design-memory/
  (url, crawl,         (colors, typography,   LayoutSpec            + AI integration
   screenshot,          spacing, components,
   styles, variables)   motion, breakpoints,
                        classAnalysis, …)
```

- **Acquire** — One Chromium; four parallel jobs (crawl, screenshot, computed styles, CSS variables). Optional: from-image, multi-page, or load from cache. Retry and SPA wait run inside acquire.
- **Analyze** — Pure TS: extract tokens and structure from the bundle; output is partial IR (no roles or doctrine).
- **Interpret** — LLM for color/typography/component roles and doctrine; vision for layout spec. Output is full IR + layout spec.
- **Project** — Render markdown and skills from IR + layout spec; write `.design-memory/`; optionally update CLAUDE.md / .cursorrules.

---

## Data flow

- **CaptureBundle** — Raw output of acquire: `url`, `crawl: { html, finalUrl }`, `screenshot: { buffer, width, height }`, `styles: [{ selector, properties }]`, `variables: [{ name, value, source }]`.
- **Partial&lt;DesignIR&gt;** — Analyze output: arrays of colors, typography, spacing, radius, elevation, layout, components; plus variables, motion, breakpoints, classAnalysis. No semantic roles yet.
- **DesignIR** — Full IR after interpret: same structure with roles, usage, doctrine, and QA checklist.
- **LayoutSpec** — Vision output: sections (id, name, type, position, layout, content, styling).

---

## Key modules (by layer)

| Layer | Role | Main modules |
|-------|------|------------------|
| **Acquire** | Browser, crawl, screenshot, styles, variables | `capture.ts`, `crawl.ts`, `screenshots.ts`, `computedStyles.ts`, `analyze/variables.ts` (extract), `from-image.ts`, `multi-page.ts`, `retry.ts`, `spa.ts`, `browser.ts` |
| **Analyze** | Turn bundle into tokens and structure | `stage.analyze.ts`, `colors.ts`, `typography.ts`, `spacing.ts`, `radius.ts`, `elevation.ts`, `layout.ts`, `components.detect.ts`, `classes.ts`, `breakpoints.ts`, `motion.ts` |
| **Interpret** | LLM and vision | `stage.interpret.ts`, `interpret.tokens.ts`, `interpret.doctrine.ts`, `interpret.components.ts`, `llm.prompts.ts`, `llm.client.ts`, `layout.spec.ts` |
| **IR** | Types and diff | `ir/types.ts`, `ir/types.tokens.ts`, `ir/types.components.ts`, `ir/types.doctrine.ts`, `ir/diff.ts` |
| **Project** | Render and write | `stage.project.ts`, `writeFolder.ts`, `render.reference.ts`, `render.style.ts`, `render.*.ts`, `render.ai-integration.ts`, `install.detect.ts`, `install.tokens.ts`, `install.write.ts` |
| **Skills** | AI-oriented skill files | `skills/render.design-system.ts`, `render.color-palette.ts`, … |
| **Cache** | Crawl cache | `cache/crawl-cache.ts` |
| **CLI** | Commands and progress | `cli/main.ts`, `cmd.learn.ts`, `cmd.install.ts`, `cmd.diff.ts`, `progress.ts` |

---

## Entry points

- **CLI** — `src/cli/main.ts` (Commander). Commands: `learn`, `install`, `diff`, `add`, `mix`.
- **Learn flow** — `cmd.learn.ts` → `runAcquireStage` / `acquireFromImage` / multi-page + cache → `runAnalyzeStage` → `runInterpretStage` → `analyzeLayoutSpec` → `runProjectStage`.
- **Programmatic** — `pipeline/run.ts` and stage modules can be used without the CLI (e.g. from tests or scripts).

---

## Dependencies

- **Playwright** — Chromium for acquire (crawl, screenshot, computed styles). CSS variables are read in the same browser via a separate page.
- **OpenAI** — Text models for interpret; vision model for layout spec.
- **Sharp** — Screenshot buffer handling (e.g. dimensions); also used in from-image.
- **Zod** — Schemas for IR and layout spec validation and repair.

---

## Testing

- **Unit** — `src/**/*.test.ts` (Vitest). No browser, no network. Covers retry, cache, analyzers, renderers, writeFolder.
- **Integration** — `RUN_INTEGRATION=1`: acquire (and acquire+analyze) against https://example.com.
- **Accuracy** — `RUN_ACCURACY=1`: acquire+analyze on several known sites; assert token counts and Tailwind detection.

See [TESTING_LOCALLY.md](../TESTING_LOCALLY.md) for how to run each.
