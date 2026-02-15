export type ColorRole =
  | 'primary'
  | 'accent'
  | 'surface'
  | 'text'
  | 'muted'
  | 'status-success'
  | 'status-warning'
  | 'status-error'
  | 'status-info'
  | 'unknown';

export type ComponentType =
  | 'button'
  | 'input'
  | 'card'
  | 'table'
  | 'modal'
  | 'navigation'
  | 'form'
  | 'unknown';

export interface ColorToken {
  hex: string;
  role: ColorRole;
  evidence: string[];
  usage: string[];
}

export interface TypographyToken {
  family: string;
  size: number;
  weight: number;
  lineHeight: number;
  role: 'heading' | 'body' | 'caption' | 'label' | 'unknown';
  evidence: string[];
}

export interface SpacingToken {
  value: number;
  unit: 'px' | 'rem' | 'em';
  evidence: string[];
}

export interface RadiusToken {
  value: number;
  unit: 'px' | 'rem' | 'em';
  evidence: string[];
}

export interface ElevationToken {
  shadow: string;
  level: number;
  evidence: string[];
}

export interface CSSVariableToken {
  name: string;
  value: string;
  source: 'root' | 'body';
}

export interface MotionToken {
  selector: string;
  property: 'transition' | 'animation' | 'transform';
  value: string;
}

export interface BreakpointToken {
  values: number[];
  raw: string[];
}

export interface ClassAnalysisToken {
  isTailwind: boolean;
  topClasses: string[];
  tailwindPatterns: string[];
}
