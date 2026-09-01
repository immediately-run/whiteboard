// THE signature object (DESIGN_BRIEF §1): a colored note card with the brand's
// asymmetric dog-ear corner and cheap hard-offset shadow. Color is a palette
// token (`var(--n-<color>)`), never hex-in-place.

import Badges from '../Badges';
import type { WObject } from '../../lib/types';
import { noteColorToken } from '../../lib/color';
import { tagChipSuppressed } from '../../lib/geometry';

function StickyNote({ o, objects }: { o: WObject; objects: WObject[] }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: noteColorToken(o.color),
        color: 'var(--note-ink)',
        borderRadius: '2px 2px 2px 16px',
        padding: '14px 15px',
        boxShadow: 'var(--note-shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        overflow: 'hidden',
      }}
    >
      {o.tags && !tagChipSuppressed(o, objects) ? (
        <div style={{ font: 'var(--mono-xs)', letterSpacing: '.05em', textTransform: 'uppercase', opacity: 0.5 }}>
          {`#${o.tags}`}
        </div>
      ) : null}
      <div style={{ font: '600 16.5px/1.3 var(--sans)', textWrap: 'pretty' }}>{o.title}</div>
      <Badges o={o} />
    </div>
  );
}

export default StickyNote;
