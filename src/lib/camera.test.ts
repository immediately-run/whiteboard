import { describe, it, expect } from 'vitest';
import { cameraForTarget, fitRect, project } from './camera';
import type { Camera, ViewTarget } from './types';

describe('cameraForTarget', () => {
  it('keeps a legacy {cx, cy, zoom} view EXACTLY as today — no fit', () => {
    const v: ViewTarget = { cx: 800, cy: -200, zoom: 0.5 };
    expect(cameraForTarget(v, 1440, 900)).toEqual({ cx: 800, cy: -200, zoom: 0.5 });
    expect(cameraForTarget(v, 390, 604)).toEqual({ cx: 800, cy: -200, zoom: 0.5 });
  });

  it('fits a rect view to the usable viewport', () => {
    const v: ViewTarget = { cx: 500, cy: 300, zoom: 9, w: 1000, h: 600 };
    const cam = cameraForTarget(v, 1440, 900);
    expect(cam.zoom).toBeCloseTo(1.44);
    expect(cam.cx).toBe(500);
    expect(cam.cy).toBe(300);
  });

  it('honours the caption-band fitH during journey playback', () => {
    const v: ViewTarget = { cx: 0, cy: 0, zoom: 9, w: 100, h: 400 };
    const full = cameraForTarget(v, 390, 844);
    const journey = cameraForTarget(v, 390, 844 - 240);
    expect(full.zoom).toBeCloseTo(2.11);
    expect(journey.zoom).toBeCloseTo(1.51);
  });
});

describe('fitRect', () => {
  it('fits a world rect to a viewport: zoom = min(vw/w, vh/h), rect center at center', () => {
    // A 1000x600 world rect in a 1440x900 window: width-bound.
    const cam: Camera = fitRect(500, 300, 1000, 600, 1440, 900);
    expect(cam.cx).toBe(500);
    expect(cam.cy).toBe(300);
    expect(cam.zoom).toBeCloseTo(1.44);
  });

  it('frames the SAME content on a phone: the rect bounds land inside the usable band', () => {
    const rect = { cx: 500, cy: 300, w: 1000, h: 600 };
    const desktop: Camera = fitRect(rect.cx, rect.cy, rect.w, rect.h, 1440, 900);
    const phone: Camera = fitRect(rect.cx, rect.cy, rect.w, rect.h, 390, 844 - 240);

    // Rect corners must project inside the viewport in both cases.
    const corners: [number, number][] = [
      [rect.cx - rect.w / 2, rect.cy - rect.h / 2],
      [rect.cx + rect.w / 2, rect.cy - rect.h / 2],
      [rect.cx - rect.w / 2, rect.cy + rect.h / 2],
      [rect.cx + rect.w / 2, rect.cy + rect.h / 2],
    ];
    for (const cam of [desktop, phone]) {
      for (const [wx, wy] of corners) {
        const [sx, sy] = project(cam, { vw: cam === desktop ? 1440 : 390, vh: cam === desktop ? 900 : 844 - 240, vleft: 0, vtop: 0 }, wx, wy);
        expect(sx).toBeGreaterThanOrEqual(0);
        expect(sx).toBeLessThanOrEqual(cam === desktop ? 1440 : 390);
        expect(sy).toBeGreaterThanOrEqual(0);
        expect(sy).toBeLessThanOrEqual(cam === desktop ? 900 : 844 - 240);
      }
    }
    // The phone fits a smaller rect to the smaller usable band — the zoom is smaller.
    expect(phone.zoom).toBeLessThan(desktop.zoom);
  });

  it('honours a reduced usable height (caption band): subject clears it', () => {
    // A 100x400 world rect in a 390-wide viewport with only 604px usable
    // (844 - 240 caption band): the HEIGHT ratio drives the fit.
    const cam: Camera = fitRect(0, 0, 100, 400, 390, 844 - 240);
    expect(cam.zoom).toBeCloseTo(604 / 400);
  });

  it('clamps to the zoom bounds at extreme aspect mismatches', () => {
    // So tall that min(vw/w, fitH/h) falls below ZOOM_MIN (0.02).
    const wide: Camera = fitRect(0, 0, 10, 50000, 390, 844);
    expect(wide.zoom).toBeCloseTo(0.02);
  });
});