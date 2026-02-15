export function getElementLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (tag === 'header') return 'Header';
  if (tag === 'nav') return 'Navigation';
  if (tag === 'main') return 'Main';
  if (tag === 'aside') return 'Sidebar';
  if (tag === 'footer') return 'Footer';
  if (tag === 'section') {
    const text = el.textContent?.trim().slice(0, 30) || '';
    return text ? `Section: ${text}` : 'Section';
  }
  return tag;
}

export function isSignificantElement(el: Element, rect: DOMRect): boolean {
  const tag = el.tagName.toLowerCase();
  const semanticTags = ['header', 'nav', 'main', 'aside', 'section', 'footer', 'article'];
  if (semanticTags.includes(tag)) return true;
  if (rect.width > 300 && rect.height > 150) return true;
  if (rect.width > 200 && rect.height > 300) return true;
  return false;
}
