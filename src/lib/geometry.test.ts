import { describe, it, expect } from 'vitest';
import { containingFrame, tagChipSuppressed } from './geometry';
import type { WObject } from './types';

const frame = (id: string, x: number, y: number, w: number, h: number, tags?: string): WObject => ({
  id,
  kind: 'frame',
  x,
  y,
  w,
  h,
  rot: 0,
  scale: 1,
  z: 1,
  tags,
  connections: [],
});

const note = (id: string, x: number, y: number, tags?: string): WObject => ({
  id,
  kind: 'note',
  x,
  y,
  w: 100,
  h: 60,
  rot: 0,
  scale: 1,
  z: 2,
  tags,
  connections: [],
});

describe('containingFrame (R3-403)', () => {
  it('finds the frame that fully contains a note', () => {
    const f = frame('fr-eng', 0, 0, 500, 400, 'engineering');
    const n = note('n-1', 50, 50, 'engineering');
    expect(containingFrame([f, n], n)).toBe(f);
  });

  it('returns the innermost (smallest-area) frame when nested', () => {
    const outer = frame('fr-outer', 0, 0, 800, 600, 'outer');
    const inner = frame('fr-inner', 100, 100, 300, 200, 'inner');
    const n = note('n-1', 120, 120, 'inner');
    expect(containingFrame([outer, inner, n], n)).toBe(inner);
  });

  it('returns null when no frame contains the note', () => {
    const f = frame('fr-eng', 0, 0, 100, 100, 'engineering');
    const n = note('n-out', 500, 500, 'engineering');
    expect(containingFrame([f, n], n)).toBeNull();
  });

  it('returns null when the note has no frame at all', () => {
    const n = note('n-free', 0, 0, 'ops');
    expect(containingFrame([n], n)).toBeNull();
  });

  it('ignores non-frame objects', () => {
    const f = frame('fr-eng', 0, 0, 500, 400, 'engineering');
    const other = note('n-other', 0, 0, 'x');
    const n = note('n-1', 50, 50, 'engineering');
    expect(containingFrame([f, other, n], n)).toBe(f);
  });
});

describe('tagChipSuppressed (R3-403)', () => {
  it('suppresses the chip when the containing frame carries the same tag', () => {
    const f = frame('fr-eng', 0, 0, 500, 400, 'engineering');
    const n = note('n-1', 50, 50, 'engineering');
    expect(tagChipSuppressed(n, [f, n])).toBe(true);
  });

  it('does NOT suppress when the tags differ', () => {
    const f = frame('fr-eng', 0, 0, 500, 400, 'engineering');
    const n = note('n-1', 50, 50, 'design');
    expect(tagChipSuppressed(n, [f, n])).toBe(false);
  });

  it('does NOT suppress a note in no frame', () => {
    const n = note('n-free', 0, 0, 'ops');
    expect(tagChipSuppressed(n, [n])).toBe(false);
  });

  it('does NOT suppress when the note has no tag even inside a tagged frame', () => {
    const f = frame('fr-eng', 0, 0, 500, 400, 'engineering');
    const n = note('n-1', 50, 50);
    expect(tagChipSuppressed(n, [f, n])).toBe(false);
  });
});