import type { Browser } from 'playwright';
import { launchBrowser } from '../acquire/browser.js';
import { withRetry } from '../acquire/retry.js';

export interface CSSVariable {
  name: string;
  value: string;
  source: 'root' | 'body';
}

/**
 * Extract CSS custom properties (--*) from :root and body.
 * These are the design system tokens sites define explicitly.
 */
export async function extractCSSVariables(
  url: string,
  browser?: Browser,
): Promise<CSSVariable[]> {
  const ownBrowser = !browser;
  if (!browser) {
    browser = await launchBrowser();
  }

  const _browser = browser;
  return withRetry(
    async () => {
      const page = await _browser.newPage();
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        const variables = await page.evaluate(() => {
          const vars: Array<{ name: string; value: string; source: 'root' | 'body' }> = [];
          const seen = new Set<string>();

          function collectFrom(el: Element, source: 'root' | 'body') {
            const style = getComputedStyle(el);
            for (let i = 0; i < style.length; i++) {
              const prop = style[i];
              if (prop && prop.startsWith('--')) {
                if (!seen.has(prop)) {
                  seen.add(prop);
                  vars.push({ name: prop, value: style.getPropertyValue(prop).trim(), source });
                }
              }
            }
          }

          collectFrom(document.documentElement, 'root');
          if (document.body) {
            collectFrom(document.body, 'body');
          }

          return vars;
        });

        return variables;
      } finally {
        await page.close();
        if (ownBrowser) await _browser.close();
      }
    },
    `cssVariables(${url})`,
  );
}
