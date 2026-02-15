import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdirSync } from 'fs';
import { saveBundleToCache, loadCachedBundle } from './crawl-cache.js';
import type { CaptureBundle } from '../acquire/capture.js';

const TEST_ROOT = join(tmpdir(), 'dm-cache-test-' + Date.now());

function makeMockBundle(url: string): CaptureBundle {
  return {
    url,
    crawl: { url, html: '<html><body>test</body></html>', finalUrl: url },
    screenshot: { hash: 'abc123', buffer: Buffer.from('fake-png'), width: 1920, height: 1080 },
    styles: [{ selector: 'h1', properties: { color: 'rgb(0,0,0)', fontSize: '32px' } }],
    variables: [{ name: '--primary', value: '#ff0000', source: 'root' as const }],
  };
}

afterEach(() => {
  if (existsSync(TEST_ROOT)) {
    rmSync(TEST_ROOT, { recursive: true, force: true });
  }
});

describe('crawl-cache', () => {
  it('returns null when no cache exists', async () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    const result = await loadCachedBundle('https://example.com', TEST_ROOT);
    expect(result).toBeNull();
  });

  it('saves and loads a bundle correctly', async () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    const url = 'https://example.com';
    const bundle = makeMockBundle(url);

    await saveBundleToCache(url, bundle, TEST_ROOT);

    // Cache file should exist
    expect(existsSync(join(TEST_ROOT, '.design-memory', '.cache'))).toBe(true);

    // Load it back
    const loaded = await loadCachedBundle(url, TEST_ROOT);
    expect(loaded).not.toBeNull();
    expect(loaded!.url).toBe(url);
    expect(loaded!.crawl.html).toBe(bundle.crawl.html);
    expect(loaded!.screenshot.hash).toBe(bundle.screenshot.hash);
    expect(loaded!.screenshot.width).toBe(1920);
    expect(loaded!.styles.length).toBe(1);
    expect(loaded!.variables.length).toBe(1);
    expect(loaded!.variables[0]!.name).toBe('--primary');
  });

  it('returns null for a different URL (no collision)', async () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    const bundle = makeMockBundle('https://example.com');
    await saveBundleToCache('https://example.com', bundle, TEST_ROOT);

    const result = await loadCachedBundle('https://other-site.com', TEST_ROOT);
    expect(result).toBeNull();
  });

  it('preserves screenshot buffer through serialize/deserialize', async () => {
    mkdirSync(TEST_ROOT, { recursive: true });
    const url = 'https://example.com';
    const bundle = makeMockBundle(url);

    await saveBundleToCache(url, bundle, TEST_ROOT);
    const loaded = await loadCachedBundle(url, TEST_ROOT);

    expect(Buffer.isBuffer(loaded!.screenshot.buffer)).toBe(true);
    expect(loaded!.screenshot.buffer.toString()).toBe('fake-png');
  });
});
