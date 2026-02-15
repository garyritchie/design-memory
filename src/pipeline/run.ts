import { runAcquireStage } from './stage.acquire.js';
import { runAnalyzeStage } from './stage.analyze.js';
import { runInterpretStage } from './stage.interpret.js';
import { runProjectStage } from './stage.project.js';
import type { LLMConfig } from '../interpret/llm.client.js';
import type { Logger } from 'loglevel';

export interface PipelineConfig {
  url: string;
  llm: LLMConfig;
  projectRoot?: string;
}

import { analyzeLayoutSpec } from '../analyze/layout.spec.js';

export async function runPipeline(config: PipelineConfig, logger?: Logger): Promise<void> {
  const bundle = await runAcquireStage(config.url, logger);
  const partialIR = runAnalyzeStage(bundle, logger);
  const ir = await runInterpretStage(partialIR, config.llm, logger);
  const layoutSpec = await analyzeLayoutSpec(bundle.screenshot, config.llm, logger);
  await runProjectStage(ir, config.url, layoutSpec, config.projectRoot, logger);
}
