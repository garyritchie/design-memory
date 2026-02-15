import { join } from 'path';
import { cwd } from 'process';

export function getDesignMemoryPath(projectRoot?: string): string {
  const root = projectRoot ?? cwd();
  return join(root, '.design-memory');
}

export function getDesignMemoryFile(filename: string, projectRoot?: string): string {
  return join(getDesignMemoryPath(projectRoot), filename);
}
