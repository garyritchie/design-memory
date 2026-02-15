import { extractColors } from '../analyze/colors.js';
import { extractTypography } from '../analyze/typography.js';
import { extractSpacing } from '../analyze/spacing.js';
import { extractRadius } from '../analyze/radius.js';
import { extractElevation } from '../analyze/elevation.js';
import { extractLayout } from '../analyze/layout.js';
import { detectComponents } from '../analyze/components.detect.js';
import { extractMotion } from '../analyze/motion.js';
import { analyzeClasses } from '../analyze/classes.js';
import { analyzeBreakpoints } from '../analyze/breakpoints.js';
import type { CaptureBundle } from '../acquire/capture.js';
import type { DesignIR } from '../ir/types.js';
import type { Logger } from 'loglevel';

export function runAnalyzeStage(bundle: CaptureBundle, logger?: Logger): Partial<DesignIR> {
  logger?.info('Analyzing captured data');

  const classAnalysis = analyzeClasses(bundle.crawl.html);
  const breakpointAnalysis = analyzeBreakpoints(bundle.crawl.html);
  const motion = extractMotion(bundle.styles);

  logger?.info(
    `Found ${bundle.variables.length} CSS variables, ${classAnalysis.tailwindPatterns.length} Tailwind classes, ${breakpointAnalysis.breakpoints.length} breakpoints, ${motion.length} motion tokens`
  );

  return {
    colors: extractColors(bundle.styles),
    typography: extractTypography(bundle.styles),
    spacing: extractSpacing(bundle.styles),
    radius: extractRadius(bundle.styles),
    elevation: extractElevation(bundle.styles),
    layout: extractLayout(bundle.styles),
    components: detectComponents(bundle.styles),
    // Phase 2 additions
    variables: bundle.variables,
    motion,
    breakpoints: {
      values: breakpointAnalysis.breakpoints,
      raw: breakpointAnalysis.raw,
    },
    classAnalysis,
  };
}
