import { createHash } from 'crypto';

export function hashString(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export function hashBuffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 16);
}
