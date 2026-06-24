// Provider side of the `open-project` task (SPACES_UI_SPEC §6, Phase 5
// `05-capdir-open-with.md`). A file manager that finds an `opensWith`
// marker on a whiteboard-project folder invokes the `open-project` contract,
// handing the folder over as a directory capability (`capDir`). The host
// resolves THIS app as the bound provider, mints a task-scoped chroot rooted at
// that folder, and launches us with the folder already mounted. Here we read
// the task input, locate that chroot among our mounts, and hand back a
// `BoardTarget` the controller loads the board from — then `completeTask`.
//
// Like `boardStore`/`pickFile`, the `@immediately-run/sdk` task module runs a
// module-eval side effect (the `task-input` listener) that throws `no host
// transport` under local `vite dev` (no host). So every entry point here is
// async and LAZY-imports the SDK, and the whole feature is gated off under
// `__WB_DEV__` (there is no host to deliver a task input locally anyway).

import type { SandboxMount } from '@immediately-run/sdk/mounts';
import type { BoardTarget } from './boardStore';

/** The contract this app provides; the marker a project folder declares. */
export const OPEN_PROJECT_TASK = 'open-project';
export const OPEN_PROJECT_VERSION = '1.0';

/** Injected by Vite `define` (see vite.config.ts): truthy under `vite dev`,
 *  absent in a production build. Never write `import.meta` — it is a parse-time
 *  SyntaxError in the immediately.run sandbox (CLAUDE.md rule 9). */
declare const __WB_DEV__: boolean | undefined;

const isDev = (): boolean => typeof __WB_DEV__ !== 'undefined' && !!__WB_DEV__;

/** The directory-capability shape a `capDir` param carries (SDK `DirCap`). It is
 *  untrusted display/intent data (R-SPACES-11) — validate before acting on it. */
export interface DirCapParam {
  $cap: 'dir';
  mountId: string;
  relPath: string;
  mode?: 'ro' | 'rw';
}

function isDirCap(v: unknown): v is DirCapParam {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return c.$cap === 'dir' && typeof c.mountId === 'string';
}

/**
 * Read the task input we were launched with, IF we are running as the
 * `open-project` provider with a valid `dir` delegation. Returns the delegated
 * directory cap, or null for a normal launch (no task input / a different task /
 * a malformed param — all degrade silently, never throw, R-SPACES-11). Never
 * reached under `vite dev` (no host to deliver a task input).
 */
export async function readOpenProjectInput(): Promise<DirCapParam | null> {
  if (isDev()) return null;
  let input: { task: string; params: Record<string, unknown> } | null;
  try {
    const { getTaskInput } = await import('@immediately-run/sdk');
    input = getTaskInput();
  } catch {
    // No host transport (or the module threw): we are not a task callee.
    return null;
  }
  if (!input || input.task !== OPEN_PROJECT_TASK) return null;
  const dir = input.params?.dir;
  return isDirCap(dir) ? dir : null;
}

/**
 * Resolve the chroot the host mounted for a `capDir` delegation to a concrete
 * mount, so we can read the board off disk. The host chroots the callee AT the
 * delegated directory, announcing it as a normal mount — so the board root is
 * the mount's own `path`. We match the mount by `id` (the delegated `mountId`),
 * falling back to the lone other mount when the host reports a fresh task-path id
 * we can't pre-match (a task callee's world is small). `excludePath` drops the
 * app's own settings store from that fallback. Returns null if no such mount is
 * present yet (the caller can retry on `onMountsChange`).
 */
export function resolveDelegatedMount(
  dir: DirCapParam,
  mounts: SandboxMount[],
  excludePath?: string,
): SandboxMount | null {
  const byId = mounts.find((m) => m.id === dir.mountId || `space:${m.id}` === dir.mountId);
  if (byId) return byId;
  const candidates = mounts.filter((m) => m.path !== excludePath);
  return candidates.length === 1 ? candidates[0] : null;
}

/** Turn a resolved delegated mount + the dir cap into a board target. The mount
 *  is already chroot'd at the project folder, so its `path` is the board root;
 *  the effective mode is the narrower of the delegation and the granted mount. */
export function dirCapToBoardTarget(dir: DirCapParam, mount: SandboxMount): BoardTarget {
  const delegated = dir.mode === 'ro' ? 'ro' : 'rw';
  const granted = mount.mode === 'ro' ? 'ro' : 'rw';
  const mode: 'ro' | 'rw' = delegated === 'ro' || granted === 'ro' ? 'ro' : 'rw';
  return { root: mount.path, mode, spaceId: mount.id };
}

/** Tell the caller we opened the project (or couldn't). Lazy-imports the SDK and
 *  swallows the no-host case so a stray call under `vite dev` never throws. */
export async function reportOpened(opened: boolean): Promise<void> {
  if (isDev()) return;
  try {
    const { completeTask } = await import('@immediately-run/sdk');
    completeTask({ opened });
  } catch {
    // No host transport: nothing to report to.
  }
}

/** Abort the task (e.g. the delegated folder never resolved to a mount). */
export async function abortOpenProject(): Promise<void> {
  if (isDev()) return;
  try {
    const { cancelTask } = await import('@immediately-run/sdk');
    cancelTask();
  } catch {
    // No host transport.
  }
}
