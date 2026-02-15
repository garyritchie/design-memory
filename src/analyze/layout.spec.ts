import OpenAI from 'openai';
import type { ScreenshotResult } from '../acquire/screenshots.js';
import type { LLMConfig } from '../interpret/llm.client.js';
import type { Logger } from 'loglevel';
import { z } from 'zod';
import { buildLayoutSpecPrompt } from './layout.spec.prompt.js';
import { fixLayoutSpec } from './layout.spec.fix.js';

const layoutSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  position: z.object({
    vertical: z.enum(['top', 'middle', 'bottom']),
    horizontal: z.enum(['left', 'center', 'right', 'full-width']),
    order: z.number(),
  }),
  layout: z.object({
    pattern: z.enum(['single', 'row', 'column', 'grid', 'flex', 'centered']),
    columns: z.number().optional(),
    gap: z.string().optional(),
    alignment: z.string().optional(),
  }),
  content: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    text: z.string().optional(),
    items: z.array(z.string()).optional(),
  }),
  styling: z.object({
    width: z.string().optional(),
    maxWidth: z.string().optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    backgroundColor: z.string().optional(),
    color: z.string().optional(),
    borderRadius: z.string().optional(),
    border: z.string().optional(),
  }),
  visual: z.object({
    background: z.string().optional(),
    textColor: z.string().optional(),
    buttonStyle: z.object({
      backgroundColor: z.string().optional(),
      color: z.string().optional(),
      border: z.string().optional(),
      borderRadius: z.string().optional(),
    }).optional(),
    typography: z.object({
      fontSize: z.string().optional(),
      fontWeight: z.string().optional(),
      lineHeight: z.string().optional(),
      fontFamily: z.string().optional(),
    }).optional(),
  }).optional(),
  children: z.array(z.any()).optional(),
});

const layoutSpecSchema = z.object({
  viewport: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
  container: z.object({
    maxWidth: z.string().optional(),
    padding: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
  }).optional(),
  sections: z.array(layoutSectionSchema),
  responsive: z.object({
    breakpoints: z.array(z.number()).optional(),
    behavior: z.string().optional(),
  }).optional(),
});

export type LayoutSpec = z.infer<typeof layoutSpecSchema>;
export type LayoutSection = z.infer<typeof layoutSectionSchema>;

export async function analyzeLayoutSpec(
  screenshot: ScreenshotResult,
  config: LLMConfig,
  logger?: Logger
): Promise<LayoutSpec> {
  const client = new OpenAI({ apiKey: config.apiKey });

  logger?.debug('Analyzing layout specification with vision model...');

  const base64Image = screenshot.buffer.toString('base64');

  const response = await client.chat.completions.create({
    model: config.model?.includes('vision') ? config.model : 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a design system expert. Analyze the webpage screenshot and create a detailed layout specification in JSON format that any LLM can use to recreate this design.

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
    response_format: { type: 'json_object' },
    max_tokens: 2500,
    temperature: 0.0,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty vision model response');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    logger?.error('Failed to parse JSON response', error);
    throw new Error('Invalid JSON response from vision model');
  }

  let spec: LayoutSpec;
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
