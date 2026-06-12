// rect / ellipse / diamond with token-based fill + stroke (spec §3.4).

import type { WObject } from '../../lib/types';

const FILL = 'color-mix(in oklab, var(--accent-2) 24%, var(--panel))';
const STROKE = 'color-mix(in oklab, var(--accent-2) 60%, var(--line-2))';

function ShapeObject({ o }: { o: WObject }) {
  const base: React.CSSProperties = { position: 'absolute', inset: 0, background: FILL, border: `1.5px solid ${STROKE}` };
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
