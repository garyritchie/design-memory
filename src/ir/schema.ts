export * from './schema.tokens.js';
export * from './schema.components.js';
export * from './schema.doctrine.js';

import { z } from 'zod';
import {
  colorTokenSchema,
  typographyTokenSchema,
  spacingTokenSchema,
  radiusTokenSchema,
  elevationTokenSchema,
} from './schema.tokens.js';
import { componentRecipeSchema, layoutPrimitiveSchema } from './schema.components.js';
import { designDoctrineSchema, qaChecklistSchema } from './schema.doctrine.js';

export const designIRSchema = z.object({
  colors: z.array(colorTokenSchema),
  typography: z.array(typographyTokenSchema),
  spacing: z.array(spacingTokenSchema),
  radius: z.array(radiusTokenSchema),
  elevation: z.array(elevationTokenSchema),
  layout: z.array(layoutPrimitiveSchema),
  components: z.array(componentRecipeSchema),
  doctrine: designDoctrineSchema,
  qa: qaChecklistSchema,
});
