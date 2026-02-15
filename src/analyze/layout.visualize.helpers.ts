export function getSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === 'string') {
    const firstClass = el.className.split(' ')[0];
    if (firstClass) return `${tag}.${firstClass}`;
  }
  return tag;
}

export function isSignificant(el: Element, rect: DOMRect): boolean {
  const tag = el.tagName.toLowerCase();
  const semanticTags = ['header', 'nav', 'main', 'aside', 'section', 'footer', 'article'];
  if (semanticTags.includes(tag)) return true;
  if (rect.width > 200 && rect.height > 100) return true;
  return false;
}
