import { z } from 'zod';
import { callLLMWithRepair } from './llm.repair.js';
import { buildColorClassificationPrompt, buildTypographyClassificationPrompt } from './llm.prompts.js';
import { colorTokenSchema, typographyTokenSchema } from '../ir/schema.js';
import type { ColorToken, TypographyToken } from '../ir/types.js';
import type { LLMConfig } from './llm.client.js';
import type { Logger } from 'loglevel';

export async function interpretColors(
  colors: ColorToken[],
  config: LLMConfig,
  logger?: Logger
): Promise<ColorToken[]> {
  if (colors.length === 0) {
    return [];
  }

  const prompt = buildColorClassificationPrompt(colors);
  const schema = z.array(colorTokenSchema);
  const result = await callLLMWithRepair(prompt, schema, config, logger);

  return result ?? colors;
}

export async function interpretTypography(
  typography: TypographyToken[],
  config: LLMConfig,
  logger?: Logger
): Promise<TypographyToken[]> {
  if (typography.length === 0) {
    return [];
  }

  const prompt = buildTypographyClassificationPrompt(typography);
  const schema = z.array(typographyTokenSchema);
  const result = await callLLMWithRepair(prompt, schema, config, logger);

  return result ?? typography;
}
