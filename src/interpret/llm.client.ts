import OpenAI from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Logger } from 'loglevel';

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
}

export async function callLLM<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  config: LLMConfig,
  _logger?: Logger
): Promise<T> {
  const client = new OpenAI({ apiKey: config.apiKey });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  const jsonSchema = zodToJsonSchema(schema as any, { name: 'Response' });

  const isArraySchema = schema instanceof z.ZodArray;
  const systemPrompt = isArraySchema
    ? `You are a design system expert. You MUST return a JSON object with a single key "data" containing the array. Example: {"data": [...]}

Schema expects an array. Return: {"data": [array of items]}

CRITICAL: 
- Return {"data": <array>} where <array> matches the schema
- All required fields must be present
- Arrays must be arrays, never null or undefined`
    : `You are a design system expert. You MUST return valid JSON matching this exact schema.

Schema: ${JSON.stringify(jsonSchema, null, 2)}

CRITICAL: 
- Return the object directly matching the schema
- All required fields must be present
- Arrays must be arrays, never null or undefined`;

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || config.model || 'gpt-4o-mini',
    temperature: config.temperature ?? 0.2,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty LLM response');
  }

  const parsed: unknown = JSON.parse(content) as unknown;
  const data =
    isArraySchema && typeof parsed === 'object' && parsed !== null && 'data' in parsed
      ? (parsed as Record<string, unknown>).data
      : parsed;
  return schema.parse(data);
}
