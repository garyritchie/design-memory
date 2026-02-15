import { extractLayoutStructure } from './layout.visualize.extract.js';
import { renderASCIILayout } from './layout.visualize.render.js';
import type { LayoutElement } from './layout.visualize.extract.js';

export interface LayoutVisualization {
  ascii: string;
  structure: LayoutElement[];
}

export async function visualizeLayout(url: string): Promise<LayoutVisualization> {
  const structure = await extractLayoutStructure(url);
  const ascii = renderASCIILayout(structure);
  return { ascii, structure };
}
