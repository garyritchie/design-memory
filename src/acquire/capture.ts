import { launchBrowser } from './browser.js';
import { crawlUrl } from './crawl.js';
import { captureScreenshot } from './screenshots.js';
import { extractComputedStyles } from './computedStyles.js';
import { extractCSSVariables } from '../analyze/variables.js';
import type { CrawlResult } from './crawl.js';
import type { ScreenshotResult } from './screenshots.js';
import type { ComputedStyle } from './computedStyles.js';
import type { CSSVariable } from '../analyze/variables.js';
import type { Logger } from 'loglevel';

export interface CaptureBundle {
  url: string;
  crawl: CrawlResult;
  screenshot: ScreenshotResult;
  styles: ComputedStyle[];
  variables: CSSVariable[];
}

export async function captureWebsite(url: string, logger?: Logger): Promise<CaptureBundle> {
  logger?.info('Launching browser...');
  const browser = await launchBrowser();

  try {
    // Run all acquire steps in parallel on the same browser instance.
    // Each creates its own page internally — lightweight compared to launching separate browsers.
    logger?.info('Acquiring crawl, screenshot, styles, and variables in parallel...');
    const [crawl, screenshot, styles, variables] = await Promise.all([
      crawlUrl(url, logger, browser),
      captureScreenshot(url, undefined, browser),
      extractComputedStyles(url, [], browser),
      extractCSSVariables(url, browser),
    ]);

    return {
      url,
      crawl,
      screenshot,
      styles,
      variables,
    };
  } finally {
    await browser.close();
  }
}
