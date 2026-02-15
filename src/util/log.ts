import log from 'loglevel';
import type { LogLevelDesc } from 'loglevel';

export function createLogger(name: string): log.Logger {
  const logger = log.getLogger(name);
  logger.setLevel((process.env.LOG_LEVEL ?? 'info') as LogLevelDesc);
  return logger;
}

export const defaultLogger = createLogger('design-memory');
