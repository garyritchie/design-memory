import { join } from 'path';
import { getDesignMemoryPath, getDesignMemoryFile } from '../util/paths.js';
import { writeTextFile, ensureDir } from '../util/io.js';
import { renderInstructions } from './render.instructions.js';
import { renderPrinciples } from './render.principles.js';
import { renderStyle } from './render.style.js';
import { renderLayout } from './render.layout.js';
import { renderComponents } from './render.components.js';
import { renderMotion } from './render.motion.js';
import { renderQA } from './render.qa.js';
import { renderReference } from './render.reference.js';
import { renderDesignSystemSkill } from '../skills/render.design-system.js';
import { renderColorPaletteSkill } from '../skills/render.color-palette.js';
import { renderTypographySkill } from '../skills/render.typography.js';
import { renderComponentPatternsSkill } from '../skills/render.component-patterns.js';
import { renderLayoutStructureSkill } from '../skills/render.layout-structure.js';
import { renderMotionGuidelinesSkill } from '../skills/render.motion-guidelines.js';
import type { DesignIR } from '../ir/types.js';
import type { LayoutSpec } from '../analyze/layout.spec.js';

export async function writeDesignMemoryFolder(
  ir: DesignIR,
  url: string,
  layoutSpec?: LayoutSpec,
  projectRoot?: string
): Promise<void> {
  const folderPath = getDesignMemoryPath(projectRoot);
  const skillsPath = join(folderPath, 'skills');
  await ensureDir(folderPath);
  await ensureDir(skillsPath);

  await Promise.all([
    // Original files (improved)
    writeTextFile(getDesignMemoryFile('INSTRUCTIONS.md', projectRoot), renderInstructions(ir, url)),
    writeTextFile(getDesignMemoryFile('principles.md', projectRoot), renderPrinciples(ir)),
    writeTextFile(getDesignMemoryFile('style.md', projectRoot), renderStyle(ir)),
    writeTextFile(getDesignMemoryFile('layout.md', projectRoot), renderLayout(ir, layoutSpec)),
    writeTextFile(getDesignMemoryFile('components.md', projectRoot), renderComponents(ir)),
    writeTextFile(getDesignMemoryFile('motion.md', projectRoot), renderMotion(ir)),
    writeTextFile(getDesignMemoryFile('qa.md', projectRoot), renderQA(ir)),
    // Phase 3: consolidated reference
    writeTextFile(
      getDesignMemoryFile('reference.md', projectRoot),
      renderReference(ir, url, layoutSpec)
    ),
    // Phase 3: skills
    writeTextFile(join(skillsPath, 'design-system.md'), renderDesignSystemSkill(ir, url)),
    writeTextFile(join(skillsPath, 'color-palette.md'), renderColorPaletteSkill(ir)),
    writeTextFile(join(skillsPath, 'typography.md'), renderTypographySkill(ir)),
    writeTextFile(join(skillsPath, 'component-patterns.md'), renderComponentPatternsSkill(ir)),
    writeTextFile(
      join(skillsPath, 'layout-structure.md'),
      renderLayoutStructureSkill(ir, layoutSpec)
    ),
    writeTextFile(join(skillsPath, 'motion-guidelines.md'), renderMotionGuidelinesSkill(ir)),
  ]);
}
