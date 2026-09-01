import { describe, it, expect } from 'vitest';
import { implausibleDuration } from './journey';

describe('implausibleDuration (R3-402)', () => {
  it('flags a duration that is a frame or less (a unit error or typo)', () => {
    expect(implausibleDuration(2)).toBe(true);
    expect(implausibleDuration(6)).toBe(true);
    expect(implausibleDuration(19)).toBe(true);
  });

  it('accepts a plausible flight time', () => {
    expect(implausibleDuration(800)).toBe(false);
    expect(implausibleDuration(1200)).toBe(false);
    expect(implausibleDuration(20)).toBe(false);
  });

  it('ignores an absent duration (defaults to 800ms flight)', () => {
    expect(implausibleDuration(undefined)).toBe(false);
  });

  it('ignores a zero duration (treated as instant, not a unit error)', () => {
    expect(implausibleDuration(0)).toBe(false);
  });
});