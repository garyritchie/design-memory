import type { LayoutElement } from './layout.visualize.extract.js';
import { drawBox, getLabel } from './layout.visualize.draw.js';
import { filterAndSortElements } from './layout.visualize.filter.js';

export function renderASCIILayout(structure: LayoutElement[]): string {
  if (structure.length === 0) {
    return 'No layout structure detected';
  }

  const filtered = structure.filter(
    (s) => s.bounds.width > 50 && s.bounds.height > 30 && s.bounds.x >= 0 && s.bounds.y >= 0
  );

  if (filtered.length === 0) {
    return 'No significant layout elements detected';
  }

  const minX = Math.min(...filtered.map((s) => s.bounds.x));
  const minY = Math.min(...filtered.map((s) => s.bounds.y));
  const maxX = Math.max(...filtered.map((s) => s.bounds.x + s.bounds.width));
  const maxY = Math.max(...filtered.map((s) => s.bounds.y + s.bounds.height));

  const viewportWidth = Math.max(maxX - minX, 100);
  const viewportHeight = Math.max(maxY - minY, 100);

  const canvasWidth = 78;
  const canvasHeight = Math.min(
    30,
    Math.max(10, Math.floor((viewportHeight / viewportWidth) * canvasWidth))
  );
  const scaleX = canvasWidth / viewportWidth;
  const scaleY = canvasHeight / viewportHeight;

  const grid: string[][] = Array.from({ length: canvasHeight }, () =>
    Array.from({ length: canvasWidth }, () => ' ')
  );

  const topElements = filterAndSortElements(filtered);

  for (const elem of topElements) {
    const relX = elem.bounds.x - minX;
    const relY = elem.bounds.y - minY;
    const x1 = Math.max(0, Math.floor(relX * scaleX));
    const y1 = Math.max(0, Math.floor(relY * scaleY));
    const x2 = Math.min(canvasWidth - 1, Math.floor((relX + elem.bounds.width) * scaleX));
    const y2 = Math.min(canvasHeight - 1, Math.floor((relY + elem.bounds.height) * scaleY));

    if (x2 > x1 + 1 && y2 > y1 + 1) {
      drawBox(grid, x1, y1, x2, y2, getLabel(elem.selector));
    }
  }

  const lines = grid.map((row) => row.join(''));
  const hasContent = lines.some((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && trimmed.match(/[┌┐└┘│─]/);
  });

  if (!hasContent && topElements.length > 0) {
    const debug = topElements
      .slice(0, 3)
      .map((e) => {
        const relX = e.bounds.x - minX;
        const relY = e.bounds.y - minY;
        const x1 = Math.max(0, Math.floor(relX * scaleX));
        const y1 = Math.max(0, Math.floor(relY * scaleY));
        const x2 = Math.min(canvasWidth - 1, Math.floor((relX + e.bounds.width) * scaleX));
        const y2 = Math.min(canvasHeight - 1, Math.floor((relY + e.bounds.height) * scaleY));
        return `${e.selector}: ${e.bounds.x},${e.bounds.y} ${e.bounds.width}×${e.bounds.height} -> [${x1},${y1}]-[${x2},${y2}]`;
      })
      .join('\n');
    return `Page Layout (top-down view):\n\nFound ${filtered.length} elements but visualization failed.\nDebug:\n${debug}\nScale: ${scaleX.toFixed(4)}×${scaleY.toFixed(4)}\nCanvas: ${canvasWidth}×${canvasHeight}`;
  }

  return ['Page Layout (top-down view):', '', ...lines, ''].join('\n');
}
