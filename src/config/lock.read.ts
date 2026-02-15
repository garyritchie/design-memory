import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

export interface DesignMemoryLock {
  version: string;
  sources: Array<{ url: string; hash: string; timestamp: string }>;
}

export async function readLock(projectRoot: string): Promise<DesignMemoryLock | null> {
  const lockPath = join(projectRoot, '.design-memory', 'lock.yaml');
  if (!existsSync(lockPath)) {
    return null;
  }

  const content = await readFile(lockPath, 'utf-8');
  return parse(content) as DesignMemoryLock;
}
