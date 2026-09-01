// Shared colour resolution for the canvas object palette (WHITEBOARD_SPEC §3.4).
// The note palette is defined once, as named tokens (`var(--n-<color>)`), never
// hex-in-place — so StickyNote's fill and a shape's fill/stroke resolve through
// the SAME mapping, not a second copy (R3-398).

import type { NoteColor } from './types';

export const NOTE_COLORS: readonly NoteColor[] = [
  'lemon',
  'tangerine',
  'peach',
  'rose',
  'lilac',
  'sky',
  'mint',
  'graphite',
];

/** The palette token a note colour resolves to — the single mapping both StickyNote
 *  and ShapeObject consume. Absent colour means the default note (lemon). */
export function noteColorToken(color?: NoteColor): string {
  return `var(--n-${color ?? 'lemon'})`;
}

export interface ShapeColor {
  fill: string;
  stroke: string;
}

/** Fill + stroke for a shape object.
 *
 * A shape with NO `color` keeps the platform's historical accent-based appearance
 * byte-identical — that pair is the default branch, not a fallback that shifts hue.
 * A coloured shape resolves through the shared note palette with a TRANSLUCENT fill
 * so nested/overlapping shapes read as distinct regions rather than the topmost one
 * (the five-concentric-extent case); a distinct hue alone still occludes when one
 * shape contains another. Tokens only, so both themes stay legible.
 */
export function shapeColor(color?: NoteColor): ShapeColor {
  if (!color) {
    return {
      fill: 'color-mix(in oklab, var(--accent-2) 24%, var(--panel))',
      stroke: 'color-mix(in oklab, var(--accent-2) 60%, var(--line-2))',
    };
  }
  const token = noteColorToken(color);
  return {
    fill: `color-mix(in oklab, ${token} 45%, transparent)`,
    stroke: `color-mix(in oklab, ${token} 85%, var(--line-2))`,
  };
}
