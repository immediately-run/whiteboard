// A titled grouping rectangle behind its contents (spec §3.4 — visual only; no
// grouping semantics in v1, §9). The title chip rides the top hairline.

import type { WObject } from '../../lib/types';

function CanvasFrame({ o }: { o: WObject }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        border: '1px solid var(--line-2)',
        borderRadius: 14,
        background: 'color-mix(in oklab, var(--panel) 28%, transparent)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -13,
          left: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 11px',
          background: 'var(--panel)',
          border: '1px solid var(--line-2)',
          borderRadius: 'var(--r-pill)',
          font: 'var(--mono-xs)',
          letterSpacing: '.05em',
          textTransform: 'uppercase',
          color: 'var(--ink-2)',
        }}
      >
        {o.title}
      </div>
    </div>
  );
}

export default CanvasFrame;
