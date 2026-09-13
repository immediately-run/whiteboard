// @vitest-environment node
// boardList (R3-607): the chooser's real data — the mounts that hold boards,
// and the board folders under each, with the marker check owned by
// boardStore.folderIsBoard. The fake-fs pattern is boardStore.test.ts's.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const files = new Set<string>();

vi.mock('fs', () => ({
  default: {
    promises: {
      async access(p: string) {
        if (!files.has(p)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      },
      async readdir(p: string) {
        const dir = `${p}/`;
        // Directories too: a board's manifest sits one level down, so the
        // entry itself appears only as a path prefix.
        const names = [...files.keys()]
          .filter((k) => k.startsWith(dir))
          .map((k) => k.slice(dir.length).split('/')[0]);
        return [...new Set(names)];
      },
    },
  },
}));

vi.mock('@immediately-run/sdk/mounts', () => ({
  openSettings: vi.fn(async () => {
    throw new Error('no host transport');
  }),
}));

import { boardMounts, boardsInMount, listSpacesAndBoards } from './boardList';
import type { SandboxMount } from '@immediately-run/sdk/mounts';

const space = (over: Partial<SandboxMount> = {}): SandboxMount => ({
  path: '/spaces/team',
  type: 'firestore',
  id: 's1',
  name: 'Team space',
  mode: 'rw',
  ...over,
});

beforeEach(() => files.clear());

describe('boardMounts (R3-607)', () => {
  it('keeps the granted spaces and drops the primary repo mount', () => {
    const mounts: SandboxMount[] = [space(), { path: '/mnt/abc123', type: 'repo', mode: 'rw' }, space({ path: '/spaces/readonly', id: 's2', mode: 'ro' })];
    expect(boardMounts(mounts).map((m) => m.path)).toEqual(['/spaces/team', '/spaces/readonly']);
  });
});

describe('boardsInMount (R3-607)', () => {
  it('lists the folders that carry a board.md and skips the rest', async () => {
    files.add('/spaces/team/roadmap/board.md');
    files.add('/spaces/team/scratchpad/notes.txt');
    files.add('/spaces/team/solo/board.md');
    const boards = await boardsInMount(space());
    expect(boards.map((b) => b.name).sort()).toEqual(['roadmap', 'solo']);
    // The target each row opens: the folder as root, the mount's mode and id.
    expect(boards[0].target.root).toBe('/spaces/team/roadmap');
    expect(boards[0].target.mode).toBe('rw');
    expect(boards[0].target.spaceId).toBe('s1');
  });

  it('carries a read-only mount through to its boards', async () => {
    files.add('/spaces/road/plan/board.md');
    const boards = await boardsInMount(space({ path: '/spaces/road', id: 's2', mode: 'ro' }));
    expect(boards[0].target.mode).toBe('ro');
  });

  it('an unreadable mount degrades to no rows, never a crash', async () => {
    await expect(boardsInMount(space({ path: '/spaces/gone' }))).resolves.toEqual([]);
  });
});

describe('listSpacesAndBoards (R3-607)', () => {
  it('groups every granted space with its boards and label fallbacks', async () => {
    files.add('/spaces/a/one/board.md');
    const list = await listSpacesAndBoards([
      space({ path: '/spaces/a', id: 'a1', name: 'Alpha' }),
      space({ path: '/spaces/b', id: undefined as unknown as string, name: undefined as unknown as string }),
    ]);
    expect(list.map((s) => s.label)).toEqual(['Alpha', '/spaces/b']);
    expect(list[0].boards.map((b) => b.name)).toEqual(['one']);
    expect(list[1].boards).toEqual([]);
  });
});
