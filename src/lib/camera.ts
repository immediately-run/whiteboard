// Camera math for the single transformed canvas layer (spec §3.1). Pan/zoom
// mutate only `cam`; the world `<div>` carries one translate()+scale() so there
// is no per-frame React reconciliation of object DOM. All functions are pure.

import type { Camera } from './types';

export const ZOOM_MIN = 0.02;
export const ZOOM_MAX = 8;

export interface Viewport {
  vw: number;
  vh: number;
  vleft: number;
  vtop: number;
}

export function clampZoom(z: number): number {
  return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
}

/** World→screen translate of the canvas layer (so cam center sits mid-viewport). */
export function originX(cam: Camera, vw: number): number {
  return vw / 2 - cam.cx * cam.zoom;
}
export function originY(cam: Camera, vh: number): number {
  return vh / 2 - cam.cy * cam.zoom;
}

/** World point → screen-local px (relative to the canvas element's top-left). */
export function project(cam: Camera, vp: Viewport, wx: number, wy: number): [number, number] {
  return [originX(cam, vp.vw) + wx * cam.zoom, originY(cam, vp.vh) + wy * cam.zoom];
}

/** Screen-local px → world point. */
export function worldAt(cam: Camera, vp: Viewport, lx: number, ly: number): [number, number] {
  return [cam.cx + (lx - vp.vw / 2) / cam.zoom, cam.cy + (ly - vp.vh / 2) / cam.zoom];
}

/** New camera that zooms to `nz` while keeping the world point under (lx,ly) fixed. */
export function zoomAround(cam: Camera, vp: Viewport, nz: number, lx?: number, ly?: number): Camera {
  const z = clampZoom(nz);
  const ax = lx ?? vp.vw / 2;
  const ay = ly ?? vp.vh / 2;
  const wx = cam.cx + (ax - vp.vw / 2) / cam.zoom;
  const wy = cam.cy + (ay - vp.vh / 2) / cam.zoom;
  return {
    cx: wx - (ax - vp.vw / 2) / z,
    cy: wy - (ay - vp.vh / 2) / z,
    zoom: z,
  };
}
