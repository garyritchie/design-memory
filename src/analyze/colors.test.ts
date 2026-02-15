import { describe, it, expect } from 'vitest';
import { extractColors } from './colors.js';
import type { ComputedStyle } from '../acquire/computedStyles.js';

describe('extractColors', () => {
  it('extracts colors from computed styles', () => {
    const styles: ComputedStyle[] = [
      {
        selector: 'button',
        properties: {
          backgroundColor: '#007bff',
          color: '#ffffff',
        },
      },
      {
        selector: 'div',
        properties: {
          backgroundColor: '#f0f0f0',
        },
      },
    ];

    const colors = extractColors(styles);
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.some((c) => c.hex === '#007bff')).toBe(true);
  });

  it('handles empty styles', () => {
    const colors = extractColors([]);
    expect(colors).toEqual([]);
  });
});
