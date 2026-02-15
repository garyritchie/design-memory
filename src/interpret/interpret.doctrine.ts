import { callLLMWithRepair } from './llm.repair.js';
import { buildDoctrinePrompt } from './llm.prompts.js';
import { designDoctrineSchema } from '../ir/schema.js';
import type { DesignDoctrine, DesignIR } from '../ir/types.js';
import type { LLMConfig } from './llm.client.js';
import type { Logger } from 'loglevel';

export async function interpretDoctrine(
  ir: DesignIR,
  config: LLMConfig,
  logger?: Logger
): Promise<DesignDoctrine> {
  const prompt = buildDoctrinePrompt(ir);
  const result = await callLLMWithRepair(prompt, designDoctrineSchema, config, logger);

  return (
    result ?? {
      hierarchy: [],
      principles: [],
      constraints: [],
      antiPatterns: [],
    }
  );
}
