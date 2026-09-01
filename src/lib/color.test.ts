import { describe, it, expect } from 'vitest';
import { NOTE_COLORS, noteColorToken, shapeColor } from './color';

describe('noteColorToken', () => {
  it('resolves each of the 8 palette values to a distinct token', () => {
    const tokens = NOTE_COLORS.map(noteColorToken);
    expect(new Set(tokens).size).toBe(NOTE_COLORS.length);
  });

  it('defaults to the lemon token when colour is absent (matches StickyNote)', () => {
    expect(noteColorToken()).toBe('var(--n-lemon)');
  });
});

describe('shapeColor', () => {
  it('renders a visually distinct fill + stroke for each of the 8 palette values', () => {
    const fills = NOTE_COLORS.map((c) => shapeColor(c).fill);
    const strokes = NOTE_COLORS.map((c) => shapeColor(c).stroke);
    expect(new Set(fills).size).toBe(NOTE_COLORS.length);
    expect(new Set(strokes).size).toBe(NOTE_COLORS.length);
  });

  it('resolves a shape colour through the same token StickyNote uses', () => {
    for (const c of NOTE_COLORS) {
      const { fill, stroke } = shapeColor(c);
      const token = noteColorToken(c);
      expect(fill).toContain(token);
      expect(stroke).toContain(token);
    }
  });

  it('keeps a no-colour shape byte-identical to today (the historical token pair)', () => {
    expect(shapeColor()).toEqual({
      fill: 'color-mix(in oklab, var(--accent-2) 24%, var(--panel))',
      stroke: 'color-mix(in oklab, var(--accent-2) 60%, var(--line-2))',
    });
  });

  it('gives a coloured shape a translucent fill so nested regions stay distinct', () => {
    const { fill } = shapeColor('mint');
    expect(fill).toContain('transparent');
  });

  it('resolves from tokens, never hex-in-place (both themes stay legible)', () => {
    for (const c of NOTE_COLORS) {
      expect(shapeColor(c).fill).toMatch(/var\(--n-/);
      expect(shapeColor(c).stroke).toMatch(/var\(--n-/);
    }
  });
});
