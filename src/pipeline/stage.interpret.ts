import { interpretColors } from '../interpret/interpret.tokens.js';
import { interpretTypography } from '../interpret/interpret.tokens.js';
import { interpretDoctrine } from '../interpret/interpret.doctrine.js';
import { interpretComponents } from '../interpret/interpret.components.js';
import { generateQAChecklist } from './stage.interpret.qa.js';
import type { DesignIR } from '../ir/types.js';
import type { LLMConfig } from '../interpret/llm.client.js';
import type { Logger } from 'loglevel';

export async function runInterpretStage(
  partialIR: Partial<DesignIR>,
  config: LLMConfig,
  logger?: Logger
): Promise<DesignIR> {
  logger?.info('Interpreting design signals with LLM');

  const [colors, typography, components, doctrine] = await Promise.all([
    interpretColors(partialIR.colors ?? [], config, logger),
    interpretTypography(partialIR.typography ?? [], config, logger),
    interpretComponents(partialIR.components ?? [], config, logger),
    interpretDoctrine(partialIR as DesignIR, config, logger),
  ]);

  const qa = generateQAChecklist(partialIR, colors, typography, components);

  return {
    colors,
    typography,
    spacing: partialIR.spacing ?? [],
    radius: partialIR.radius ?? [],
    elevation: partialIR.elevation ?? [],
    layout: partialIR.layout ?? [],
    components,
    doctrine,
    qa,
    // Phase 2 pass-through
    variables: partialIR.variables,
    motion: partialIR.motion,
    breakpoints: partialIR.breakpoints,
    classAnalysis: partialIR.classAnalysis,
  };
}
