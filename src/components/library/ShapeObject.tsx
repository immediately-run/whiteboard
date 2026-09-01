// rect / ellipse / diamond with token-based fill + stroke (spec §3.4). A shape
// honours its authored `color` through the shared note palette (R3-398); a shape
// with no color keeps the platform's historical accent appearance exactly.

import type { WObject } from '../../lib/types';
import { shapeColor } from '../../lib/color';

function ShapeObject({ o }: { o: WObject }) {
  const { fill, stroke } = shapeColor(o.color);
  const base: React.CSSProperties = { position: 'absolute', inset: 0, background: fill, border: `1.5px solid ${stroke}` };
  let inner: React.CSSProperties;
  if (o.shape === 'ellipse') inner = { ...base, borderRadius: '50%' };
  else if (o.shape === 'diamond') inner = { ...base, clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' };
  else inner = { ...base, borderRadius: 10 };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={inner} />
      {o.title ? (
        <div style={{ position: 'relative', font: '700 17px/1.1 var(--disp)', color: 'var(--ink)' }}>{o.title}</div>
      ) : null}
    </div>
  );
}

export default ShapeObject;
