import { chromium } from 'playwright';
import type { Browser } from 'playwright';

/**
 * Cached Chromium executable path.
 * Avoids Playwright re-discovering the binary on every launch.
 */
let _cachedExecutablePath: string | undefined;

function getExecutablePath(): string {
  if (!_cachedExecutablePath) {
    _cachedExecutablePath = chromium.executablePath();
  }
  return _cachedExecutablePath;
}

/**
 * Launch a shared Chromium browser instance with cached executable path.
 * Use this instead of calling chromium.launch() directly.
 */
export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    executablePath: getExecutablePath(),
  });
}
