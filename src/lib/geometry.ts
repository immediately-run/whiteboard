// Pure hit-testing and connection-anchor geometry, shared by the gesture hook
// and the connection/overlay renderers.

import { project } from './camera';
import type { Viewport } from './camera';
import type { Camera, WObject } from './types';

/**
 * The point on object `o`'s bounding box edge that lies on the ray from its
 * centre toward (tx,ty). Used to anchor connections to "nearest sides" (§3.1).
 */
export function anchorPoint(o: WObject, tx: number, ty: number): [number, number] {
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  const sx = Math.abs(dx) < 1e-6 ? Infinity : o.w / 2 / Math.abs(dx);
  const sy = Math.abs(dy) < 1e-6 ? Infinity : o.h / 2 / Math.abs(dy);
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

/** Ids of objects whose projected bounds intersect a screen-local rectangle. */
export function objectsInRect(
  objects: WObject[],
  cam: Camera,
  vp: Viewport,
  x: number,
  y: number,
  w: number,
  h: number,
): string[] {
  const out: string[] = [];
  for (const o of objects) {
    const [sx, sy] = project(cam, vp, o.x, o.y);
    const sw = o.w * cam.zoom;
    const sh = o.h * cam.zoom;
    if (sx < x + w && sx + sw > x && sy < y + h && sy + sh > y) out.push(o.id);
  }
  return out;
}

/** Topmost object id under a screen-local point, optionally excluding one id. */
export function objectAtLocal(
  objects: WObject[],
  cam: Camera,
  vp: Viewport,
  lx: number,
  ly: number,
  exclude?: string,
): string | null {
  let hit: string | null = null;
  for (const o of objects) {
    if (o.id === exclude) continue;
    const [sx, sy] = project(cam, vp, o.x, o.y);
    if (lx >= sx && lx <= sx + o.w * cam.zoom && ly >= sy && ly <= sy + o.h * cam.zoom) hit = o.id;
  }
  return hit;
}

/** The frame (kind `frame`) that fully contains `o`, innermost (smallest area)
 *  wins. Axis-aligned bounds; a frame is how grouping is drawn on a board
 *  (R3-403 — a note inside a frame carrying the same tag wears the group name
 *  twice, once on the frame and once on the card). */
export function containingFrame(objects: WObject[], o: WObject): WObject | null {
  let best: WObject | null = null;
  for (const f of objects) {
    if (f.kind !== 'frame') continue;
    if (f.x <= o.x && f.y <= o.y && f.x + f.w >= o.x + o.w && f.y + f.h >= o.y + o.h) {
      if (!best || f.w * f.h < best.w * best.h) best = f;
    }
  }
  return best;
}

/** A note's tag chip is redundant when a containing frame already carries the
 *  same tag — the group name is on screen once, on the frame (R3-403). */
export function tagChipSuppressed(note: WObject, objects: WObject[]): boolean {
  const frame = containingFrame(objects, note);
  return !!frame && typeof frame.tags === 'string' && frame.tags === note.tags;
}
