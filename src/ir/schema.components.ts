import { z } from 'zod';
import { componentTypeSchema } from './schema.tokens.js';

export const componentRecipeSchema = z.object({
  type: componentTypeSchema,
  name: z.string(),
  styles: z.record(z.string(), z.string()),
  usage: z.string(),
  constraints: z.array(z.string()),
  do: z.array(z.string()),
  dont: z.array(z.string()),
});

export const layoutPrimitiveSchema = z.object({
  type: z.enum(['sidebar', 'topbar', 'container', 'grid', 'flex']),
  width: z.number().positive().optional(),
  breakpoints: z.array(z.number().positive()).optional(),
  evidence: z.array(z.string()),
});
