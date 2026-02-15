import type { Logger } from 'loglevel';

export interface RetryOptions {
  /** Max number of retries (default: 2, so 3 attempts total) */
  retries?: number;
  /** Initial delay in ms before the first retry (default: 1000) */
  baseDelay?: number;
  /** Multiply delay by this factor on each retry (default: 2) */
  backoffFactor?: number;
}

const DEFAULTS: Required<RetryOptions> = {
  retries: 2,
  baseDelay: 1000,
  backoffFactor: 2,
};

/**
 * Retry an async function with exponential backoff.
 * Logs each retry attempt if a logger is provided.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  logger?: Logger,
  opts?: RetryOptions,
): Promise<T> {
  const { retries, baseDelay, backoffFactor } = { ...DEFAULTS, ...opts };

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        const delay = baseDelay * Math.pow(backoffFactor, attempt);
        const msg = error instanceof Error ? error.message : String(error);
        logger?.warn(`[retry] ${label} attempt ${attempt + 1} failed: ${msg} — retrying in ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
