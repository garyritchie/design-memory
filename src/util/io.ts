import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';

export async function ensureDir(path: string): Promise<void> {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
}

export async function writeTextFile(
  path: string,
  content: string
): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, 'utf-8');
}

export async function readTextFile(path: string): Promise<string> {
  return await readFile(path, 'utf-8');
}
