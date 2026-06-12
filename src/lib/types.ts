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
  color?: NoteColor; // note
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

/** A saved camera position (`views/*.md`, §2.2). cx/cy = world point centered. */
export interface View {
  name: string;
  cx: number;
  cy: number;
  zoom: number;
}

export interface JourneyStep {
  view: string | { cx: number; cy: number; zoom: number };
  caption?: string;
  duration?: number;
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
