export * from './types.tokens.js';
export * from './types.components.js';
export * from './types.doctrine.js';

import type {
  ColorToken,
  TypographyToken,
  SpacingToken,
  RadiusToken,
  ElevationToken,
  CSSVariableToken,
  MotionToken,
  BreakpointToken,
  ClassAnalysisToken,
} from './types.tokens.js';
import type { ComponentRecipe, LayoutPrimitive } from './types.components.js';
import type { DesignDoctrine, QAChecklist } from './types.doctrine.js';

export interface DesignIR {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  radius: RadiusToken[];
  elevation: ElevationToken[];
  layout: LayoutPrimitive[];
  components: ComponentRecipe[];
  doctrine: DesignDoctrine;
  qa: QAChecklist;
  // Phase 2 additions
  variables?: CSSVariableToken[];
  motion?: MotionToken[];
  breakpoints?: BreakpointToken;
  classAnalysis?: ClassAnalysisToken;
}
