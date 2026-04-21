import OpenAI from 'openai';
import type { ScreenshotResult } from '../acquire/screenshots.js';
import type { LLMConfig } from '../interpret/llm.client.js';
import type { Logger } from 'loglevel';
import { z } from 'zod';
import { buildLayoutSpecPrompt } from './layout.spec.prompt.js';
import { fixLayoutSpec } from './layout.spec.fix.js';
import { layoutSpecSchema } from './layout.spec.schema.js';

export type { LayoutSpec, LayoutSection } from './layout.spec.schema.js';
export { layoutSpecSchema } from './layout.spec.schema.js';

export async function analyzeLayoutSpec(
  screenshot: ScreenshotResult,
  config: LLMConfig,
  logger?: Logger
): Promise<z.infer<typeof layoutSpecSchema>> {
  const client = new OpenAI({ apiKey: config.apiKey });

  logger?.debug('Analyzing layout specification with vision model...');

  const base64Image = screenshot.buffer.toString('base64');

  // --- ADD THIS DELAY ---
  console.log("⏳ Pausing for 15 seconds to allow Ollama to load the Vision model...");
  await new Promise(resolve => setTimeout(resolve, 15000));
  // ----------------------

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL || (config.model?.includes('vision') ? config.model : 'gpt-4o'),
    messages: [
      {
        role: 'system',
        content: `You are a design system expert. Analyze the webpage screenshot and create a detailed layout specification in JSON format that any LLM can use to recreate this design.

CRITICAL: Your output MUST be a valid JSON object with a single root key "sections" containing an array of layout sections. Example: {"sections": [...]}

Your output must be valid JSON matching this schema. Be extremely precise about:
- Section positions (top/middle/bottom, left/center/right/full-width)
- Layout patterns (row, column, grid, flex, centered)
- Content hierarchy and relationships
- Spacing, gaps, padding, margins
- Responsive behavior

This specification will be used by LLMs to generate code that recreates the exact layout.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildLayoutSpecPrompt(screenshot.width, screenshot.height),
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    // response_format: { type: 'json_object' },
    max_tokens: 2500,
    temperature: 0.0,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty vision model response');
  }

  let parsed: unknown;
  try {
    // 1. Try to find a Markdown JSON block first (using escaped backticks for safety)
    const markdownMatch = content.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/i);
    
    // 2. Local models might return a raw array [] or an object {}
    const bracketMatch = content.match(/\{[\s\S]*\}/);
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    
    let cleanContent = content;
    if (markdownMatch?.[1]) {
      cleanContent = markdownMatch[1];
    } else if (bracketMatch?.[0] || arrayMatch?.[0]) {
      const bLen = bracketMatch?.[0]?.length || 0;
      const aLen = arrayMatch?.[0]?.length || 0;
      cleanContent = bLen > aLen ? bracketMatch![0] : arrayMatch![0];
    }
    
    parsed = JSON.parse(cleanContent.trim());

    // 3. Defensive wrapper: Many local models accidentally return just the array 
    // instead of wrapping it in the required "sections" root object.
    if (Array.isArray(parsed)) {
      parsed = { sections: parsed };
    }
  } catch (error) {
    logger?.error('Failed to parse JSON response', error);
    throw new Error('Invalid JSON response from vision model');
  }

  let spec: z.infer<typeof layoutSpecSchema>;
  try {
    spec = layoutSpecSchema.parse(parsed);
  } catch (error) {
    logger?.warn('Schema validation failed, attempting to fix...', error);

    if (error instanceof z.ZodError) {
      try {
        spec = fixLayoutSpec(parsed, screenshot, layoutSpecSchema);
        logger?.debug('Successfully fixed schema validation errors');
      } catch (retryError) {
        logger?.error('Failed to fix schema validation', retryError);
        throw new Error(`Schema validation failed: ${error.message}`);
      }
    } else {
      throw error;
    }
  }

  logger?.debug('Layout specification generated');

  return spec;
}