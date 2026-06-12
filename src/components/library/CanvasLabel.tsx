// Large canvas text (spec §3.4), painted with the signature gradient.

import type { WObject } from '../../lib/types';

function CanvasLabel({ o }: { o: WObject }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          font: '800 76px/.9 var(--disp)',
          letterSpacing: '-.04em',
          background: 'var(--grad)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          whiteSpace: 'nowrap',
        }}
      >
        {o.title}
      </div>
    </div>
  );
}

export default CanvasLabel;
