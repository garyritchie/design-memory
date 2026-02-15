import { z } from 'zod';
import { callLLMWithRepair } from './llm.repair.js';
import { buildComponentRecipePrompt } from './llm.prompts.js';
import { componentRecipeSchema } from '../ir/schema.js';
import type { ComponentRecipe } from '../ir/types.js';
import type { LLMConfig } from './llm.client.js';
import type { Logger } from 'loglevel';

export async function interpretComponents(
  components: ComponentRecipe[],
  config: LLMConfig,
  logger?: Logger
): Promise<ComponentRecipe[]> {
  if (components.length === 0) {
    return [];
  }

  const prompt = buildComponentRecipePrompt(components);
  const schema = z.array(componentRecipeSchema);
  const result = await callLLMWithRepair(prompt, schema, config, logger);

  return result ?? components;
}
