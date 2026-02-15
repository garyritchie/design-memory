import OpenAI from 'openai';
import type { ScreenshotResult } from '../acquire/screenshots.js';
import type { LLMConfig } from '../interpret/llm.client.js';
import type { Logger } from 'loglevel';
import { parseVisionResponse } from './layout.vision.parse.js';
import { buildLayoutVisionPrompt } from './layout.vision.prompt.js';

export interface LayoutVisualization {
  ascii: string;
  description: string;
}

export async function visualizeLayoutWithVision(
  screenshot: ScreenshotResult,
  config: LLMConfig,
  logger?: Logger
): Promise<LayoutVisualization> {
  const client = new OpenAI({ apiKey: config.apiKey });

  logger?.debug('Analyzing layout with vision model...');

  const base64Image = screenshot.buffer.toString('base64');

  const response = await client.chat.completions.create({
    model: config.model?.includes('vision') ? config.model : 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a design system expert specializing in precise layout analysis. Your task is to create a highly accurate ASCII art diagram (95-99% accuracy) of the webpage layout.

CRITICAL REQUIREMENTS FOR ACCURACY:
1. HORIZONTAL LAYOUT IS CRITICAL:
   - If cards are side-by-side, show them SIDE-BY-SIDE in the diagram (not stacked)
   - If there's a left sidebar, show it on the LEFT with proper width
   - If there's a right sidebar, show it on the RIGHT with proper width
   - If content is centered with gaps on sides, show the gaps (use spaces or padding)
   - If elements are in columns, show columns next to each other horizontally

2. SPATIAL ACCURACY:
   - Show EXACT left/right positioning - don't center everything
   - If header logo is on left, show it on LEFT
   - If nav items are in center, show them in CENTER
   - If buttons are on right, show them on RIGHT
   - Show padding/margins/gaps accurately (use spaces or visual indicators)

3. VERTICAL AND HORIZONTAL RELATIONSHIPS:
   - What's above/below (vertical stacking)
   - What's left/right (horizontal positioning)
   - What's nested inside containers
   - Show both dimensions accurately

4. USE BOX-DRAWING CHARACTERS: ┌ ┐ └ ┘ │ ─ ├ ┤ ┬ ┴
   - Use these to show containers, sections, cards
   - Show side-by-side elements with proper spacing between them

5. LABEL ALL SECTIONS:
   - "Header: Logo | Nav: Product|Resources|Pricing | Buttons: Log in|Sign up"
   - "Hero: [Main Heading Text] | [Subtext] | [CTA Button]"
   - "Card 1: [Title]" | "Card 2: [Title]" | "Card 3: [Title]" (if side-by-side)
   - Show actual text content when readable

6. PROPORTIONS:
   - If header is thin (5% height), make it thin
   - If hero is tall (30% height), make it tall
   - If sidebar is narrow (20% width), make it narrow
   - If main content is wide (60% width), make it wide

7. GAPS AND SPACING:
   - Show left/right margins/padding
   - Show gaps between side-by-side elements
   - Don't assume everything is full-width or centered

8. Keep diagram within 78 characters wide, but use full width to show accurate horizontal layout`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: buildLayoutVisionPrompt(screenshot.width, screenshot.height),
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
    max_tokens: 3000,
    temperature: 0.0,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Empty vision model response');
  }

  const { ascii, description } = parseVisionResponse(content, logger);

  logger?.debug('Layout visualization generated');

  return { ascii, description };
}
