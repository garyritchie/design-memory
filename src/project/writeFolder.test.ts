import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeDesignMemoryFolder } from './writeFolder.js';
import { getDesignMemoryPath } from '../util/paths.js';
import { readTextFile } from '../util/io.js';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import type { DesignIR } from '../../ir/types.js';

describe('writeDesignMemoryFolder', () => {
  const testRoot = '/tmp/design-memory-test';

  beforeEach(async () => {
    if (existsSync(testRoot)) {
      await rm(testRoot, { recursive: true });
    }
  });

  afterEach(async () => {
    if (existsSync(testRoot)) {
      await rm(testRoot, { recursive: true });
    }
  });

  it('creates all required markdown files', async () => {
    const ir: DesignIR = {
      colors: [],
      typography: [],
      spacing: [],
      radius: [],
      elevation: [],
      layout: [],
      components: [],
      doctrine: {
        hierarchy: [],
        principles: [],
        constraints: [],
        antiPatterns: [],
      },
      qa: { items: [] },
    };

    await writeDesignMemoryFolder(ir, 'https://example.com', undefined, testRoot);

    const files = [
      'INSTRUCTIONS.md',
      'principles.md',
      'style.md',
      'layout.md',
      'components.md',
      'motion.md',
      'qa.md',
      'reference.md',
      'skills/design-system.md',
      'skills/color-palette.md',
      'skills/typography.md',
      'skills/component-patterns.md',
      'skills/layout-structure.md',
      'skills/motion-guidelines.md',
    ];

    for (const file of files) {
      const path = `${testRoot}/.design-memory/${file}`;
      expect(existsSync(path)).toBe(true);
      const content = await readTextFile(path);
      expect(content.length).toBeGreaterThan(0);
    }
  });
});
