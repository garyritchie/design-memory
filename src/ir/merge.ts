import type { DesignIR } from './types.js';

export function mergeDesignIRs(a: DesignIR, b: DesignIR): DesignIR {
  return {
    colors: [...a.colors, ...b.colors],
    typography: [...a.typography, ...b.typography],
    spacing: [...a.spacing, ...b.spacing],
    radius: [...a.radius, ...b.radius],
    elevation: [...a.elevation, ...b.elevation],
    layout: [...a.layout, ...b.layout],
    components: [...a.components, ...b.components],
    doctrine: {
      hierarchy: [...a.doctrine.hierarchy, ...b.doctrine.hierarchy],
      principles: [...a.doctrine.principles, ...b.doctrine.principles],
      constraints: [...a.doctrine.constraints, ...b.doctrine.constraints],
      antiPatterns: [...a.doctrine.antiPatterns, ...b.doctrine.antiPatterns],
    },
    qa: {
      items: [...a.qa.items, ...b.qa.items],
    },
  };
}
