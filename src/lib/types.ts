// The in-memory document model. Per WHITEBOARD_SPEC §0/§2, "the file system is
// the document model": every object below is exactly one `objects/*.mdx` file,
// each view a `views/*.md`, each journey a `journeys/*.md`. This flat runtime
// shape maps onto the `whiteboard:` frontmatter namespace (§2.1) — geometry
// (position/size/scale/rotation/z/locked/hidden), kind, and connections — while
// title/tags live top-level by convention and the MDX body is the object body.
//
// The persistence/change layer (PollSource/WatchSource, §5.2) reads and writes
// these via the round-trip-safe discipline of §2.6; until that lands the store
// is seeded from `data/seedBoard.ts` (the demo board the design comp ships).

export type ObjectKind =
  | 'note'
  | 'prose'
  | 'label'
  | 'frame'
  | 'shape'
  | 'img'
  | 'video'
  | 'embed'
  | 'component';

export type NoteColor =
  | 'lemon'
  | 'tangerine'
  | 'peach'
  | 'rose'
  | 'lilac'
  | 'sky'
  | 'mint'
  | 'graphite';

export type ShapeKind = 'rect' | 'ellipse' | 'diamond';

export type ConnectionKind = 'arrow' | 'line';

export interface ConnectionStyle {
  stroke: 'accent' | 'ink';
  dash: boolean;
}

/** Directed, stored on the source object only (spec §2.1). */
export interface Connection {
  to: string;
  kind: ConnectionKind;
  label?: string;
  style: ConnectionStyle;
}

export interface WObject {
  id: string;
  kind: ObjectKind;

  // geometry — world-space CSS px at zoom 1.0 (the `whiteboard:` block, §2.1)
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  scale: number;
  z: number;
  locked?: boolean;
  hidden?: boolean;

  // content / presentation
  title?: string;
  tags?: string;
  color?: NoteColor; // note, shape
  shape?: ShapeKind; // shape
  body?: string; // prose
  origin?: string; // embed target origin
  loaded?: boolean; // img has a real asset
  loadedEmbed?: boolean; // embed click-to-load consumed
  error?: string; // a component body that threw

  // degraded-but-designed states (DESIGN_BRIEF §1, spec §2.5)
  warn?: boolean; // invalid frontmatter
  readonly?: boolean; // newer `schema` than this reader

  connections: Connection[];
}

/**
 * A saved camera position (`views/*.md`, §2.2). cx/cy = world point centered;
 * zoom = magnification. A view may OPTIONALLY carry a rect (`w`/`h`, world px,
 * centered on cx/cy) instead — the app then fits the rect to the viewport at
 * open time, so a view names a region, not just a magnification (R3-400).
 */
export interface View {
  name: string;
  cx: number;
  cy: number;
  zoom: number;
  w?: number;
  h?: number;
}

/** A camera target: a named view or an inline {cx, cy, zoom[, w, h]}. */
export type ViewTarget =
  | View
  | { cx: number; cy: number; zoom: number; w?: number; h?: number };

export interface JourneyStep {
  view: string | { cx: number; cy: number; zoom: number; w?: number; h?: number };
  caption?: string;
  /** Camera flight time in ms (R3-402 — the unit is stated in the spec + authoring guide). */
  duration?: number;
  /** Dwell in ms: after arriving, pause this long before AUTO-advancing. Absent =
   *  the journey stays input-driven (step through manually). Opt-in per step. */
  hold?: number;
}

export interface Journey {
  id: string;
  title: string;
  steps: JourneyStep[];
}

export interface Camera {
  cx: number;
  cy: number;
  zoom: number;
}

export type Mode = 'run' | 'edit';

export type Background = 'grid' | 'dots' | 'plain';

/** The host-overlay state screens the design ships (board chooser + empties). */
export type ScreenKind =
  | 'chooser'
  | 'empty'
  | 'noboard'
  | 'signedout'
  | 'notaboard'
  | null;

export interface Toast {
  id: number;
  text: string;
  icon: string;
  iconColor?: string;
  actionLabel?: string;
  onAction?: () => void;
}
