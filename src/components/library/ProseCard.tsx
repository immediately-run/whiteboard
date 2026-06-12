// Plain MDX prose renders as a prose card (spec §3.4). Here the body is seed
// text; once live MDX-from-mount lands (V1 gate) this renders the compiled body.

import Badges from '../Badges';
import type { WObject } from '../../lib/types';

function ProseCard({ o }: { o: WObject }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '15px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
      }}
    >
      <div style={{ font: '700 15px/1.1 var(--disp)', color: 'var(--ink)' }}>{o.title}</div>
      <div style={{ font: 'var(--body-sm)', color: 'var(--ink-2)', textWrap: 'pretty' }}>{o.body}</div>
      <Badges o={o} />
    </div>
  );
}

export default ProseCard;
