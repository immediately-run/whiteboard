// The persistence layer the design comp left as a seam (WHITEBOARD_SPEC §2.6 /
// §5.2): it reads and writes the board's `.mdx`/`.md` files through the async
// `fs` module immediately.run exposes to the sandbox (ZenFS over a MessagePort
// in production; the @immediately-run/dev-fs bridge to real disk under `vite
// dev`). The board lives under a `boardRoot` directory — a per-user app space
// (`openAppSpace`), so writes are durable and private to the signed-in user.
//
// Everything here is async and dependency-free. Mutations are "write the one
// file that changed" (one object = one file = the unit of conflict, §2.1); we
// never rewrite the whole board on an edit.

import fs from 'fs';
import { openAppSpace } from '@immediately-run/sdk';
import type { SandboxMount } from '@immediately-run/sdk';
import {
  parseJourney,
  parseObject,
  parseView,
  serializeJourney,
  serializeObject,
  serializeView,
} from './mdxObject';
import type { Journey, View, WObject } from './types';

export interface Board {
  objects: WObject[];
  views: View[];
  journeys: Journey[];
}

export interface BoardTarget {
  /** Absolute mount path the board lives under (e.g. `/spaces/{id}`). */
  root: string;
  /** Live access mode; a host role-downgrade flips this to `'ro'`. */
  mode: 'ro' | 'rw';
  /** The space id, for reacting to mount changes. */
  spaceId?: string;
}

const OBJECTS = 'objects';
const VIEWS = 'views';
const JOURNEYS = 'journeys';
const TRASH = 'objects/.trash';

function join(...parts: string[]): string {
  return parts.join('/').replace(/\/+/g, '/');
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

async function readDirSafe(path: string): Promise<string[]> {
  try {
    return await fs.promises.readdir(path);
  } catch {
    return [];
  }
}

/**
 * Open the signed-in user's board space (the §8.6 zero-config path). Rejects
 * with a SpaceError (`.code` = `auth-required` | `cancelled` | `forbidden`)
 * when there is no session or the user declines — callers degrade to an
 * in-memory board instead of crashing (platform rule 9).
 */
export async function openBoardTarget(slot = 'default'): Promise<BoardTarget> {
  const mount: SandboxMount = await openAppSpace(slot);
  return { root: mount.path, mode: mount.mode === 'ro' ? 'ro' : 'rw', spaceId: mount.id };
}

/** True once the space has a board materialised (an `objects/` dir). */
export async function boardExists(t: BoardTarget): Promise<boolean> {
  return exists(join(t.root, OBJECTS));
}

/** Read every object/view/journey file from the target into the document model. */
export async function loadBoard(t: BoardTarget): Promise<Board> {
  const objFiles = (await readDirSafe(join(t.root, OBJECTS))).filter((f) => f.endsWith('.mdx'));
  const objects = await Promise.all(
    objFiles.map(async (f) => parseObject(f.replace(/\.mdx$/, ''), await fs.promises.readFile(join(t.root, OBJECTS, f), 'utf8'))),
  );
  const viewFiles = (await readDirSafe(join(t.root, VIEWS))).filter((f) => f.endsWith('.md'));
  const views = await Promise.all(
    viewFiles.map(async (f) => parseView(f.replace(/\.md$/, ''), await fs.promises.readFile(join(t.root, VIEWS, f), 'utf8'))),
  );
  const jrnFiles = (await readDirSafe(join(t.root, JOURNEYS))).filter((f) => f.endsWith('.md'));
  const journeys = await Promise.all(
    jrnFiles.map(async (f) => parseJourney(f.replace(/\.md$/, ''), await fs.promises.readFile(join(t.root, JOURNEYS, f), 'utf8'))),
  );
  return { objects, views, journeys };
}

/** Materialise a fresh board from seed data (first run on an empty space). */
export async function seedBoard(t: BoardTarget, board: Board): Promise<void> {
  await fs.promises.mkdir(join(t.root, OBJECTS), { recursive: true });
  await fs.promises.mkdir(join(t.root, VIEWS), { recursive: true });
  await fs.promises.mkdir(join(t.root, JOURNEYS), { recursive: true });
  await Promise.all([
    ...board.objects.map((o) => saveObject(t, o)),
    ...board.views.map((v) => saveView(t, v)),
    ...board.journeys.map((j) => saveJourney(t, j)),
  ]);
}

export async function saveObject(t: BoardTarget, o: WObject): Promise<void> {
  await fs.promises.mkdir(join(t.root, OBJECTS), { recursive: true });
  await fs.promises.writeFile(join(t.root, OBJECTS, `${o.id}.mdx`), serializeObject(o), 'utf8');
}

/** Delete = rename into `objects/.trash/` so the 10s undo can rename it back (§4.2). */
export async function trashObject(t: BoardTarget, id: string): Promise<void> {
  await fs.promises.mkdir(join(t.root, TRASH), { recursive: true });
  await fs.promises.rename(join(t.root, OBJECTS, `${id}.mdx`), join(t.root, TRASH, `${id}.mdx`));
}

export async function restoreObject(t: BoardTarget, id: string): Promise<void> {
  await fs.promises.rename(join(t.root, TRASH, `${id}.mdx`), join(t.root, OBJECTS, `${id}.mdx`));
}

export async function saveView(t: BoardTarget, v: View): Promise<void> {
  await fs.promises.mkdir(join(t.root, VIEWS), { recursive: true });
  await fs.promises.writeFile(join(t.root, VIEWS, `${v.name}.md`), serializeView(v), 'utf8');
}

export async function saveJourney(t: BoardTarget, j: Journey): Promise<void> {
  await fs.promises.mkdir(join(t.root, JOURNEYS), { recursive: true });
  await fs.promises.writeFile(join(t.root, JOURNEYS, `${j.id}.md`), serializeJourney(j), 'utf8');
}
