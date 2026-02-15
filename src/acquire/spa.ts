import type { Page } from 'playwright';
import type { Logger } from 'loglevel';

/**
 * Wait for SPA frameworks to finish hydrating before extracting content.
 * Detects Next.js, Nuxt, React, Vue, Svelte, Angular, and generic SPAs.
 * Times out silently after 3s if no framework is detected — never blocks the pipeline.
 */
export async function waitForSPA(page: Page, logger?: Logger): Promise<void> {
  const SPA_TIMEOUT = 3000;

  try {
    const framework = await page.evaluate(() => {
      // Next.js (App Router or Pages Router)
      if (
        document.querySelector('#__next') ||
        document.querySelector('script#__NEXT_DATA__') ||
        (window as unknown as Record<string, unknown>).__NEXT_DATA__
      ) {
        return 'nextjs';
      }

      // Nuxt / Vue
      if (
        document.querySelector('#__nuxt') ||
        document.querySelector('#app[data-v-app]') ||
        document.querySelector('[data-server-rendered]')
      ) {
        return 'nuxt';
      }

      // React (generic — data-reactroot or #root with children)
      const root = document.querySelector('#root');
      if (
        document.querySelector('[data-reactroot]') ||
        (root && root instanceof HTMLElement && root.children.length > 0)
      ) {
        return 'react';
      }

      // Svelte
      if (document.querySelector('[data-sveltekit-hydrate]') || document.querySelector('.svelte-')) {
        return 'svelte';
      }

      // Angular
      if (document.querySelector('[ng-version]') || document.querySelector('app-root')) {
        return 'angular';
      }

      // Gatsby
      if (document.querySelector('#___gatsby')) {
        return 'gatsby';
      }

      return null;
    });

    if (!framework) {
      logger?.debug('No SPA framework detected, skipping hydration wait');
      return;
    }

    logger?.debug(`Detected SPA framework: ${framework}, waiting for hydration...`);

    // Wait for the DOM to settle — observe that no new nodes are being added
    await page.evaluate((timeout) => {
      return new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setTimeout>;
        let settled = false;

        const observer = new MutationObserver(() => {
          // Every mutation resets the "settled" timer
          clearTimeout(timer);
          timer = setTimeout(() => {
            settled = true;
            observer.disconnect();
            resolve();
          }, 500); // 500ms of no mutations = hydrated
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });

        // Start the initial timer
        timer = setTimeout(() => {
          if (!settled) {
            observer.disconnect();
            resolve();
          }
        }, 500);

        // Hard timeout
        setTimeout(() => {
          if (!settled) {
            observer.disconnect();
            resolve();
          }
        }, timeout);
      });
    }, SPA_TIMEOUT);

    logger?.debug(`SPA hydration complete (${framework})`);
  } catch {
    // Never fail the pipeline — hydration wait is best-effort
    logger?.debug('SPA hydration wait failed silently');
  }
}
