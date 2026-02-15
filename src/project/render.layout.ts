import type { DesignIR } from '../ir/types.js';
import type { LayoutSpec } from '../analyze/layout.spec.js';
import { renderLayoutSpec } from './render.layout.spec.js';

export function renderLayout(ir: DesignIR, layoutSpec?: LayoutSpec): string {
  const layouts = ir.layout
    .map((l) => {
      const parts = [`**${l.type}**`];
      if (l.width) {
        parts.push(`width: ${l.width}px`);
      }
      if (l.breakpoints && l.breakpoints.length > 0) {
        parts.push(`breakpoints: ${l.breakpoints.join(', ')}px`);
      }
      return `- ${parts.join(', ')} (${l.evidence.join(', ')})`;
    })
    .join('\n');

  const sections: string[] = [];

  if (layoutSpec) {
    sections.push(renderLayoutSpec(layoutSpec));
    sections.push('\n');
  } else {
    sections.push('# Layout System');
    sections.push('\n## Overview\n');
    sections.push('Layout specification was not generated. Using extracted primitives.\n');
  }

  if (layouts) {
    sections.push('## Primitives\n');
    sections.push(layouts);
    sections.push('\n## Guidelines\n');
    sections.push('- Use consistent spacing from the spacing tokens');
    sections.push('- Respect container widths and breakpoints');
    sections.push('- Follow the established grid/flex patterns');
    return sections.join('\n');
  }

  sections.push('## Overview\n');
  sections.push(
    'Layout primitives were not automatically detected from the extracted styles. This may indicate:'
  );
  sections.push('- The site uses CSS-in-JS or dynamically injected styles');
  sections.push('- Layout patterns are defined in JavaScript rather than static CSS');
  sections.push('- The page structure requires deeper analysis\n');
  sections.push('## Guidelines\n');
  sections.push(
    `- Use consistent spacing from the spacing tokens (${ir.spacing.length} tokens found)`
  );
  sections.push('- Follow responsive design principles');
  sections.push('- Maintain consistent container widths across breakpoints');
  sections.push('- Use flexbox or grid for layout as appropriate');

  return sections.join('\n');
}
