import { describe, it, expect } from 'vitest';
import { parseJourney, parseManifest, parseView, serializeJourney, serializeView } from './mdxObject';
import type { Journey, View } from './types';

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

describe('board manifest (R3-401)', () => {
  it('reads title, schema and a bare background kind', () => {
    const m = parseManifest('---\ntitle: Pacific basin\nwhiteboard:\n  schema: 1\n  background: grid\n---\n');
    expect(m.title).toBe('Pacific basin');
    expect(m.schema).toBe(1);
    expect(m.background).toBe('grid');
  });

  it('reads the { kind, size } object background the app used to write', () => {
    const m = parseManifest('---\ntitle: Pacific basin\nwhiteboard:\n  schema: 1\n  background: { kind: dots, size: 24 }\n---\n');
    expect(m.background).toBe('dots');
  });

  it('returns an empty result for a manifest with nothing useful', () => {
    expect(parseManifest('---\n---\n')).toEqual({});
    expect(parseManifest('not a manifest')).toEqual({});
  });

  it('tolerates an unparseable body without throwing', () => {
    expect(() => parseManifest('---\nno-colon-here\n---\n')).not.toThrow();
  });
});

describe('journey codec (R3-402)', () => {
  it('round-trips hold and duration on steps', () => {
    const j: Journey = {
      id: 'walkthrough',
      title: 'Investor walkthrough',
      steps: [
        { view: 'overview', duration: 1200 },
        { view: 'pricing-detail', hold: 2000, caption: 'Start here.' },
      ],
    };
    const back = parseJourney('walkthrough', serializeJourney(j));
    expect(back.steps[0].duration).toBe(1200);
    expect(back.steps[1].hold).toBe(2000);
    expect(back.steps[1].caption).toBe('Start here.');
  });

  it('steps without hold round-trip unchanged', () => {
    const j: Journey = { id: 'v', title: 'V', steps: [{ view: 'a' }, { view: 'b', duration: 800 }] };
    const back = parseJourney('v', serializeJourney(j));
    expect(back.steps[0].hold).toBeUndefined();
    expect(back.steps[0].duration).toBeUndefined();
    expect(back.steps[1].duration).toBe(800);
  });
});