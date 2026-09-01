// One absolutely-positioned canvas object frame, carrying its own
// translate/rotate/scale. Memoized and prop-driven (not context-driven) so that
// during a pan — when only the camera changes — unchanged object frames skip
// re-render and only the world transform + overlays update (spec §3.1 intent).

import { memo } from 'react';
import ObjectBody from './ObjectBody';
import type { Mode, WObject } from '../lib/types';

interface ObjectFrameProps {
  o: WObject;
  mode: Mode;
  boardRoot: string | null;
  objects: WObject[];
  onPointerDown: (id: string, e: React.PointerEvent) => void;
  onHover: (id: string | null) => void;
}

function ObjectFrame({ o, mode, boardRoot, objects, onPointerDown, onHover }: ObjectFrameProps) {
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
      onPointerDown={(e) => onPointerDown(o.id, e)}
      onMouseEnter={() => onHover(o.id)}
      onMouseLeave={() => onHover(null)}
    >
      <ObjectBody o={o} boardRoot={boardRoot} objects={objects} />
    </div>
  );
}

export default memo(ObjectFrame);
