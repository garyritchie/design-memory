/**
 * Integration tests: acquire only (Phase 1) and full acquire + analyze.
 * Run with: bun run test:integration  (or RUN_INTEGRATION=1 bun test)
 * Requires: network access, Playwright Chromium installed.
 */
import { describe, it, expect } from 'vitest';
import { captureWebsite } from './capture.js';
import { runAcquireStage } from '../pipeline/stage.acquire.js';
import { runAnalyzeStage } from '../pipeline/stage.analyze.js';

const runIntegration = !!process.env.RUN_INTEGRATION;

describe('Integration: acquire (Phase 1)', () => {
  it.skipIf(!runIntegration)(
    'acquires crawl, screenshot, styles, and variables from a live URL in under 25s',
    async () => {
      const start = Date.now();
      const bundle = await captureWebsite('https://example.com');
      const elapsed = Date.now() - start;

      expect(bundle.url).toBe('https://example.com');
      expect(bundle.crawl.html.length).toBeGreaterThan(100);
      expect(bundle.crawl.finalUrl).toBeTruthy();
      expect(bundle.screenshot.buffer.length).toBeGreaterThan(0);
      expect(bundle.screenshot.width).toBeGreaterThan(0);
      expect(Array.isArray(bundle.styles)).toBe(true);
      expect(Array.isArray(bundle.variables)).toBe(true);

      expect(elapsed).toBeLessThan(25000);

      // eslint-disable-next-line no-console
      console.log(`[Acquire] Done in ${(elapsed / 1000).toFixed(1)}s (crawl + screenshot + ${bundle.styles.length} styles + ${bundle.variables.length} variables)`);
    },
    30000
  );
});

describe('Integration: full pipeline (acquire + analyze)', () => {
  it.skipIf(!runIntegration)(
    'runs acquire then analyze and produces a valid partial IR',
    async () => {
      const start = Date.now();
      const bundle = await runAcquireStage('https://example.com');
      const partialIR = runAnalyzeStage(bundle);
      const elapsed = Date.now() - start;

      // Bundle shape
      expect(bundle.crawl.html.length).toBeGreaterThan(100);
      expect(bundle.styles.length).toBeGreaterThan(0);
      expect(bundle.variables).toBeDefined();

      // Partial IR shape (analyze stage output)
      expect(Array.isArray(partialIR.colors)).toBe(true);
      expect(Array.isArray(partialIR.typography)).toBe(true);
      expect(Array.isArray(partialIR.spacing)).toBe(true);
      expect(Array.isArray(partialIR.radius)).toBe(true);
      expect(Array.isArray(partialIR.elevation)).toBe(true);
      expect(Array.isArray(partialIR.layout)).toBe(true);
      expect(Array.isArray(partialIR.components)).toBe(true);
      expect(partialIR.variables).toBeDefined();
      expect(partialIR.motion).toBeDefined();
      expect(partialIR.breakpoints).toBeDefined();
      expect(partialIR.classAnalysis).toBeDefined();
      expect(partialIR.classAnalysis?.topClasses).toBeDefined();
      expect(partialIR.classAnalysis?.tailwindPatterns).toBeDefined();

      expect(elapsed).toBeLessThan(35000);

      // eslint-disable-next-line no-console
      console.log(`[Full] Acquire+Analyze in ${(elapsed / 1000).toFixed(1)}s → ${partialIR.colors?.length ?? 0} colors, ${partialIR.components?.length ?? 0} components`);
    },
    40000
  );
});
