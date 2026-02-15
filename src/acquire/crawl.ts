import { launchBrowser } from './browser.js';
import { withRetry } from './retry.js';
import { waitForSPA } from './spa.js';
import type { Browser } from 'playwright';
import type { Logger } from 'loglevel';

export interface CrawlResult {
  url: string;
  html: string;
  finalUrl: string;
}

export async function crawlUrl(
  url: string,
  logger?: Logger,
  browser?: Browser,
): Promise<CrawlResult> {
  const ownBrowser = !browser;
  if (!browser) {
    browser = await launchBrowser();
  }

  // Wrap navigation in retry with exponential backoff (Task 26)
  const _browser = browser;
  return withRetry(
    async () => {
      const page = await _browser.newPage();
      try {
        logger?.info(`Navigating to ${url}...`);
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });

        logger?.info('Waiting for page to stabilize...');
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        // Wait for SPA hydration if applicable (Task 27)
        await waitForSPA(page, logger);

        const html = await page.content();
        const finalUrl = page.url();

        logger?.info(`Crawled ${url} -> ${finalUrl}`);

        return { url, html, finalUrl };
      } finally {
        await page.close();
        if (ownBrowser) await _browser.close();
      }
    },
    `crawl(${url})`,
    logger,
  );
}
