import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

export interface DesignMemoryConfig {
  version?: string;
  sources?: string[];
}

export async function loadConfig(projectRoot: string): Promise<DesignMemoryConfig | null> {
  const configPath = join(projectRoot, '.design-memory', 'config.yaml');
  if (!existsSync(configPath)) {
    return null;
  }

  const content = await readFile(configPath, 'utf-8');
  return parse(content) as DesignMemoryConfig;
}
