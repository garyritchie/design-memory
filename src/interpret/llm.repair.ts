import { z } from 'zod';
import type { Logger } from 'loglevel';
import { callLLM } from './llm.client.js';
import type { LLMConfig } from './llm.client.js';

export async function callLLMWithRepair<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  config: LLMConfig,
  logger?: Logger
): Promise<T | null> {
  try {
    return await callLLM(prompt, schema, config, logger);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger?.debug('LLM output failed validation, attempting repair');
      const errorDetails = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      const repairPrompt = `${prompt}\n\nPrevious response was invalid. Errors: ${errorDetails}\n\nPlease fix and return valid JSON matching the schema exactly.`;

      try {
        return await callLLM(repairPrompt, schema, config, logger);
      } catch (repairError) {
        logger?.debug('Repair attempt failed, using fallback');
        return null;
      }
    }
    throw error;
  }
}
