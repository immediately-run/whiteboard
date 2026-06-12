// Video over an assets/ file — poster + play affordance (spec §3.4).

import Icon from '../Icon';
import type { WObject } from '../../lib/types';

function VideoObject({ o }: { o: WObject }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 12,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1230, #0d1622)',
        border: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, rgba(255,255,255,.025) 0 8px, transparent 8px 16px)' }} />
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: 'rgba(255,255,255,.92)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(0,0,0,.4)',
        }}
      >
        <span style={{ marginLeft: 3, color: '#16101a' }}>
          <Icon name="play" size={22} color="#16101a" strokeWidth={0} />
        </span>
      </div>
      <div style={{ position: 'absolute', bottom: 10, left: 12, font: 'var(--mono-xs)', color: 'rgba(255,255,255,.85)' }}>{o.title}</div>
    </div>
  );
}

export default VideoObject;
