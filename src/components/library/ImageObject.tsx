// Image from assets/, lazy-loaded with a shimmer skeleton first (spec §3.4,
// DESIGN_BRIEF §1 loading state). With no real asset wired yet, the loaded
// state shows a placeholder swatch.

import Icon from '../Icon';
import type { WObject } from '../../lib/types';

function ImageObject({ o }: { o: WObject }) {
  if (!o.loaded) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(100deg, transparent 20%, color-mix(in oklab, var(--ink) 8%, transparent) 50%, transparent 80%)',
            backgroundSize: '200% 100%',
            animation: 'wb-shimmer 1.4s linear infinite',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
          <Icon name="image" size={30} strokeWidth={1.5} />
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 12,
        overflow: 'hidden',
        background:
          'repeating-linear-gradient(45deg, color-mix(in oklab, var(--accent) 30%, var(--panel)) 0 10px, color-mix(in oklab, var(--accent-2) 30%, var(--panel)) 10px 20px)',
      }}
    />
  );
}

export default ImageObject;
