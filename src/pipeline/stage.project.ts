import { cwd } from 'process';
import { writeDesignMemoryFolder } from '../project/writeFolder.js';
import { integrateWithAITools } from '../project/render.ai-integration.js';
import type { DesignIR } from '../ir/types.js';
import type { LayoutSpec } from '../analyze/layout.spec.js';
import type { Logger } from 'loglevel';

export async function runProjectStage(
  ir: DesignIR,
  url: string,
  layoutSpec?: LayoutSpec,
  projectRoot?: string,
  logger?: Logger
): Promise<void> {
  logger?.info('Projecting design memory to .design-memory/ folder');
  await writeDesignMemoryFolder(ir, url, layoutSpec, projectRoot);

  logger?.info('Integrating with AI tools (CLAUDE.md / .cursorrules)');
  const root = projectRoot ?? cwd();
  const updated = await integrateWithAITools(root);
  if (updated.length > 0) {
    logger?.info(`Updated: ${updated.join(', ')}`);
  }
}
