# Whiteboard (Lodestar) — agent authoring (proposal)

**Status:** design note (proposal) · **Updated:** 2026-06-27
**Platform source of truth:** the immediately-run **docs** repo,
`specs/AGENT_AUTHORING_ARCHITECTURE.md` — the cross-app architecture. This note is the
**whiteboard-specific** application of it. (Grove is the sibling application; see
`grove/docs/product-defs/grove-agent-authoring.md`.)

> *(Naming, 2026-06-27 — whiteboard is being renamed **Lodestar**. This note keeps "whiteboard"
> for the repo/code until the rename lands; read "whiteboard" and "Lodestar" as the same app.)*

> *(Reconciliation, 2026-06-27 — the platform note was rewritten and now **supersedes** two
> mechanisms here. (1) **No "self-authoring agent principal."** The agent is the platform
> **workbench agent** under the **editing-session principal**, used as-is — not a whiteboard-hosted
> mini-app. (2) **No semantic-patch interface — the agent writes the board filesystem directly.**
> Whiteboard does not validate/apply patches; it is a renderer that re-reads on `onFsChange`, and
> as a **direct-manipulation** app it holds a low-stakes `rw` board mount so dragging writes
> geometry. The clean-exemplar framing, the deltas list, and the file-per-object conflict model
> below all remain correct; only the agent's principal and write path change. Observation
> (`diagnostics:read`, `render:read`) survives as the workbench agent's subject-scoped view of the
> running board; `chat()` is egress, gated on TS-5b.)*

First-class agent authoring is **aspirational** for whiteboard today (there is no agent, no
chat, no diagnostics wired). This note records the target architecture so the build order is
deliberate.

---

## Why whiteboard is the clean exemplar

Whiteboard's substrate is already the shape the model wants:

- **Filesystem *is* the document.** One file per object (`objects/{id}.mdx` — YAML frontmatter
  + MDX body), a `board.md` manifest, `views/`, `journeys/`, `assets/`, in a mounted board
  space (`src/lib/boardStore.ts`). Agent-legible by construction (the README's "an agent that
  has never heard of this app" can read the MDX).
- **Minimal capabilities.** Whiteboard reads/writes only its own board data; it invokes
  `pick-file` / `share-space` / `edit-file` and provides `open-project`. It never holds
  `llm:chat`, `net:fetch`, secrets, or foreign-mount authority.
- **Document and engine already separate.** The **board** lives in a mount (FS 2); whiteboard's
  **source** is its repo (FS 1). The agent authors the *document*; the engine is a fixed,
  forkable app it never touches. (This is the cleaner form of the "no engine/content
  capability border": there is no caps border — everything inline runs with whiteboard's
  minimal caps — only a *substrate* tier, document vs engine source.)

So there is little to un-build. The model lands almost verbatim; what's missing are enabling
pieces, listed as deltas below.

---

## The model, applied to whiteboard

**The agent is an externalized mini-app, not ambient in whiteboard.** Because it needs
`llm:chat`, it runs as a separate host-brokered app with its **own appKey**, under the tight
**self-authoring agent principal** — ceiling `{ chat(), diagnostics:read (subject),
render:read (subject), ipc → whiteboard }` and **nothing else** (no `net:fetch`, no secrets, no
foreign mounts, **no board write**). Its `rw` reach, when it has any, is scoped to the **board
mount** — it structurally cannot touch whiteboard's engine source.

> *(Superseded 2026-06-27 by `AGENT_AUTHORING_ARCHITECTURE.md` §3. The agent is the **workbench
> agent** under the **editing-session principal**, not a whiteboard-hosted mini-app with a bespoke
> principal. It writes the board filesystem directly (an editing-session write), so the "no board
> write / proposes via patches" framing is replaced by direct file writes reconciled at the gate.
> The good structural property — the agent touches the **board mount**, never whiteboard's engine
> source — still holds, because the board lives in a separate mount from the app repo.)*

**The agent proposes; whiteboard applies.** The agent emits semantic patches over the IPC edge;
whiteboard — which owns the object model — validates and writes:

- `patch(objectId, fieldOps)` — *set `body` of object O*; *move/resize* (geometry); *add a
  `connection`*; *retag*; *create object `{ kind, x, y, w, h, body, … }`*.
- `putAsset(path, bytes)` — an image (whole-file; no merge).

The agent never holds a board-write capability; whiteboard is the gatekeeper that validates
against the object schema and applies through the conflict chain. Whiteboard writes the board
via its ordinary **rw mount grant** (the board mount today) — collaborator-gated, revocable,
not a standing app capability.

**Observe + context.** Context is re-derived from files (`board.md` + `objects/*.mdx`) plus
live IPC deltas (**selected objects, viewport rect, zoom**). Observation is subject-scoped:
`diagnostics:read` for object-body MDX compile/transpile errors (once MDX-from-mount lands), and
`render:read` — **screenshot-leaning, because a canvas is visual** — for the "does it look
right" check. The loop: read context → `chat()` → emit `patch` → whiteboard validates + merges
+ writes → host re-reads → diagnostics (± snapshot) → repeat; landing is a separate gated
`contribute`/save step.

---

## Capability-using objects: host-brokered mini-apps, composited at rest

An object that needs an elevated capability (an AI widget, a network-fetching report, a
writable foreign mount) does **not** run inline. It runs as a **host-owned mini-app sibling**,
composited over the object's rectangle — **never** a whiteboard-owned `<iframe>` (which would
put whiteboard in the mini-app's TCB; today's `embed` object does exactly this and must be
re-architected).

**Composition is one-shot, at a settled transform.** Rather than track an affine per frame as
the canvas pans/zooms/rotates, show the existing **placeholder** (the click-to-load preview
card) during motion, and overlay the live iframe **only when the camera rests** — computing the
screen rect from the existing `project(cam, vp, …)`. This sidesteps the hardest part of canvas
composition (per-frame affine tracking) and composes with "preview-until-run": the placeholder
*is* the preview. It requires a **camera-settled event**, which does not exist today
(`flyTo()` completes but fires no callback).

---

## Conflicts: the agent is just another writer

Scope is **light async collaboration**, not real-time multi-cursor (that would need a CRDT/OT
substrate and break the file-writer model). Agent patches, local direct manipulation, and a
remote collaborator all become writes to the board mount, surfaced by `onFsChange`.

- **File-per-object partitions most conflict away** — two writers on different objects never
  conflict.
- **Within an object, merge by field** — geometry (`x,y,w,h,rot`) is last-write-per-field (you
  can't merge two positions), `connections` is a set-union, `body` is text 3-way, `tags` is set
  merge. A human **dragging** O while the agent **rewrites its body** is disjoint and merges
  cleanly; only a true same-field overlap blocks. (So "one object = one file = unit of conflict"
  is *almost* right — the object is the unit of storage, the **field** is the unit of conflict.)
- **Chained resolvers** — whiteboard's object-aware resolver → MDX/text structural merge →
  generic text → terminal (git PR if the board is a git repo; else last-write or a
  *user-initiated* agent-diff).
- **Backstops** — semantic staleness caught by human review at the gate; **per-author-scoped
  undo** (your gestures + your agent's ops, not a collaborator's).

Crucially, making the agent's writes appear live needs the **same `onFsChange`-driven per-object
re-read** that multiplayer needs — build it once, it serves both.

---

## Deltas, in dependency order

1. **MDX-from-mount gate** — compile + render object bodies inline (today bodies are static
   text; the `component` kind is a stub). The enabling step for inline content-logic; safe by
   the no-standing-high-stakes-authority invariant.
2. **`onFsChange`-driven per-object re-read** — live external writes (absent today). Serves both
   agent authoring and multiplayer; required for the loop to close.
3. **Re-architect `embed`/`component` → host-brokered mini-app** — move iframe ownership to the
   host; reuse the click-to-load placeholder as the preview.
4. **Camera-settled event + static-affine region composition** — overlay the live mini-app only
   at rest, via `project(cam, vp, …)`.
5. **Wire the platform workbench agent** against the board mount + the observe/context contract
   (the agent is the workbench agent under the editing-session principal — *not* a whiteboard
   self-authoring mini-app — and it writes the board filesystem directly; there is **no** patch
   interface). *(Corrected 2026-06-27 per `AGENT_AUTHORING_ARCHITECTURE.md` §3; the prior
   "self-authoring agent mini-app + patch protocol" build step is retired.)*
6. **Undo + per-object conflict handling** — benign single-user gaps become requirements once an
   agent is a concurrent writer.

**Where it fights today:** no inline content-logic until (1); the `embed` iframe-ownership is a
TCB-model violation to undo, not extend (3); no live fs resync (2); no undo/conflict model (6).
None contradicts the model — they are its build order.

---

## Open questions

1. **Patch vocabulary** — the `fieldOps` for objects (geometry, body, connections, tags) and how
   whiteboard registers its resolver + schema with the host.
2. **Camera-settled signal** — debounce on `cam` stabilizing + interaction-idle; and the
   coordinate/occlusion contract for the host overlay.
3. **Render snapshot** — screenshot vs. per-object render check; size bounds; pull cadence.
4. **Multiplayer convergence** — whether the same `onFsChange` re-read + conflict chain is the
   whole multiplayer story for light async collaboration, or a single-merge-authority is needed
   for non-git boards.

See `specs/AGENT_AUTHORING_ARCHITECTURE.md` in the docs repo for the platform-level model (the
workbench agent under the editing-session principal — the "self-authoring agent principal" is
retired), and the consolidated platform deltas.
