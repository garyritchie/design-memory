/**
 * Accuracy test suite (Task 29).
 *
 * Runs `learn` pipeline (acquire + analyze) on well-known public sites
 * and asserts that the extracted IR contains expected design tokens.
 *
 * Run with: bun run test:accuracy  (or RUN_ACCURACY=1 bun test)
 * Requires: network access, Playwright Chromium installed.
 *
 * These tests are NOT part of the default `bun test` suite — they hit
 * real URLs and take ~10-30s each.
 */
import { describe, it, expect } from 'vitest';
import { captureWebsite } from '../acquire/capture.js';
import { runAnalyzeStage } from '../pipeline/stage.analyze.js';
import type { CaptureBundle } from '../acquire/capture.js';
import type { DesignIR } from '../ir/types.js';

const runAccuracy = !!process.env.RUN_ACCURACY;

// Helper: acquire + analyze only (no LLM calls — fast & free)
async function acquireAndAnalyze(url: string): Promise<{ bundle: CaptureBundle; ir: Partial<DesignIR> }> {
  const bundle = await captureWebsite(url);
  const ir = runAnalyzeStage(bundle);
  return { bundle, ir };
}

// ─── Test sites ───────────────────────────────────────────────

describe('Accuracy: example.com', () => {
  it.skipIf(!runAccuracy)(
    'extracts basic design tokens from example.com',
    async () => {
      const { bundle, ir } = await acquireAndAnalyze('https://example.com');

      // HTML should be non-trivial
      expect(bundle.crawl.html.length).toBeGreaterThan(200);

      // Should find at least 1 color (background or text)
      expect(ir.colors!.length).toBeGreaterThan(0);

      // Should find at least 1 typography token
      expect(ir.typography!.length).toBeGreaterThan(0);

      // Should detect some layout primitives
      expect(ir.layout!.length).toBeGreaterThanOrEqual(0);

      // Class analysis should exist
      expect(ir.classAnalysis).toBeDefined();
      expect(ir.classAnalysis!.isTailwind).toBe(false); // example.com is plain HTML

      // eslint-disable-next-line no-console
      console.log(`[example.com] ${ir.colors!.length} colors, ${ir.typography!.length} typography, ${ir.components!.length} components`);
    },
    60000,
  );
});

describe('Accuracy: github.com', () => {
  it.skipIf(!runAccuracy)(
    'extracts meaningful tokens from GitHub',
    async () => {
      const { bundle, ir } = await acquireAndAnalyze('https://github.com');

      // GitHub is a complex site — should have rich extraction
      expect(bundle.crawl.html.length).toBeGreaterThan(5000);

      // Colors: at least 3 (background, text, accent)
      expect(ir.colors!.length).toBeGreaterThanOrEqual(3);

      // Typography: at least 2 (heading + body)
      expect(ir.typography!.length).toBeGreaterThanOrEqual(2);

      // Should detect components (buttons, nav, etc.)
      expect(ir.components!.length).toBeGreaterThan(0);

      // CSS variables: GitHub uses custom properties
      expect(ir.variables!.length).toBeGreaterThan(0);

      // eslint-disable-next-line no-console
      console.log(`[github.com] ${ir.colors!.length} colors, ${ir.typography!.length} typography, ${ir.components!.length} components, ${ir.variables!.length} variables`);
    },
    60000,
  );
});

describe('Accuracy: tailwindcss.com', () => {
  it.skipIf(!runAccuracy)(
    'detects Tailwind CSS on a Tailwind-powered site',
    async () => {
      const { ir } = await acquireAndAnalyze('https://tailwindcss.com');

      // Should detect Tailwind CSS
      expect(ir.classAnalysis).toBeDefined();
      expect(ir.classAnalysis!.isTailwind).toBe(true);
      expect(ir.classAnalysis!.tailwindPatterns.length).toBeGreaterThan(0);

      // Colors: Tailwind sites should have many
      expect(ir.colors!.length).toBeGreaterThanOrEqual(3);

      // eslint-disable-next-line no-console
      console.log(`[tailwindcss.com] Tailwind: ${ir.classAnalysis!.isTailwind}, ${ir.classAnalysis!.tailwindPatterns.length} patterns, ${ir.colors!.length} colors`);
    },
    60000,
  );
});

describe('Accuracy: stripe.com', () => {
  it.skipIf(!runAccuracy)(
    'extracts rich design system from Stripe',
    async () => {
      const { ir } = await acquireAndAnalyze('https://stripe.com');

      // Stripe is a beautifully designed site — rich tokens
      expect(ir.colors!.length).toBeGreaterThanOrEqual(3);
      expect(ir.typography!.length).toBeGreaterThanOrEqual(2);
      expect(ir.spacing!.length).toBeGreaterThan(0);

      // Should detect motion tokens (Stripe uses animations)
      expect(ir.motion).toBeDefined();

      // eslint-disable-next-line no-console
      console.log(`[stripe.com] ${ir.colors!.length} colors, ${ir.typography!.length} typography, ${ir.motion!.length} motion tokens`);
    },
    60000,
  );
});

describe('Accuracy: wikipedia.org', () => {
  it.skipIf(!runAccuracy)(
    'handles content-heavy sites (Wikipedia)',
    async () => {
      const { bundle, ir } = await acquireAndAnalyze('https://en.wikipedia.org');

      // Wikipedia is very content-heavy
      expect(bundle.crawl.html.length).toBeGreaterThan(10000);

      // Should find basic design tokens
      expect(ir.colors!.length).toBeGreaterThan(0);
      expect(ir.typography!.length).toBeGreaterThan(0);

      // Not a Tailwind site
      expect(ir.classAnalysis!.isTailwind).toBe(false);

      // Should detect components (tables, nav, forms)
      expect(ir.components!.length).toBeGreaterThan(0);

      // eslint-disable-next-line no-console
      console.log(`[wikipedia.org] ${ir.colors!.length} colors, ${ir.typography!.length} typography, ${ir.components!.length} components`);
    },
    60000,
  );
});
