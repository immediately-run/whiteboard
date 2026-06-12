// Per-object status badges — the "designed, not broken" degraded states
// (DESIGN_BRIEF §1): invalid frontmatter, newer-schema read-only, locked, hidden.
// Non-color signifiers (icon + label) per the a11y note.

import Icon from './Icon';
import type { WObject } from '../lib/types';

function Badges({ o }: { o: WObject }) {
  const items = [];
  if (o.warn)
    items.push(
      <span
        key="w"
        title="Invalid frontmatter"
        style={{ display: 'inline-flex', color: '#7a5b00', background: 'rgba(255,200,40,.9)', borderRadius: 6, padding: 2 }}
      >
        <Icon name="alert" size={13} color="#3a2c00" strokeWidth={2} />
      </span>,
    );
  if (o.readonly)
    items.push(
      <span
        key="r"
        title="Newer schema — read-only"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
          color: '#2a2330',
          background: 'rgba(255,255,255,.6)',
          borderRadius: 6,
          padding: '2px 5px',
          font: 'var(--mono-xs)',
        }}
      >
        <Icon name="lock" size={11} color="#2a2330" strokeWidth={2} />
        read-only
      </span>,
    );
  if (o.locked)
    items.push(
      <span key="l" title="Locked" style={{ display: 'inline-flex', color: 'var(--note-ink)', opacity: 0.6 }}>
        <Icon name="lock" size={13} strokeWidth={2} />
      </span>,
    );
  if (o.hidden)
    items.push(
      <span key="h" title="Hidden" style={{ display: 'inline-flex', color: 'var(--note-ink)', opacity: 0.6 }}>
        <Icon name="eyeOff" size={13} strokeWidth={2} />
      </span>,
    );
  if (!items.length) return null;
  return <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 5, alignItems: 'center' }}>{items}</div>;
}

export default Badges;
