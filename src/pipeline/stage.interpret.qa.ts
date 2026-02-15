import type {
  DesignIR,
  ColorToken,
  TypographyToken,
  ComponentRecipe,
  QAChecklist,
} from '../ir/types.js';

export function generateQAChecklist(
  ir: Partial<DesignIR>,
  colors: ColorToken[],
  typography: TypographyToken[],
  components: ComponentRecipe[]
): QAChecklist {
  const items: Array<{ category: string; checks: string[] }> = [];

  if (colors.length > 0) {
    items.push({
      category: 'Colors',
      checks: [
        'Verify all color tokens have proper contrast ratios (WCAG AA minimum)',
        'Check that primary and accent colors are clearly distinguishable',
        'Ensure text colors have sufficient contrast against backgrounds',
        'Validate color roles are semantically correct (primary, accent, etc.)',
      ],
    });
  }

  if (typography.length > 0) {
    items.push({
      category: 'Typography',
      checks: [
        'Verify font families are properly loaded and fallbacks are defined',
        'Check that heading sizes create clear visual hierarchy',
        'Ensure line heights provide comfortable reading experience',
        'Validate font weights are used consistently across the system',
      ],
    });
  }

  if (ir.spacing && ir.spacing.length > 0) {
    items.push({
      category: 'Spacing',
      checks: [
        'Verify spacing tokens are used consistently throughout components',
        'Check that spacing scale follows a logical progression',
        'Ensure adequate spacing for touch targets (minimum 44px)',
      ],
    });
  }

  if (components.length > 0) {
    items.push({
      category: 'Components',
      checks: [
        'Verify all components follow established patterns',
        'Check that component variants are clearly documented',
        'Ensure components are accessible (keyboard navigation, ARIA labels)',
        'Validate component usage guidelines are followed',
      ],
    });
  }

  return { items };
}
