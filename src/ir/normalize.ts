import type { DesignIR } from './types.js';

export function normalizeDesignIR(ir: DesignIR): DesignIR {
  return {
    ...ir,
    colors: ir.colors.sort((a, b) => a.hex.localeCompare(b.hex)),
    typography: ir.typography.sort((a, b) => a.size - b.size),
    spacing: ir.spacing.sort((a, b) => a.value - b.value),
    radius: ir.radius.sort((a, b) => a.value - b.value),
    elevation: ir.elevation.sort((a, b) => a.level - b.level),
  };
}
