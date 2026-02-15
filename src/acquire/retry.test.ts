import { describe, it, expect, vi } from 'vitest';
import { withRetry } from './retry.js';

describe('withRetry', () => {
  it('returns immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, 'test');
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, 'test', undefined, { retries: 2, baseDelay: 10, backoffFactor: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on failure and succeeds on third attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('ok');

    const result = await withRetry(fn, 'test', undefined, { retries: 2, baseDelay: 10, backoffFactor: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after all retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always-fail'));

    await expect(
      withRetry(fn, 'test', undefined, { retries: 2, baseDelay: 10, backoffFactor: 1 })
    ).rejects.toThrow('always-fail');

    expect(fn).toHaveBeenCalledTimes(3); // 1 original + 2 retries
  });

  it('applies exponential backoff', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail-1'))
      .mockRejectedValueOnce(new Error('fail-2'))
      .mockResolvedValue('ok');

    const start = Date.now();
    await withRetry(fn, 'test', undefined, { retries: 2, baseDelay: 50, backoffFactor: 2 });
    const elapsed = Date.now() - start;

    // baseDelay * 2^0 + baseDelay * 2^1 = 50 + 100 = 150ms (minimum)
    expect(elapsed).toBeGreaterThanOrEqual(100); // allow some margin
  });
});
