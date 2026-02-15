import { z } from 'zod';

export const designDoctrineSchema = z.object({
  hierarchy: z.array(z.string()),
  principles: z.array(z.string()),
  constraints: z.array(z.string()),
  antiPatterns: z.array(z.string()),
});

export const qaChecklistSchema = z.object({
  items: z.array(
    z.object({
      category: z.string(),
      checks: z.array(z.string()),
    })
  ),
});
