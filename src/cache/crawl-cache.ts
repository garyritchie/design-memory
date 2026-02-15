import { existsSync } from 'fs';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { ensureDir } from '../util/io.js';
import { hashString } from '../util/hash.js';
import type { CaptureBundle } from '../acquire/capture.js';

/** Max cache age in milliseconds (24 hours) */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  url: string;
  timestamp: number;
  bundle: SerializedBundle;
}

/** CaptureBundle with screenshot buffer as base64 (JSON-safe) */
interface SerializedBundle {
  url: string;
  crawl: { url: string; html: string; finalUrl: string };
  screenshot: { hash: string; base64: string; width: number; height: number };
  styles: Array<{ selector: string; properties: Record<string, string> }>;
  variables: Array<{ name: string; value: string; source: 'root' | 'body' }>;
}

function getCachePath(projectRoot: string): string {
  return join(projectRoot, '.design-memory', '.cache');
}

function getCacheFile(url: string, projectRoot: string): string {
  const key = hashString(url);
  return join(getCachePath(projectRoot), `${key}.json`);
}

/**
 * Try to load a cached CaptureBundle for a URL.
 * Returns null if no valid cache exists or if it is expired.
 */
export async function loadCachedBundle(
  url: string,
  projectRoot: string
): Promise<CaptureBundle | null> {
  const file = getCacheFile(url, projectRoot);
  if (!existsSync(file)) return null;

  try {
    const raw = await readFile(file, 'utf-8');
    const entry = JSON.parse(raw) as CacheEntry;

    // Check expiration
    if (Date.now() - entry.timestamp > MAX_AGE_MS) {
      return null; // stale
    }

    // Check URL matches (hash collision guard)
    if (entry.url !== url) {
      return null;
    }

    return deserializeBundle(entry.bundle);
  } catch {
    return null; // corrupt cache — ignore
  }
}

/**
 * Save a CaptureBundle to the crawl cache.
 */
export async function saveBundleToCache(
  url: string,
  bundle: CaptureBundle,
  projectRoot: string
): Promise<void> {
  const cachePath = getCachePath(projectRoot);
  await ensureDir(cachePath);

  const entry: CacheEntry = {
    url,
    timestamp: Date.now(),
    bundle: serializeBundle(bundle),
  };

  const file = getCacheFile(url, projectRoot);
  await writeFile(file, JSON.stringify(entry), 'utf-8');
}

function serializeBundle(bundle: CaptureBundle): SerializedBundle {
  return {
    url: bundle.url,
    crawl: bundle.crawl,
    screenshot: {
      hash: bundle.screenshot.hash,
      base64: Buffer.from(bundle.screenshot.buffer).toString('base64'),
      width: bundle.screenshot.width,
      height: bundle.screenshot.height,
    },
    styles: bundle.styles,
    variables: bundle.variables,
  };
}

function deserializeBundle(s: SerializedBundle): CaptureBundle {
  return {
    url: s.url,
    crawl: s.crawl,
    screenshot: {
      hash: s.screenshot.hash,
      buffer: Buffer.from(s.screenshot.base64, 'base64'),
      width: s.screenshot.width,
      height: s.screenshot.height,
    },
    styles: s.styles,
    variables: s.variables,
  };
}
