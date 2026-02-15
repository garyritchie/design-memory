import { launchBrowser } from './browser.js';
import { crawlUrl } from './crawl.js';
import { captureScreenshot } from './screenshots.js';
import { extractComputedStyles } from './computedStyles.js';
import { extractCSSVariables } from '../analyze/variables.js';
import type { CaptureBundle } from './capture.js';
import type { Logger } from 'loglevel';

/**
 * Acquire multiple URLs with a single browser instance.
 * Returns one CaptureBundle per URL.
 */
export async function captureMultiplePages(
  urls: string[],
  logger?: Logger
): Promise<CaptureBundle[]> {
  if (urls.length === 0) return [];
  if (urls.length === 1) {
    // Fall through to the normal single-page capture
    const { captureWebsite } = await import('./capture.js');
    return [await captureWebsite(urls[0]!, logger)];
  }

  const browser = await launchBrowser();

  try {
    // Process pages sequentially to avoid overwhelming the browser
    // Each page still runs its 4 jobs in parallel
    const bundles: CaptureBundle[] = [];

    for (const url of urls) {
      logger?.info(`Acquiring page: ${url}`);

      const [crawl, screenshot, styles, variables] = await Promise.all([
        crawlUrl(url, logger, browser),
        captureScreenshot(url, undefined, browser),
        extractComputedStyles(url, [], browser),
        extractCSSVariables(url, browser),
      ]);

      bundles.push({ url, crawl, screenshot, styles, variables });
    }

    return bundles;
  } finally {
    await browser.close();
  }
}

/**
 * Merge multiple CaptureBundles into one by deduplicating styles and variables.
 * Uses the first bundle's screenshot and crawl as the primary.
 */
export function mergeBundles(bundles: CaptureBundle[]): CaptureBundle {
  if (bundles.length === 0) throw new Error('No bundles to merge');
  if (bundles.length === 1) return bundles[0]!;

  const primary = bundles[0]!;

  // Merge and deduplicate styles by selector
  const styleKeys = new Set<string>();
  const mergedStyles = [];
  for (const bundle of bundles) {
    for (const style of bundle.styles) {
      const key = style.selector;
      if (!styleKeys.has(key)) {
        styleKeys.add(key);
        mergedStyles.push(style);
      }
    }
  }

  // Merge and deduplicate variables by name
  const varMap = new Map<string, (typeof primary.variables)[0]>();
  for (const bundle of bundles) {
    for (const v of bundle.variables) {
      if (!varMap.has(v.name)) {
        varMap.set(v.name, v);
      }
    }
  }

  // Merge HTML
  const mergedHtml = bundles.map((b) => b.crawl.html).join('\n<!-- page-break -->\n');

  return {
    url: primary.url,
    crawl: {
      url: primary.crawl.url,
      html: mergedHtml,
      finalUrl: primary.crawl.finalUrl,
    },
    screenshot: primary.screenshot,
    styles: mergedStyles,
    variables: Array.from(varMap.values()),
  };
}
