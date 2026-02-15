import { captureWebsite } from '../acquire/capture.js';
import type { CaptureBundle } from '../acquire/capture.js';
import type { Logger } from 'loglevel';

export async function runAcquireStage(url: string, logger?: Logger): Promise<CaptureBundle> {
  logger?.info(`Acquiring data from ${url}`);
  return await captureWebsite(url, logger);
}
