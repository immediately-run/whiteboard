// The board chooser (spec §6.1): boards grouped by space, each space showing its
// role (can-edit / read-only). "Add a space" and "Open folder" route to the host
// powerbox / pick-file — space-granting authority stays with the host, never the
// app (the footnote says so out loud). Demo spaces stand in until live mounts
// hydrate this from `boards.json` + the space list.

import { useWb } from '../hooks/useWhiteboardCtx';
import Icon from './Icon';

interface Board {
  n: string;
  m: string;
  cur?: boolean;
}
interface Space {
  name: string;
  role: 'rw' | 'ro';
  boards: Board[];
}

const SPACES: Space[] = [
  { name: 'Product team', role: 'rw', boards: [{ n: 'Q3 planning', m: '15 objects · opened 2m ago', cur: true }, { n: 'Brand explorations', m: '42 objects · opened yesterday' }] },
  { name: 'Design guild', role: 'rw', boards: [{ n: 'Onboarding flows', m: '8 objects · opened last week' }, { n: 'Component audit', m: '23 objects · opened Apr 2' }] },
  { name: 'Acme co — shared', role: 'ro', boards: [{ n: 'Partner roadmap', m: '11 objects · read-only' }] },
];

function RoleChip({ role }: { role: 'rw' | 'ro' }) {
  const rw = role === 'rw';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 9px',
        borderRadius: 'var(--r-pill)',
        font: 'var(--mono-xs)',
        letterSpacing: '.03em',
        whiteSpace: 'nowrap',
        flex: 'none',
        background: rw ? 'color-mix(in oklab, var(--accent-2) 16%, var(--panel))' : 'var(--panel-2)',
        border: `1px solid ${rw ? 'color-mix(in oklab, var(--accent-2) 38%, var(--line))' : 'var(--line-2)'}`,
        color: rw ? 'var(--ink)' : 'var(--ink-2)',
      }}
    >
      {rw ? 'can edit' : (
        <>
          <Icon name="lock" size={11} strokeWidth={2} />
          read-only
        </>
      )}
    </span>
  );
}

function BoardChooser() {
  const wb = useWb();
  const close = () => wb.setScreen(null);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'color-mix(in oklab, var(--bg) 92%, transparent)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button onClick={close} style={{ position: 'absolute', top: 18, right: 18, display: 'flex', padding: 9, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '50%', color: 'var(--ink-2)', cursor: 'pointer' }}>
        <Icon name="x" size={18} />
      </button>

      <div style={{ width: 'min(600px, 94vw)', maxHeight: '84vh', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 18, boxShadow: 'var(--shadow-modal)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid var(--line)', flex: 'none' }}>
          <div style={{ font: '800 24px/1 var(--disp)', letterSpacing: '-.02em' }}>Open a board.</div>
          <div style={{ font: 'var(--body-sm)', color: 'var(--ink-2)', marginTop: 6 }}>Boards live in your spaces — one space per team. Each space lists its own boards.</div>
        </div>

        <div className="wb-scroll" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', flex: 1 }}>
          {SPACES.map((sp) => (
            <div key={sp.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '2px 4px' }}>
                <span style={{ display: 'flex', color: 'var(--ink-2)' }}>
                  <Icon name="users" size={15} strokeWidth={1.75} />
                </span>
                <span style={{ flex: 1, font: '700 13.5px/1 var(--disp)', letterSpacing: '.01em', color: 'var(--ink)' }}>{sp.name}</span>
                <RoleChip role={sp.role} />
              </div>
              {sp.boards.map((b) => (
                <button
                  key={b.n}
                  onClick={close}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 12px',
                    background: b.cur ? 'color-mix(in oklab, var(--accent-2) 12%, var(--bg))' : 'var(--bg)',
                    border: `1px solid ${b.cur ? 'color-mix(in oklab, var(--accent-2) 40%, var(--line))' : 'var(--line)'}`,
                    borderRadius: 11,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--ink)',
                  }}
                >
                  <span style={{ display: 'flex', width: 34, height: 34, borderRadius: 9, background: 'var(--panel-2)', border: '1px solid var(--line)', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-2)', flex: 'none' }}>
                    <Icon name="frame" size={16} strokeWidth={1.75} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '600 14.5px/1.2 var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.n}</div>
                    <div style={{ font: 'var(--mono-xs)', color: 'var(--ink-3)', marginTop: 3 }}>{b.m}</div>
                  </span>
                  {b.cur ? (
                    <span style={{ font: 'var(--mono-xs)', color: 'var(--accent-violet)' }}>current</span>
                  ) : sp.role === 'ro' ? (
                    <Icon name="lock" size={14} color="var(--ink-3)" strokeWidth={2} />
                  ) : (
                    <Icon name="chevRight" size={16} color="var(--ink-3)" strokeWidth={1.75} />
                  )}
                </button>
              ))}
              {sp.role === 'rw' ? (
                <button onClick={() => { close(); wb.newBoard(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: '1px dashed var(--line-2)', borderRadius: 11, color: 'var(--ink-3)', font: 'var(--body-sm)', cursor: 'pointer', textAlign: 'left' }}>
                  <Icon name="plus" size={14} strokeWidth={2} />
                  {`New board in ${sp.name}`}
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 9, flex: 'none' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { close(); wb.addSpace(); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, background: 'var(--grad)', border: 'none', borderRadius: 'var(--r-pill)', color: '#1a1020', font: 'var(--label)', cursor: 'pointer' }}>
              <Icon name="userPlus" size={16} color="#1a1020" strokeWidth={1.75} />
              Add a space…
            </button>
            <button onClick={() => { close(); wb.openBoard(); }} style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px 16px', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-pill)', color: 'var(--ink)', font: 'var(--label)', cursor: 'pointer' }}>
              <Icon name="folder" size={16} strokeWidth={1.75} />
              Open folder…
            </button>
          </div>
          <div style={{ font: 'var(--mono-xs)', color: 'var(--ink-3)', textAlign: 'center' }}>Adding a space is granted by immediately.run — never by this app.</div>
        </div>
      </div>
    </div>
  );
}

export default BoardChooser;
