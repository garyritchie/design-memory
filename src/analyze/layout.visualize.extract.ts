import { launchBrowser } from '../acquire/browser.js';
import type { Browser } from 'playwright';

export interface LayoutElement {
  tag: string;
  selector: string;
  bounds: { x: number; y: number; width: number; height: number };
}

export async function extractLayoutStructure(
  url: string,
  browser?: Browser
): Promise<LayoutElement[]> {
  const ownBrowser = !browser;
  if (!browser) {
    browser = await launchBrowser();
  }
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    return await page.evaluate(() => {
      const semanticTags = ['header', 'nav', 'main', 'aside', 'section', 'footer', 'article'];
      const getLabel = (el: Element): string => {
        const tag = el.tagName.toLowerCase();
        const labels: Record<string, string> = {
          header: 'Header',
          nav: 'Navigation',
          main: 'Main',
          aside: 'Sidebar',
          footer: 'Footer',
        };
        if (labels[tag]) return labels[tag];
        if (tag === 'section') {
          const text = el.textContent?.trim().slice(0, 30) || '';
          return text ? `Section: ${text}` : 'Section';
        }
        return tag;
      };
      const isSignificant = (el: Element, rect: DOMRect): boolean => {
        return (
          semanticTags.includes(el.tagName.toLowerCase()) ||
          (rect.width > 300 && rect.height > 150) ||
          (rect.width > 200 && rect.height > 300)
        );
      };

      const elements: LayoutElement[] = [];
      const seen = new Set<string>();

      const walk = (el: Element, depth = 0): void => {
        if (depth > 4) return;
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && isSignificant(el, rect)) {
          const label = getLabel(el);
          const key = `${label}-${Math.round(rect.x)}-${Math.round(rect.y)}`;
          if (!seen.has(key)) {
            elements.push({
              tag: el.tagName.toLowerCase(),
              selector: label,
              bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              },
            });
            seen.add(key);
          }
        }
        for (let i = 0; i < Math.min(el.children.length, 15); i++) {
          walk(el.children[i] as Element, depth + 1);
        }
      };

      walk(document.body);
      return elements;
    });
  } finally {
    await page.close();
    if (ownBrowser) await browser.close();
  }
}
