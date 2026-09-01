// Resolve an img object's asset reference to a safe board-relative `assets/`
// path (WHITEBOARD_SPEC §3.4). The canonical form is `<Img src="assets/<name>" />`
// in the object body; the app's own write path (insertImage) also records the
// asset name in `title`. Returns null when there is no reference or the
// reference is not a safe board-relative path — the caller renders the
// missing-asset placeholder. The bytes are read from the sandbox `fs`, never a
// URL fetch (opaque origin, R3-399).

const ASSETS_PREFIX = 'assets/';

/** Extract the `src` from the canonical `<Img src="assets/<name>" />` body. */
export function imgSrcFromBody(body?: string): string | null {
  if (!body) return null;
  const m = /<Img\b[^>]*\bsrc\s*=\s*"([^"]+)"/i.exec(body);
  return m ? m[1] : null;
}

/** A reference is usable only when it names a path under `assets/` that is not a
 *  URL scheme, not absolute/protocol-relative, and has no traversal. */
function isSafeRef(ref: string): boolean {
  if (/^[a-z][a-z0-9+.-]*:/i.test(ref)) return false; // http:, data:, blob:, javascript:, …
  if (ref.startsWith('/') || ref.startsWith('//')) return false; // absolute / protocol-relative
  if (ref.split('/').includes('..')) return false; // traversal
  return true;
}

/** The board-relative `assets/<name>` path an img object references, or null. */
export function imgAssetRef(o: { body?: string; title?: string }): string | null {
  const src = imgSrcFromBody(o.body) ?? o.title;
  if (!src) return null;
  const s = src.trim();
  if (!s || !isSafeRef(s)) return null;
  return s.startsWith(ASSETS_PREFIX) ? s : `${ASSETS_PREFIX}${s}`;
}