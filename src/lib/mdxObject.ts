// The round-trip codec between the in-memory document model (`lib/types.ts`) and
// the on-disk `.mdx`/`.md` files that ARE the document (WHITEBOARD_SPEC §0/§2:
// "the file system is the document model"). One object ⇄ one `objects/<id>.mdx`,
// one view ⇄ one `views/<name>.md`, one journey ⇄ one `journeys/<id>.md`.
//
// The id/name is the filename stem and is NOT stored in the body. Geometry, kind,
// and the rest of the typed fields live in the frontmatter; for prose the MDX
// body region carries the object body. The format is a deliberately small,
// dependency-free YAML subset (the sandbox has no YAML lib): one `key: value`
// per line, each value emitted so that `parseScalar(dumpScalar(v)) === v`
// (§2.6 round-trip discipline), plus structured fields (`connections`, journey
// `steps`) as a single inline-JSON line — valid YAML flow syntax, trivially
// parsed back with `JSON.parse`.

import type { Background, Connection, Journey, JourneyStep, View, WObject } from './types';

type Scalar = string | number | boolean;

// Frontmatter keys we round-trip for an object, in stable emit order. `id` is the
// filename, `body` is the MDX body region, `connections` is a JSON line — all
// three are handled out of band, so they are absent here.
const OBJECT_KEYS: (keyof WObject)[] = [
  'kind', 'x', 'y', 'w', 'h', 'rot', 'scale', 'z', 'locked', 'hidden',
  'title', 'tags', 'color', 'shape', 'origin', 'loaded', 'loadedEmbed',
  'error', 'warn', 'readonly',
];

// --- scalar codec ----------------------------------------------------------

// A string is emitted verbatim unless doing so would round-trip to a different
// value: empty, surrounded by whitespace, opening with a YAML-structural char,
// or itself parseable as JSON (number/bool/null/quoted). Those get JSON-quoted.
function needsQuote(s: string): boolean {
  if (s === '' || s !== s.trim()) return true;
  if ('[{}"\'>|&*!#%@`,:'.includes(s[0])) return true;
  try {
    if (typeof JSON.parse(s) !== 'string') return true;
  } catch {
    /* not JSON — safe to emit raw */
  }
  return false;
}

function dumpScalar(v: Scalar): string {
  if (typeof v === 'string') return needsQuote(v) ? JSON.stringify(v) : v;
  return String(v);
}

// Mirror of dumpScalar: JSON if it parses (covers numbers, booleans, quoted
// strings, and the inline-JSON structured lines), otherwise the raw string.
function parseScalar(raw: string): unknown {
  const t = raw.trim();
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}

// --- frontmatter split -----------------------------------------------------

interface Doc {
  fm: Record<string, unknown>;
  body: string;
}

function splitDoc(text: string): Doc {
  const fm: Record<string, unknown> = {};
  const norm = text.replace(/\r\n/g, '\n');
  if (!norm.startsWith('---\n')) return { fm, body: norm.trim() };
  const end = norm.indexOf('\n---', 4);
  if (end === -1) return { fm, body: '' };
  const block = norm.slice(4, end);
  for (const line of block.split('\n')) {
    if (!line.trim()) continue;
    const i = line.indexOf(':');
    if (i === -1) continue;
    fm[line.slice(0, i).trim()] = parseScalar(line.slice(i + 1));
  }
  // Body is everything after the closing `---` line.
  const after = norm.slice(end + 4);
  return { fm, body: after.replace(/^\n/, '').trim() };
}

function frontmatter(lines: string[], body = ''): string {
  return `---\n${lines.join('\n')}\n---\n${body ? `${body}\n` : ''}`;
}

// --- objects ⇄ objects/<id>.mdx -------------------------------------------

export function serializeObject(o: WObject): string {
  const lines: string[] = [];
  for (const k of OBJECT_KEYS) {
    const v = o[k];
    if (v === undefined || v === null) continue;
    lines.push(`${k}: ${dumpScalar(v as Scalar)}`);
  }
  if (o.connections.length) lines.push(`connections: ${JSON.stringify(o.connections)}`);
  return frontmatter(lines, o.body ?? '');
}

export function parseObject(id: string, text: string): WObject {
  const { fm, body } = splitDoc(text);
  const num = (k: string, d: number) => (typeof fm[k] === 'number' ? (fm[k] as number) : d);
  const str = (k: string) => (typeof fm[k] === 'string' ? (fm[k] as string) : undefined);
  const bool = (k: string) => (fm[k] === true ? true : undefined);

  const o: WObject = {
    id,
    kind: (str('kind') as WObject['kind']) ?? 'note',
    x: num('x', 0),
    y: num('y', 0),
    w: num('w', 200),
    h: num('h', 148),
    rot: num('rot', 0),
    scale: num('scale', 1),
    z: num('z', 2),
    connections: Array.isArray(fm.connections) ? (fm.connections as Connection[]) : [],
  };
  const locked = bool('locked'); if (locked) o.locked = true;
  const hidden = bool('hidden'); if (hidden) o.hidden = true;
  const warn = bool('warn'); if (warn) o.warn = true;
  const readonly = bool('readonly'); if (readonly) o.readonly = true;
  const loaded = fm.loaded; if (typeof loaded === 'boolean') o.loaded = loaded;
  const loadedEmbed = fm.loadedEmbed; if (typeof loadedEmbed === 'boolean') o.loadedEmbed = loadedEmbed;
  const title = str('title'); if (title !== undefined) o.title = title;
  const tags = str('tags'); if (tags !== undefined) o.tags = tags;
  const color = str('color'); if (color) o.color = color as WObject['color'];
  const shape = str('shape'); if (shape) o.shape = shape as WObject['shape'];
  const origin = str('origin'); if (origin) o.origin = origin;
  const error = str('error'); if (error) o.error = error;
  if (body) o.body = body;
  return o;
}

// --- views ⇄ views/<name>.md ----------------------------------------------

export function serializeView(v: View): string {
  const lines = [`cx: ${v.cx}`, `cy: ${v.cy}`, `zoom: ${v.zoom}`];
  if (typeof v.w === 'number') lines.push(`w: ${v.w}`);
  if (typeof v.h === 'number') lines.push(`h: ${v.h}`);
  return frontmatter(lines);
}

export function parseView(name: string, text: string): View {
  const { fm } = splitDoc(text);
  const n = (k: string) => (typeof fm[k] === 'number' ? (fm[k] as number) : 0);
  const v: View = { name, cx: n('cx'), cy: n('cy'), zoom: typeof fm.zoom === 'number' ? (fm.zoom as number) : 1 };
  if (typeof fm.w === 'number') v.w = fm.w as number;
  if (typeof fm.h === 'number') v.h = fm.h as number;
  return v;
}

// --- journeys ⇄ journeys/<id>.md ------------------------------------------

export function serializeJourney(j: Journey): string {
  return frontmatter([`title: ${dumpScalar(j.title)}`, `steps: ${JSON.stringify(j.steps)}`]);
}

export function parseJourney(id: string, text: string): Journey {
  const { fm } = splitDoc(text);
  return {
    id,
    title: typeof fm.title === 'string' ? (fm.title as string) : id,
    steps: Array.isArray(fm.steps) ? (fm.steps as JourneyStep[]) : [],
  };
}

// --- board manifest ⇄ board.md ----------------------------------------------

/** What `board.md` contributes to a board (spec §2.4): name, background, schema. */
export interface BoardManifest {
  title?: string;
  background?: Background;
  /** The manifest's schema version; newer than the reader's marks the board readonly. */
  schema?: number;
}

/**
 * Parse a `board.md` manifest (spec §2.4). Tolerates absence and malformation —
 * returns a partial result with whatever fields parse, never throws (R-SPACES-11
 * degrade-never-throw: a malformed manifest must not stop the board loading).
 * `background` is either a bare kind (`dots`) or the `{ kind, size }` object the
 * app itself writes; `size` is a grid-pitch control the renderer does not yet
 * honour, so only `kind` is read (R3-401 settles the writer/model shape).
 */
export function parseManifest(text: string): BoardManifest {
  const m: BoardManifest = {};
  const { fm } = splitDoc(text);
  if (typeof fm.title === 'string' && fm.title) m.title = fm.title as string;
  if (typeof fm.schema === 'number') m.schema = fm.schema as number;
  const bg = fm.background;
  if (typeof bg === 'string') {
    // Bare kind (`dots`) or the `{ kind: grid, size: 24 }` inline object the
    // app writes (the YAML subset parser leaves it as a raw string).
    const bare = bgKind(bg.trim());
    if (bare) m.background = bare;
    else {
      const fromObj = bgKind(/kind\s*:\s*["']?([A-Za-z]+)/.exec(bg)?.[1]);
      if (fromObj) m.background = fromObj;
    }
  } else if (bg && typeof bg === 'object') {
    const kind = bgKind((bg as { kind?: unknown }).kind);
    if (kind) m.background = kind;
  }
  return m;
}

/** Accept a bare background kind or an object's `kind` value; validate the union. */
function bgKind(v: unknown): Background | null {
  if (v === 'grid' || v === 'dots' || v === 'plain') return v;
  return null;
}
