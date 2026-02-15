import { writeTextFile } from '../util/io.js';
import { getDesignMemoryFile } from '../util/paths.js';
import { stringify } from 'yaml';
import type { DesignMemoryLock } from './lock.read.js';

export async function writeLock(lock: DesignMemoryLock, projectRoot?: string): Promise<void> {
  const content = stringify(lock);
  await writeTextFile(getDesignMemoryFile('lock.yaml', projectRoot), content);
}
