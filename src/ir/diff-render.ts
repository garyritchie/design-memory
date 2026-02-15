import type { DesignDiff } from './diff.js';

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

  renderTokenSection(
    s,
    'Colors',
    diff.colors.added,
    diff.colors.removed,
    (c) => `\`${c.hex}\` (${c.role})`
  );
  renderTokenSection(
    s,
    'Typography',
    diff.typography.added,
    diff.typography.removed,
    (t) => `${t.family} ${t.size}px/${t.weight} (${t.role})`
  );
  renderTokenSection(
    s,
    'Components',
    diff.components.added,
    diff.components.removed,
    (c) => `${c.name} (${c.type})`
  );
  renderVariablesSection(s, diff.variables);

  return s.join('\n');
}

function renderTokenSection<T>(
  s: string[],
  title: string,
  added: T[],
  removed: T[],
  fmt: (item: T) => string
): void {
  if (!added.length && !removed.length) return;
  s.push(`## ${title}`);
  s.push('');
  if (added.length) {
    s.push(`### Added`);
    for (const item of added) s.push(`- ${fmt(item)}`);
    s.push('');
  }
  if (removed.length) {
    s.push(`### Removed`);
    for (const item of removed) s.push(`- ${fmt(item)}`);
    s.push('');
  }
}

function renderVariablesSection(s: string[], vars: DesignDiff['variables']): void {
  if (!vars.added.length && !vars.removed.length && !vars.changed.length) return;
  s.push(`## CSS Variables`);
  s.push('');
  if (vars.added.length) {
    s.push(`### Added`);
    for (const v of vars.added) s.push(`- \`${v}\``);
    s.push('');
  }
  if (vars.removed.length) {
    s.push(`### Removed`);
    for (const v of vars.removed) s.push(`- \`${v}\``);
    s.push('');
  }
  if (vars.changed.length) {
    s.push(`### Changed`);
    for (const v of vars.changed) s.push(`- \`${v.name}\`: \`${v.before}\` → \`${v.after}\``);
    s.push('');
  }
}
