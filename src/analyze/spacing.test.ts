import { describe, it, expect } from 'vitest';
import { extractSpacing } from './spacing.js';
import type { ComputedStyle } from '../acquire/computedStyles.js';

describe('extractSpacing', () => {
  it('extracts spacing from computed styles', () => {
    const styles: ComputedStyle[] = [
      {
        selector: 'div',
        properties: {
          padding: '16px',
          margin: '8px',
        },
      },
    ];

    const spacing = extractSpacing(styles);
    expect(spacing.length).toBeGreaterThan(0);
    expect(spacing.some((s) => s.value === 16)).toBe(true);
  });

  it('handles empty styles', () => {
    const spacing = extractSpacing([]);
    expect(spacing).toEqual([]);
  });
});
