import { describe, it, expect } from 'vitest';
import { renderStyle } from './render.style.js';
import type { DesignIR } from '../ir/types.js';

describe('renderStyle', () => {
  it('renders style markdown', () => {
    const ir: DesignIR = {
      colors: [
        {
          hex: '#007bff',
          role: 'primary',
          evidence: ['button'],
          usage: ['buttons', 'links'],
        },
      ],
      typography: [
        {
          family: 'Arial',
          size: 16,
          weight: 400,
          lineHeight: 1.5,
          role: 'body',
          evidence: ['p'],
        },
      ],
      spacing: [{ value: 16, unit: 'px', evidence: ['div'] }],
      radius: [{ value: 4, unit: 'px', evidence: ['button'] }],
      elevation: [
        { shadow: '0 2px 4px rgba(0,0,0,0.1)', level: 1, evidence: ['card'] },
      ],
      layout: [],
      components: [],
      doctrine: {
        hierarchy: [],
        principles: [],
        constraints: [],
        antiPatterns: [],
      },
      qa: { items: [] },
    };

    const output = renderStyle(ir);
    expect(output).toContain('# Style Guide');
    expect(output).toContain('#007bff');
    expect(output).toContain('Arial');
  });
});
