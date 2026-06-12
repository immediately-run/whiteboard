// The designed empty/forbidden states (spec §6.1, DESIGN_BRIEF §3): empty board
// (invites the first note), no board selected, signed out, and the "not a board"
// retry after picking a folder with no board.md. The chooser is its own modal.
// These never imitate host chrome — sign-in itself is host-driven (the copy says
// so); this only frames the app-side states around it.

import { useWb } from '../hooks/useWhiteboardCtx';
import BoardChooser from './BoardChooser';
import Icon from './Icon';

function StateScreens() {
  const wb = useWb();
  const screen = wb.state.screen;
  if (!screen) return null;
  if (screen === 'chooser') return <BoardChooser />;

  const close = () => wb.setScreen(null);

  const emptyArt = (icon: string, size: number, amber = false) => (
    <div
      style={{
        width: 88,
        height: 88,
        borderRadius: 24,
        background: amber ? 'color-mix(in oklab, #caa24a 16%, var(--panel))' : 'color-mix(in oklab, var(--accent-2) 14%, var(--panel))',
        border: `1px solid ${amber ? 'color-mix(in oklab, #caa24a 40%, var(--line))' : 'var(--line-2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: amber ? '#caa24a' : 'var(--accent-violet)',
        marginBottom: 6,
      }}
    >
      <Icon name={icon} size={size} strokeWidth={1.5} />
    </div>
  );

  const primary = (label: string, icon: string) => (
    <button onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'var(--grad)', border: 'none', borderRadius: 'var(--r-pill)', color: '#1a1020', font: 'var(--label)', cursor: 'pointer', boxShadow: 'var(--glow)', whiteSpace: 'nowrap' }}>
      <Icon name={icon} size={16} color="#1a1020" strokeWidth={icon === 'chevRight' || icon === 'plusBig' ? 2 : 1.75} />
      {label}
    </button>
  );
  const secondary = (label: string) => (
    <button onClick={close} style={{ padding: '12px 20px', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-pill)', color: 'var(--ink)', font: 'var(--label)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );

  const content: Record<string, { art: React.ReactNode; title: string; body: string; actions: React.ReactNode[] }> = {
    empty: {
      art: emptyArt('sticky', 40),
      title: 'An empty board.',
      body: 'Double-click anywhere to drop your first note — or pick an image. Every object you add becomes one file in this folder.',
      actions: [primary('Add a note', 'plusBig'), secondary('Insert image…')],
    },
    noboard: {
      art: emptyArt('inbox', 38),
      title: 'No board selected.',
      body: 'Choose a board to open, or start a new one. Your boards live across your team spaces.',
      actions: [primary('Open a board', 'folder')],
    },
    signedout: {
      art: emptyArt('lock', 34),
      title: 'Sign in to load your boards.',
      body: 'Boards live in a shared space. Signing in is handled by immediately.run — this app never asks for credentials itself.',
      actions: [primary('Continue', 'chevRight')],
    },
    notaboard: {
      art: emptyArt('alert', 38, true),
      title: 'Not a board.',
      body: 'That folder has no board.md, so there is nothing to render. Pick a different folder, or create a board here.',
      actions: [primary('Create board here', 'plusBig'), secondary('Pick another…')],
    },
  };

  const c = content[screen];
  if (!c) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, background: 'color-mix(in oklab, var(--bg) 92%, transparent)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button onClick={close} style={{ position: 'absolute', top: 18, right: 18, display: 'flex', padding: 9, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: '50%', color: 'var(--ink-2)', cursor: 'pointer' }}>
        <Icon name="x" size={18} />
      </button>
      <div style={{ width: 'min(460px, 94vw)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {c.art}
        <div style={{ font: '800 30px/1 var(--disp)', letterSpacing: '-.03em' }}>{c.title}</div>
        <div style={{ font: 'var(--body)', color: 'var(--ink-2)', maxWidth: 380, textWrap: 'pretty' }}>{c.body}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>{c.actions}</div>
      </div>
    </div>
  );
}

export default StateScreens;
