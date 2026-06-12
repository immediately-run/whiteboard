// A board-authored React component that threw. Per spec §3.2 each object body
// renders inside an error boundary: a throwing component shows an error chip
// with the message and NEVER takes down the canvas. (The message, never a stack
// trace — DESIGN_BRIEF §1.)

import Icon from '../Icon';
import type { WObject } from '../../lib/types';

function ComponentError({ o }: { o: WObject }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 12,
        overflow: 'hidden',
        background: 'color-mix(in oklab, #e0484f 12%, var(--panel))',
        border: '1px solid color-mix(in oklab, #e0484f 40%, var(--line))',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#e0707a', font: 'var(--mono-xs)', letterSpacing: '.04em' }}>
        <Icon name="alert" size={14} strokeWidth={1.75} />
        {o.title}
      </div>
      <div style={{ font: 'var(--mono-sm)', color: 'var(--ink-2)', textWrap: 'pretty' }}>{o.error}</div>
      <div style={{ marginTop: 'auto', font: 'var(--mono-xs)', color: 'var(--ink-3)' }}>Component threw — canvas kept rendering.</div>
    </div>
  );
}

export default ComponentError;
