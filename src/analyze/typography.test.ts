import { describe, it, expect } from 'vitest';
import { extractTypography } from './typography.js';
import type { ComputedStyle } from '../acquire/computedStyles.js';

describe('extractTypography', () => {
  it('extracts typography from computed styles', () => {
    const styles: ComputedStyle[] = [
      {
        selector: 'h1',
        properties: {
          fontFamily: 'Arial, sans-serif',
          fontSize: '32px',
          fontWeight: '700',
          lineHeight: '1.2',
        },
      },
      {
        selector: 'p',
        properties: {
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          fontWeight: '400',
          lineHeight: '1.5',
        },
      },
    ];

    const typography = extractTypography(styles);
    expect(typography.length).toBeGreaterThan(0);
    expect(typography.some((t) => t.size === 32)).toBe(true);
  });

  it('handles empty styles', () => {
    const typography = extractTypography([]);
    expect(typography).toEqual([]);
  });
});
