// @vitest-environment jsdom
// Post-pick busy states (R3-607 / R-IX-2): the named busy label is set BEFORE
// the awaited pick resolves, cleared after; a rejecting pick lands in the toast
// channel. `pickFile` is the boundary — mocked controllable here; everything
// else is the real controller.
import { act, render } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@immediately-run/sdk/mounts', () => ({
  getMounts: () => [],
  onMountsChange: () => () => {},
  openSettings: async () => {
    throw new Error('no host transport');
  },
}));

// The pick boundary: resolve/reject controlled per-case. `boardSpaceRoot` rides
// the same module and is waited before the pick.
let pickResult: Promise<{ relPath: string } | null> | null = null;
vi.mock('../lib/pickFile', () => ({
  pickFile: () => pickResult,
  boardSpaceRoot: async () => '/mem/board',
  requestSpace: async () => null,
  safeRel: (s: string) => s,
}));

import { useWhiteboard } from './useWhiteboard';

// Held in an object (not a bare let): the react-hooks globals rule forbids
// reassigning outside-declared variables inside a component.
const held = { wb: null as ReturnType<typeof useWhiteboard> | null };
function Harness() {
  const controller = useWhiteboard();
  // Capture in an EFFECT (the react-hooks immutability rule bans outside
  // writes during render); act flushes effects, so tests read it after render.
  useEffect(() => {
    held.wb = controller;
  });
  return <div>{controller.state.objects.length}</div>;
}

async function renderWithBoard() {
  render(<Harness />);
  const wb = held.wb!;
  // Arm a writable board target so insertImage passes its sign-in guard; the
  // real loadBoard tolerates an absent directory (readDirSafe degrades).
  await act(async () => {
    await wb.openBoardAt({ root: '/mem/board', mode: 'rw' });
  });
}

describe('post-pick busy states (R3-607)', () => {
  beforeEach(() => {
    pickResult = null;
  });

  it('applySelection — the additive branch every shift-click takes (toggle in, toggle out)', async () => {
    await renderWithBoard();
    // The pure spelling both pointer and keyboard share; imported directly so a
    // toggle-branch regression cannot hide behind a render.
    const { applySelection } = await import('./useWhiteboard');
    expect(applySelection([], 'a', true)).toEqual(['a']);
    expect(applySelection(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(applySelection(['a', 'b'], 'a', true)).toEqual(['b']); // toggle out
    expect(applySelection(['a'], 'a', false)).toEqual(['a']); // replace keeps
    expect(applySelection(['a'], 'b', false)).toEqual(['b']); // replace swaps
  });

  it('the busy label is set before the pick resolves and cleared after (cancel)', async () => {
    await renderWithBoard();
    const wb = held.wb!;
    let resolvePick!: (v: { relPath: string } | null) => void;
    pickResult = new Promise((res) => {
      resolvePick = res;
    });
    let pending!: Promise<void>;
    await act(async () => {
      pending = wb.insertImage(0, 0);
    });
    expect(held.wb!.state.busy).toBe('insert-image');
    await act(async () => {
      resolvePick(null); // cancelled — the picker was dismissed
      await pending;
    });
    expect(held.wb!.state.busy).toBeNull();
  });

  it('a rejecting pick lands in the toast channel and clears busy', async () => {
    await renderWithBoard();
    const wb = held.wb!;
    pickResult = Promise.reject(Object.assign(new Error('picker failed'), { code: 'cancelled' }));
    let pending!: Promise<void>;
    // A SYNCHRONOUS act: starts the flow without flushing its microtasks, so
    // the busy state is observable before the rejection is handled.
    act(() => {
      pending = wb.insertImage(0, 0);
    });
    expect(held.wb!.state.busy).toBe('insert-image');
    await act(async () => {
      await pending;
    });
    expect(held.wb!.state.busy).toBeNull();
    expect(held.wb!.state.toasts.some((t) => t.text.includes('insert image'))).toBe(true);
  });
});
