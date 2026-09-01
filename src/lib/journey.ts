// Journey-step validation helpers (R3-402). The unit trap: `duration` is camera
// FLIGHT time in ms, and a value small enough to be a frame (< 20ms at 60fps) is
// a unit error or a typo that would silently teleport — flag it for the author
// rather than rendering it as an instant jump.

/** True when a step's duration is implausibly small to be a flight in ms. */
export function implausibleDuration(duration?: number): boolean {
  return typeof duration === 'number' && duration > 0 && duration < 20;
}