import type { ComponentType } from './types.tokens.js';

export interface ComponentRecipe {
  type: ComponentType;
  name: string;
  styles: Record<string, string>;
  usage: string;
  constraints: string[];
  do: string[];
  dont: string[];
}

export interface LayoutPrimitive {
  type: 'sidebar' | 'topbar' | 'container' | 'grid' | 'flex';
  width?: number;
  breakpoints?: number[];
  evidence: string[];
}
