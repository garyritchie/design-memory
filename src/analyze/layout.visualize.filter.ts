import type { LayoutElement } from './layout.visualize.extract.js';

export function filterAndSortElements(elements: LayoutElement[]): LayoutElement[] {
  const semanticTags = ['header', 'nav', 'main', 'aside', 'section', 'footer'];

  return elements
    .filter((s, i, arr) => {
      return !arr.some((other, j) => {
        if (i === j) return false;
        const contains =
          other.bounds.x <= s.bounds.x &&
          other.bounds.y <= s.bounds.y &&
          other.bounds.x + other.bounds.width >= s.bounds.x + s.bounds.width &&
          other.bounds.y + other.bounds.height >= s.bounds.y + s.bounds.height;
        return contains && semanticTags.includes(other.tag) && !semanticTags.includes(s.tag);
      });
    })
    .sort((a, b) => {
      const aSemantic = semanticTags.includes(a.tag) ? 1 : 0;
      const bSemantic = semanticTags.includes(b.tag) ? 1 : 0;
      if (aSemantic !== bSemantic) return bSemantic - aSemantic;
      if (a.bounds.y !== b.bounds.y) return a.bounds.y - b.bounds.y;
      return a.bounds.x - b.bounds.x;
    })
    .slice(0, 12);
}
