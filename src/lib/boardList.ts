// The board chooser's real data (R3-607): the spaces the HOST granted (the
// mounts), each with the board folders it actually contains. This replaces the
// demo `SPACES` constant. There is no boards.json metadata on the host seam
// yet — the mounts-derived list below IS the graceful shape (the item's
// Hand-off files the metadata gap to the HOST primitives thread, not here).

import fs from 'fs';
import type { SandboxMount } from '@immediately-run/sdk/mounts';
import { folderIsBoard, join } from './boardStore';
import type { BoardTarget } from './boardStore';

/** One board folder inside a space. */
export interface BoardEntry {
  name: string;
  target: BoardTarget;
}

/** One granted space and the boards found under its root. */
export interface SpaceBoards {
  /** The mount's label (`name`), falling back to its id then path. */
  label: string;
  role: 'rw' | 'ro';
  mount: SandboxMount;
  boards: BoardEntry[];
}

/** The mounts that can hold boards: the spaces the host granted us (their
 *  paths name them — `/spaces/{id}`), excluding the primary repo mount. A
 *  read-only space is still listable; creation inside it is what it refuses. */
export function boardMounts(mounts: SandboxMount[]): SandboxMount[] {
  return mounts.filter((m) => m.path.startsWith('/spaces/'));
}

/** List the boards under one mount: the root's entries that are board folders
 *  — the marker check is boardStore's `folderIsBoard` (one home for the
 *  is-a-board rule, R6). Degrades to an empty list when the mount is
 *  unreadable — an unreachable space renders no rows, never a crash. */
export async function boardsInMount(mount: SandboxMount): Promise<BoardEntry[]> {
  let entries: string[] = [];
  try {
    entries = await fs.promises.readdir(mount.path);
  } catch {
    return [];
  }
  const boards: BoardEntry[] = [];
  for (const entry of entries) {
    const target: BoardTarget = { root: join(mount.path, entry), mode: mount.mode === 'ro' ? 'ro' : 'rw', spaceId: mount.id };
    if (await folderIsBoard(target)) boards.push({ name: entry, target });
  }
  return boards;
}

/** The chooser's whole list: every granted space with the boards it contains. */
export async function listSpacesAndBoards(mounts: SandboxMount[]): Promise<SpaceBoards[]> {
  const spaces = boardMounts(mounts);
  return Promise.all(
    spaces.map(async (mount) => ({
      label: mount.name ?? mount.id ?? mount.path,
      role: mount.mode === 'ro' ? ('ro' as const) : ('rw' as const),
      mount,
      boards: await boardsInMount(mount),
    })),
  );
}
