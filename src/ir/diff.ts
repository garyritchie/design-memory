import type { DesignIR, ColorToken, TypographyToken, ComponentRecipe } from './types.js';

export interface DesignDiff {
  colors: TokenDiff<ColorToken>;
  typography: TokenDiff<TypographyToken>;
  components: TokenDiff<ComponentRecipe>;
  variables: {
    added: string[];
    removed: string[];
    changed: Array<{ name: string; before: string; after: string }>;
  };
  summary: DiffSummary;
}

export interface TokenDiff<T> {
  added: T[];
  removed: T[];
  shared: T[];
}

export interface DiffSummary {
  totalChanges: number;
  addedCount: number;
  removedCount: number;
  changedCount: number;
  verdict: 'identical' | 'minor' | 'moderate' | 'major';
}

/**
 * Compare two DesignIRs and produce a detailed diff.
 */
export function diffDesignIRs(a: DesignIR, b: DesignIR): DesignDiff {
  const colors = diffByKey(a.colors, b.colors, (c) => c.hex);
  const typography = diffByKey(a.typography, b.typography, (t) => `${t.family}:${t.size}:${t.weight}`);
  const components = diffByKey(a.components, b.components, (c) => c.name);
  const variables = diffVariables(a.variables ?? [], b.variables ?? []);

  const addedCount = colors.added.length + typography.added.length + components.added.length + variables.added.length;
  const removedCount = colors.removed.length + typography.removed.length + components.removed.length + variables.removed.length;
  const changedCount = variables.changed.length;
  const totalChanges = addedCount + removedCount + changedCount;

  let verdict: DiffSummary['verdict'] = 'identical';
  if (totalChanges > 0 && totalChanges <= 5) verdict = 'minor';
  else if (totalChanges > 5 && totalChanges <= 20) verdict = 'moderate';
  else if (totalChanges > 20) verdict = 'major';

  return {
    colors,
    typography,
    components,
    variables,
    summary: { totalChanges, addedCount, removedCount, changedCount, verdict },
  };
}

function diffByKey<T>(aList: T[], bList: T[], keyFn: (item: T) => string): TokenDiff<T> {
  const aKeys = new Set(aList.map(keyFn));
  const bKeys = new Set(bList.map(keyFn));

  const added = bList.filter((item) => !aKeys.has(keyFn(item)));
  const removed = aList.filter((item) => !bKeys.has(keyFn(item)));
  const shared = aList.filter((item) => bKeys.has(keyFn(item)));

  return { added, removed, shared };
}

function diffVariables(
  aVars: Array<{ name: string; value: string }>,
  bVars: Array<{ name: string; value: string }>,
): DesignDiff['variables'] {
  const aMap = new Map(aVars.map((v) => [v.name, v.value]));
  const bMap = new Map(bVars.map((v) => [v.name, v.value]));

  const added: string[] = [];
  const removed: string[] = [];
  const changed: Array<{ name: string; before: string; after: string }> = [];

  for (const [name, value] of bMap) {
    if (!aMap.has(name)) {
      added.push(name);
    } else if (aMap.get(name) !== value) {
      changed.push({ name, before: aMap.get(name)!, after: value });
    }
  }

  for (const name of aMap.keys()) {
    if (!bMap.has(name)) {
      removed.push(name);
    }
  }

  return { added, removed, changed };
}

/**
 * Render a diff as a markdown report.
 */
export function renderDiffMarkdown(diff: DesignDiff, urlA: string, urlB: string): string {
  const s: string[] = [];

  s.push(`# Design Diff Report`);
  s.push('');
  s.push(`| | Source A | Source B |`);
  s.push(`|---|---|---|`);
  s.push(`| URL | ${urlA} | ${urlB} |`);
  s.push('');
  s.push(`## Summary: **${diff.summary.verdict}** changes`);
  s.push('');
  s.push(`- **${diff.summary.addedCount}** added`);
  s.push(`- **${diff.summary.removedCount}** removed`);
  s.push(`- **${diff.summary.changedCount}** changed`);
  s.push(`- **${diff.summary.totalChanges}** total`);
  s.push('');

  // Colors
  if (diff.colors.added.length || diff.colors.removed.length) {
    s.push(`## Colors`);
    s.push('');
    if (diff.colors.added.length) {
      s.push(`### Added`);
      for (const c of diff.colors.added) s.push(`- \`${c.hex}\` (${c.role})`);
      s.push('');
    }
    if (diff.colors.removed.length) {
      s.push(`### Removed`);
      for (const c of diff.colors.removed) s.push(`- \`${c.hex}\` (${c.role})`);
      s.push('');
    }
  }

  // Typography
  if (diff.typography.added.length || diff.typography.removed.length) {
    s.push(`## Typography`);
    s.push('');
    if (diff.typography.added.length) {
      s.push(`### Added`);
      for (const t of diff.typography.added) s.push(`- ${t.family} ${t.size}px/${t.weight} (${t.role})`);
      s.push('');
    }
    if (diff.typography.removed.length) {
      s.push(`### Removed`);
      for (const t of diff.typography.removed) s.push(`- ${t.family} ${t.size}px/${t.weight} (${t.role})`);
      s.push('');
    }
  }

  // Components
  if (diff.components.added.length || diff.components.removed.length) {
    s.push(`## Components`);
    s.push('');
    if (diff.components.added.length) {
      s.push(`### Added`);
      for (const c of diff.components.added) s.push(`- ${c.name} (${c.type})`);
      s.push('');
    }
    if (diff.components.removed.length) {
      s.push(`### Removed`);
      for (const c of diff.components.removed) s.push(`- ${c.name} (${c.type})`);
      s.push('');
    }
  }

  // Variables
  if (diff.variables.added.length || diff.variables.removed.length || diff.variables.changed.length) {
    s.push(`## CSS Variables`);
    s.push('');
    if (diff.variables.added.length) {
      s.push(`### Added`);
      for (const v of diff.variables.added) s.push(`- \`${v}\``);
      s.push('');
    }
    if (diff.variables.removed.length) {
      s.push(`### Removed`);
      for (const v of diff.variables.removed) s.push(`- \`${v}\``);
      s.push('');
    }
    if (diff.variables.changed.length) {
      s.push(`### Changed`);
      for (const v of diff.variables.changed) s.push(`- \`${v.name}\`: \`${v.before}\` → \`${v.after}\``);
      s.push('');
    }
  }

  return s.join('\n');
}
