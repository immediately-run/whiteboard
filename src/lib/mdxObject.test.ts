import { describe, it, expect } from 'vitest';
import { parseView, serializeView } from './mdxObject';
import type { View } from './types';

describe('view codec (R3-400)', () => {
  it('round-trips a legacy point view unchanged (no w/h emitted)', () => {
    const v: View = { name: 'overview', cx: 800, cy: -200, zoom: 0.5 };
    const text = serializeView(v);
    expect(text).not.toContain('w:');
    expect(text).not.toContain('h:');
    const back = parseView('overview', text);
    expect(back).toEqual({ name: 'overview', cx: 800, cy: -200, zoom: 0.5 });
  });

  it('round-trips a rect view (w/h preserved)', () => {
    const v: View = { name: 'pacific', cx: 500, cy: 300, zoom: 0.5, w: 1000, h: 600 };
    const back = parseView('pacific', serializeView(v));
    expect(back.w).toBe(1000);
    expect(back.h).toBe(600);
    expect(back.cx).toBe(500);
    expect(back.cy).toBe(300);
  });

  it('omits w/h when absent on the model', () => {
    const text = serializeView({ name: 'v', cx: 1, cy: 2, zoom: 3 });
    expect(text).toContain('zoom: 3');
    expect(text).not.toContain('w:');
    expect(text).not.toContain('h:');
  });
});