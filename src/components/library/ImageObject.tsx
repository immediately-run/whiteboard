// Image from assets/, lazy-loaded with a shimmer skeleton first (spec §3.4,
// DESIGN_BRIEF §1 loading state). The asset bytes live behind the sandbox
// filesystem — an opaque origin, no URL to fetch — so the component reads them
// through the same `fs` the store uses and hands the renderer an object URL,
// revoked on unmount. `loaded` is authored in the file as a claim about the
// asset; a renderer that knows reads the file itself and derives the state, so
// this component keys off the read result, not the claim (R3-399).

import { useEffect, useState } from 'react';
import fs from 'fs';
import Icon from '../Icon';
import type { WObject } from '../../lib/types';
import { imgAssetRef } from '../../lib/imgRef';

type ImgState =
  | { path: string; status: 'ready'; url: string }
  | { path: string; status: 'missing' }
  | { path: string | null; status: 'loading' };

function ImageObject({ o, boardRoot }: { o: WObject; boardRoot: string | null }) {
  const rel = imgAssetRef(o);
  const path = rel && boardRoot ? `${boardRoot}/${rel}`.replace(/\/+/g, '/') : null;
  const [img, setImg] = useState<ImgState>({ path, status: 'loading' });

  useEffect(() => {
    if (!path) return;
    let disposed = false;
    let objectUrl: string | null = null;
    fs.promises
      .readFile(path)
      .then((data) => {
        if (disposed) return;
        objectUrl = URL.createObjectURL(new Blob([new Uint8Array(data)]));
        setImg({ path, status: 'ready', url: objectUrl });
      })
      .catch(() => {
        if (!disposed) setImg({ path, status: 'missing' });
      });
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  // No reference (or no board root yet) → the missing-asset placeholder; a
  // reference whose read hasn't resolved for THIS path → the loading shimmer.
  const current = img.path === path ? img : { path, status: 'loading' as const };

  if (current.status === 'ready') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
        }}
      >
        <img
          src={current.url}
          alt={o.title || 'image'}
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  if (current.status === 'missing' || !path) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--panel)',
          border: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ink-3)',
          }}
        >
          <Icon name="image" size={30} strokeWidth={1.5} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--panel)',
        border: '1px solid var(--line)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(100deg, transparent 20%, color-mix(in oklab, var(--ink) 8%, transparent) 50%, transparent 80%)',
          backgroundSize: '200% 100%',
          animation: 'wb-shimmer 1.4s linear infinite',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)' }}>
        <Icon name="image" size={30} strokeWidth={1.5} />
      </div>
    </div>
  );
}

export default ImageObject;