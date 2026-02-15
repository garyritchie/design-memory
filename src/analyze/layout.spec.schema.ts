import { z } from 'zod';

export const layoutSectionSchema = z.object({
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
  visual: z
    .object({
      background: z.string().optional(),
      textColor: z.string().optional(),
      buttonStyle: z
        .object({
          backgroundColor: z.string().optional(),
          color: z.string().optional(),
          border: z.string().optional(),
          borderRadius: z.string().optional(),
        })
        .optional(),
      typography: z
        .object({
          fontSize: z.string().optional(),
          fontWeight: z.string().optional(),
          lineHeight: z.string().optional(),
          fontFamily: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  children: z.array(z.any()).optional(),
});

export const layoutSpecSchema = z.object({
  viewport: z
    .object({
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  container: z
    .object({
      maxWidth: z.string().optional(),
      padding: z.string().optional(),
      alignment: z.enum(['left', 'center', 'right']).optional(),
    })
    .optional(),
  sections: z.array(layoutSectionSchema),
  responsive: z
    .object({
      breakpoints: z.array(z.number()).optional(),
      behavior: z.string().optional(),
    })
    .optional(),
});

export type LayoutSpec = z.infer<typeof layoutSpecSchema>;
export type LayoutSection = z.infer<typeof layoutSectionSchema>;
