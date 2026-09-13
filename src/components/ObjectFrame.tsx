// One absolutely-positioned canvas object frame, carrying its own
// translate/rotate/scale. Memoized and prop-driven (not context-driven) so that
// during a pan — when only the camera changes — unchanged object frames skip
// re-render and only the world transform + overlays update (spec §3.1 intent).
//
// In edit mode the frame is also the object's KEYBOARD presence (R3-607): a
// roving tab stop (the selected object, else the first, is THE one tabbable
// node), focusable with a name, and focusing it selects it — so the existing
// arrow-nudge and Delete (document-level, unchanged) become reachable without
// a pointer.

import { memo } from 'react';
import ObjectBody from './ObjectBody';
import type { Mode, WObject } from '../lib/types';

interface ObjectFrameProps {
  o: WObject;
  mode: Mode;
  boardRoot: string | null;
  objects: WObject[];
  /** Roving-tabindex contract: exactly one object per canvas is the tab stop. */
  tabStop: boolean;
  /** Focus selects (edit mode): the keyboard path into the SAME selection the
   *  pointer path writes. */
  onFocusObject: (id: string) => void;
  onPointerDown: (id: string, e: React.PointerEvent) => void;
  onHover: (id: string | null) => void;
}

function ObjectFrame({ o, mode, boardRoot, objects, tabStop, onFocusObject, onPointerDown, onHover }: ObjectFrameProps) {
  const editable = mode === 'edit' && !o.hidden;
  const style: React.CSSProperties = {
    position: 'absolute',
    left: o.x,
    top: o.y,
    width: o.w,
    height: o.h,
    transform: `rotate(${o.rot}deg) scale(${o.scale || 1})`,
    transformOrigin: 'center',
    zIndex: o.z || 0,
    cursor: mode === 'edit' ? (o.locked ? 'not-allowed' : 'move') : 'inherit',
    opacity: o.hidden ? (mode === 'edit' ? 0.4 : 0) : 1,
    pointerEvents: o.hidden && mode !== 'edit' ? 'none' : 'auto',
  };
  return (
    <div
      style={style}
      /* The roving stop: 0 on the one tabbable object, -1 on the rest, absent
       * outside edit mode (run mode has no keyboard selection). */
      tabIndex={editable ? (tabStop ? 0 : -1) : undefined}
      data-obj-id={o.id}
      role="group"
      aria-label={o.title || o.kind}
      onFocus={() => {
        if (editable) onFocusObject(o.id);
      }}
      onPointerDown={(e) => onPointerDown(o.id, e)}
      onMouseEnter={() => onHover(o.id)}
      onMouseLeave={() => onHover(null)}
    >
      <ObjectBody o={o} boardRoot={boardRoot} objects={objects} />
    </div>
  );
}

export default memo(ObjectFrame);
