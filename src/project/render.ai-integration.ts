import { existsSync } from 'fs';
import { join } from 'path';
import { readTextFile, writeTextFile } from '../util/io.js';

const DESIGN_MEMORY_INSTRUCTION = `
## Design System Reference

When building UI components, pages, or layouts, ALWAYS reference the design system in \`.design-memory/\`:

1. **Read \`.design-memory/skills/design-system.md\`** first for tokens and rules.
2. **Use the exact colors, fonts, spacing, and radius** from the extracted design system.
3. **Follow component patterns** in \`.design-memory/skills/component-patterns.md\`.
4. **Match the layout structure** in \`.design-memory/skills/layout-structure.md\`.
5. **Do NOT** introduce new colors, fonts, or spacing values not in the design system.

For a single-file overview, see \`.design-memory/reference.md\`.
`;

const MARKER = '<!-- design-memory -->';

/**
 * Append design system instructions to CLAUDE.md and/or .cursorrules if they exist.
 * If neither exists, create .cursorrules with the instructions.
 */
export async function integrateWithAITools(projectRoot: string): Promise<string[]> {
  const updated: string[] = [];

  const claudePath = join(projectRoot, 'CLAUDE.md');
  const cursorPath = join(projectRoot, '.cursorrules');

  if (existsSync(claudePath)) {
    const content = await readTextFile(claudePath);
    if (!content.includes(MARKER)) {
      await writeTextFile(claudePath, content + '\n' + MARKER + '\n' + DESIGN_MEMORY_INSTRUCTION);
      updated.push('CLAUDE.md');
    }
  }

  if (existsSync(cursorPath)) {
    const content = await readTextFile(cursorPath);
    if (!content.includes(MARKER)) {
      await writeTextFile(cursorPath, content + '\n' + MARKER + '\n' + DESIGN_MEMORY_INSTRUCTION);
      updated.push('.cursorrules');
    }
  }

  // If neither existed, create .cursorrules
  if (!existsSync(claudePath) && !existsSync(cursorPath)) {
    await writeTextFile(cursorPath, MARKER + '\n' + DESIGN_MEMORY_INSTRUCTION);
    updated.push('.cursorrules (created)');
  }

  return updated;
}
