import type { DesignIR } from '../ir/types.js';
import type { LayoutSpec } from '../analyze/layout.spec.js';

/**
 * Layout structure skill: section-by-section layout with breakpoints.
 */
export function renderLayoutStructureSkill(ir: DesignIR, layoutSpec?: LayoutSpec): string {
  const sections: string[] = [];

  sections.push(`---
name: layout-structure
description: Page layout structure, section order, and responsive breakpoints.
---

## Page Structure
`);

  // Use layout spec from vision model if available
  if (layoutSpec?.sections) {
    for (const section of layoutSpec.sections) {
      sections.push(`### ${section.name} (\`${section.type}\`)\n`);
      sections.push(
        `- **Position:** vertical=${section.position.vertical}, horizontal=${section.position.horizontal}, order=${section.position.order}`
      );
      sections.push(`- **Layout pattern:** ${section.layout.pattern}`);
      if (section.layout.columns) sections.push(`  - Columns: ${section.layout.columns}`);
      if (section.layout.gap) sections.push(`  - Gap: ${section.layout.gap}`);
      if (section.layout.alignment) sections.push(`  - Alignment: ${section.layout.alignment}`);

      if (section.content) {
        if (section.content.title) sections.push(`- **Title:** "${section.content.title}"`);
        if (section.content.subtitle)
          sections.push(`- **Subtitle:** "${section.content.subtitle}"`);
      }

      if (section.styling) {
        const s = section.styling;
        const styleProps: string[] = [];
        if (s.backgroundColor) styleProps.push(`bg: ${s.backgroundColor}`);
        if (s.padding) styleProps.push(`padding: ${s.padding}`);
        if (s.maxWidth) styleProps.push(`max-width: ${s.maxWidth}`);
        if (styleProps.length > 0) sections.push(`- **Styling:** ${styleProps.join(', ')}`);
      }
      sections.push('');
    }
  } else {
    // Fall back to layout primitives
    if (ir.layout.length > 0) {
      for (const l of ir.layout) {
        const parts = [`**${l.type}**`];
        if (l.width) parts.push(`width: ${l.width}px`);
        if (l.breakpoints?.length) parts.push(`breakpoints: ${l.breakpoints.join(', ')}px`);
        sections.push(`- ${parts.join(', ')} (${l.evidence.join(', ')})`);
      }
    } else {
      sections.push(
        'No layout primitives detected. Use the design tokens and component patterns to infer layout.'
      );
    }
    sections.push('');
  }

  // Breakpoints
  sections.push(`## Responsive Breakpoints\n`);
  if (ir.breakpoints && ir.breakpoints.values.length > 0) {
    for (const bp of ir.breakpoints.values) {
      sections.push(`- **${bp}px**`);
    }
  } else {
    sections.push('No breakpoints extracted. Use common breakpoints: 640, 768, 1024, 1280px.');
  }

  sections.push(`
## Rules

- Follow the section order exactly as listed above.
- Match padding, max-width, and background colors per section.
- Use the detected layout pattern (grid, flex, centered, etc.) for each section.
- Responsive: stack columns on mobile, use the breakpoints above for transitions.
- Maintain visual hierarchy: hero → content sections → footer.
`);

  return sections.join('\n');
}
