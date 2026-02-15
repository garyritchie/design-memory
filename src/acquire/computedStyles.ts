import { launchBrowser } from './browser.js';
import { withRetry } from './retry.js';
import { waitForSPA } from './spa.js';
import type { Browser } from 'playwright';

export interface ComputedStyle {
  selector: string;
  properties: Record<string, string>;
}

/**
 * Semantic selectors to extract styles from.
 * Covers all meaningful UI elements while skipping noise (script, style, meta, etc.).
 */
const SEMANTIC_SELECTORS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'nav',
  'header',
  'footer',
  'section',
  'main',
  'aside',
  'article',
  'ul',
  'ol',
  'li',
  'div',
  'span',
  'img',
  'table',
  'form',
  'label',
];

export async function extractComputedStyles(
  url: string,
  selectors: string[] = [],
  browser?: Browser
): Promise<ComputedStyle[]> {
  const ownBrowser = !browser;
  if (!browser) {
    browser = await launchBrowser();
  }

  if (selectors.length === 0) {
    selectors = SEMANTIC_SELECTORS;
  }

  const _browser = browser;
  const _selectors = selectors;
  return withRetry(async () => {
    const page = await _browser.newPage();
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      // Wait for SPA hydration if applicable (Task 27)
      await waitForSPA(page);

      // Extract all styles in a single page.evaluate call to minimize IPC round-trips.
      const styles = await page.evaluate((sels) => {
        const results: Array<{ selector: string; properties: Record<string, string> }> = [];

        for (const sel of sels) {
          const el = document.querySelector(sel);
          if (!el) continue;

          const style = window.getComputedStyle(el);

          // Skip hidden elements
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            continue;
          }

          results.push({
            selector: sel,
            properties: {
              color: style.color,
              backgroundColor: style.backgroundColor,
              fontSize: style.fontSize,
              fontFamily: style.fontFamily,
              fontWeight: style.fontWeight,
              lineHeight: style.lineHeight,
              letterSpacing: style.letterSpacing,
              padding: style.padding,
              margin: style.margin,
              borderRadius: style.borderRadius,
              boxShadow: style.boxShadow,
              border: style.border,
              display: style.display,
              width: style.width,
              maxWidth: style.maxWidth,
              flexDirection: style.flexDirection,
              gridTemplateColumns: style.gridTemplateColumns,
              gap: style.gap,
              textAlign: style.textAlign,
              textDecoration: style.textDecoration,
              // Motion properties (Task 12)
              transition: style.transition,
              animation: style.animation,
              transform: style.transform,
              opacity: style.opacity,
            },
          });
        }

        return results;
      }, _selectors);

      return styles;
    } finally {
      await page.close();
      if (ownBrowser) await _browser.close();
    }
  }, `computedStyles(${url})`);
}
