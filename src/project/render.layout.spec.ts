import type { LayoutSpec } from '../analyze/layout.spec.js';

export function renderLayoutSpec(spec: LayoutSpec): string {
  const sections: string[] = ['# Layout System', '## Structure Specification\n'];

  if (spec.viewport) {
    sections.push(`**Viewport:** ${spec.viewport.width}×${spec.viewport.height}px\n`);
  }

  if (spec.container) {
    const containerInfo: string[] = [];
    if (spec.container.maxWidth) containerInfo.push(`max-width: ${spec.container.maxWidth}`);
    if (spec.container.padding) containerInfo.push(`padding: ${spec.container.padding}`);
    if (spec.container.alignment) containerInfo.push(`alignment: ${spec.container.alignment}`);
    if (containerInfo.length > 0) {
      sections.push(`**Container:** ${containerInfo.join(', ')}\n`);
    }
  }

  sections.push('## Sections\n');

  for (const section of spec.sections) {
    sections.push(`### ${section.name} (${section.type})`);
    sections.push(`\n**Position:**`);
    sections.push(`- Vertical: ${section.position.vertical}`);
    sections.push(`- Horizontal: ${section.position.horizontal}`);
    sections.push(`- Order: ${section.position.order}`);

    sections.push(`\n**Layout Pattern:** ${section.layout.pattern}`);
    if (section.layout.columns) sections.push(`- Columns: ${section.layout.columns}`);
    if (section.layout.gap) sections.push(`- Gap: ${section.layout.gap}`);
    if (section.layout.alignment) sections.push(`- Alignment: ${section.layout.alignment}`);

    if (section.content) {
      sections.push(`\n**Content:**`);
      if (section.content.title) sections.push(`- Title: "${section.content.title}"`);
      if (section.content.subtitle) sections.push(`- Subtitle: "${section.content.subtitle}"`);
      if (section.content.text)
        sections.push(
          `- Text: "${section.content.text.slice(0, 100)}${section.content.text.length > 100 ? '...' : ''}"`
        );
      if (section.content.items && section.content.items.length > 0) {
        sections.push(`- Items: ${section.content.items.map((i) => `"${i}"`).join(', ')}`);
      }
    }

    if (section.styling) {
      const styleInfo: string[] = [];
      if (section.styling.width) styleInfo.push(`width: ${section.styling.width}`);
      if (section.styling.maxWidth) styleInfo.push(`max-width: ${section.styling.maxWidth}`);
      if (section.styling.padding) styleInfo.push(`padding: ${section.styling.padding}`);
      if (section.styling.margin) styleInfo.push(`margin: ${section.styling.margin}`);
      if (section.styling.backgroundColor)
        styleInfo.push(`background: ${section.styling.backgroundColor}`);
      if (section.styling.color) styleInfo.push(`color: ${section.styling.color}`);
      if (section.styling.borderRadius)
        styleInfo.push(`border-radius: ${section.styling.borderRadius}`);
      if (section.styling.border) styleInfo.push(`border: ${section.styling.border}`);
      if (styleInfo.length > 0) {
        sections.push(`\n**Styling:** ${styleInfo.join(', ')}`);
      }
    }

    if (section.visual) {
      sections.push(`\n**Visual Details:**`);
      if (section.visual.background) sections.push(`- Background: ${section.visual.background}`);
      if (section.visual.textColor) sections.push(`- Text Color: ${section.visual.textColor}`);
      if (section.visual.buttonStyle) {
        const btnStyle = section.visual.buttonStyle;
        const btnInfo: string[] = [];
        if (btnStyle.backgroundColor) btnInfo.push(`bg: ${btnStyle.backgroundColor}`);
        if (btnStyle.color) btnInfo.push(`text: ${btnStyle.color}`);
        if (btnStyle.border) btnInfo.push(`border: ${btnStyle.border}`);
        if (btnStyle.borderRadius) btnInfo.push(`radius: ${btnStyle.borderRadius}`);
        if (btnInfo.length > 0) {
          sections.push(`- Button Style: ${btnInfo.join(', ')}`);
        }
      }
      if (section.visual.typography) {
        const typo = section.visual.typography;
        const typoInfo: string[] = [];
        if (typo.fontSize) typoInfo.push(`size: ${typo.fontSize}`);
        if (typo.fontWeight) typoInfo.push(`weight: ${typo.fontWeight}`);
        if (typo.lineHeight) typoInfo.push(`line-height: ${typo.lineHeight}`);
        if (typo.fontFamily) typoInfo.push(`family: ${typo.fontFamily}`);
        if (typoInfo.length > 0) {
          sections.push(`- Typography: ${typoInfo.join(', ')}`);
        }
      }
    }

    if (section.children && section.children.length > 0) {
      sections.push(`\n**Children:** ${section.children.length} nested section(s)`);
    }

    sections.push('\n---\n');
  }

  if (spec.responsive) {
    sections.push('\n## Responsive Behavior\n');
    if (spec.responsive.breakpoints && spec.responsive.breakpoints.length > 0) {
      sections.push(`**Breakpoints:** ${spec.responsive.breakpoints.join('px, ')}px\n`);
    }
    if (spec.responsive.behavior) {
      sections.push(`**Behavior:** ${spec.responsive.behavior}\n`);
    }
  }

  sections.push('\n## Implementation Guidelines\n');
  sections.push('**CRITICAL:** Use this specification to recreate the EXACT design:');
  sections.push('\n### Layout:');
  sections.push('- Follow the position and order for each section');
  sections.push('- Apply the specified layout patterns (row, column, grid, flex)');
  sections.push('- Respect spacing, gaps, padding, and margins exactly as specified');
  sections.push('- Maintain the content hierarchy and relationships');
  sections.push('\n### Visual Styling:');
  sections.push('- Use EXACT colors specified (hex codes) - do not guess or use defaults');
  sections.push(
    '- Apply button styles exactly as specified (background, text color, border, radius)'
  );
  sections.push('- Use typography values (font size, weight, line height) as specified');
  sections.push('- Match background colors and text colors precisely');
  sections.push('\n### Important:');
  sections.push(
    '- If a button is specified as white background (#ffffff), use white - NOT blue or any other color'
  );
  sections.push('- If text is specified as a color, use that exact color');
  sections.push('- Follow all visual details to achieve pixel-perfect accuracy');
  sections.push('- Implement responsive behavior at specified breakpoints');

  return sections.join('\n');
}
