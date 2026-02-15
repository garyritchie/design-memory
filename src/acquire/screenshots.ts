import sharp from 'sharp';
import { launchBrowser } from './browser.js';
import { hashBuffer } from '../util/hash.js';
import { withRetry } from './retry.js';
import type { Browser } from 'playwright';

export interface ScreenshotResult {
  hash: string;
  buffer: Buffer;
  width: number;
  height: number;
}

export async function captureScreenshot(
  url: string,
  viewport: { width: number; height: number } = { width: 1920, height: 1080 },
  browser?: Browser
): Promise<ScreenshotResult> {
  const ownBrowser = !browser;
  if (!browser) {
    browser = await launchBrowser();
  }

  const _browser = browser;
  return withRetry(async () => {
    const page = await _browser.newPage();
    try {
      await page.setViewportSize(viewport);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      const buffer = await page.screenshot({ fullPage: true });
      const hash = hashBuffer(buffer);
      const metadata = await sharp(buffer).metadata();

      return {
        hash,
        buffer,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
      };
    } finally {
      await page.close();
      if (ownBrowser) await _browser.close();
    }
  }, `screenshot(${url})`);
}
