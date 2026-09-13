// The dialog contract for the app's hand-rolled overlays (R3-607, R-IX-1):
// focus moves IN on open, Tab is TRAPPED inside, Escape closes, and focus
// RETURNS to the element that opened the dialog. One local spelling for every
// overlay until the SDK ships a host primitive — when it does, this hook's body
// swaps, not its callers.
//
// Region apps have no shared dialog primitive yet (the 2026-09-11 audit's HOST
// gap); one local spelling beats four.

import { useEffect, useRef } from 'react';

/** Elements that can hold focus inside the overlay. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Wire the dialog contract to an overlay root. Attach the returned ref to the
 * element that bounds the dialog (the panel, not the backdrop — Tab should be
 * trapped by the panel's own controls).
 *
 * @param open   the overlay's open state — the effect arms on true and cleans
 *               up (returning focus) on false/unmount.
 * @param onClose Escape's meaning: close without committing.
 */
export function useOverlayDialog(open: boolean, onClose: () => void) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    // The trigger to return to: captured BEFORE focus moves in.
    const trigger = document.activeElement as HTMLElement | null;
    const root = rootRef.current;
    const focusables = root ? [...root.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];
    // Focus IN: the first control (the close affordance is usually first); a
    // panel with no focusable content takes focus itself so Escape has a home.
    (focusables[0] ?? root)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !root) return;
      const list = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('disabled'));
      if (!list.length) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        // Focus escaped the trap somehow (a removed node): pull it back in.
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Capture phase: the contract runs before any app-level key handling.
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Focus RETURNS to the trigger (R-IX-1). Guarded: the trigger may be gone.
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, [open]);

  return rootRef;
}
