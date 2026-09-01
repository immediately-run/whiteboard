// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ImageObject from './ImageObject';
import type { WObject } from '../../lib/types';

// A fake async `fs` surface standing in for the sandbox fs (ZenFS/dev-fs). The
// component reads asset bytes through `fs.promises.readFile`, so the round-trip
// test feeds `copyIntoAssets`'s write and `ImageObject`'s read from the same map.
const files = new Map<string, Uint8Array>();

vi.mock('fs', () => ({
  default: {
    promises: {
      mkdir: async () => undefined,
      access: async (p: string) => {
        if (!files.has(p)) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      },
      readFile: async (p: string) => {
        const b = files.get(p);
        if (!b) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
        return b;
      },
      writeFile: async (p: string, data: Uint8Array) => {
        files.set(p, data);
      },
    },
  },
}));

// boardStore.ts imports openSettings from the SDK mounts subpath at module top
// (never called by copyIntoAssets, which only uses `fs`). The installed SDK's
// mounts.js references a dist file missing under the test env — mock the subpath
// so the round-trip exercises the copy+read path, not mount resolution.
vi.mock('@immediately-run/sdk/mounts', () => ({
  openSettings: vi.fn(async () => {
    throw new Error('no host transport');
  }),
}));

// jsdom has no URL.createObjectURL/revokeObjectURL — stub them and spy on revoke.
const created = vi.fn(() => 'blob:test-1');
const revoked = vi.fn();
beforeEach(() => {
  created.mockClear();
  revoked.mockClear();
  files.clear();
  Object.defineProperty(URL, 'createObjectURL', { writable: true, configurable: true, value: created });
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, configurable: true, value: revoked });
});

const imgObject = (overrides: Partial<WObject> = {}): WObject => ({
  id: 'img-1',
  kind: 'img',
  x: 0,
  y: 0,
  w: 260,
  h: 180,
  rot: 0,
  scale: 1,
  z: 3,
  connections: [],
  ...overrides,
});

describe('ImageObject', () => {
  it('renders <img> from an asset present in the board assets/ (object URL, no network fetch)', async () => {
    files.set('/board/assets/plate.png', new Uint8Array([1, 2, 3]));
    render(<ImageObject o={imgObject({ title: 'plate.png', body: '<Img src="assets/plate.png" />' })} boardRoot="/board" />);

    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', 'blob:test-1');
    // Fitted to the object's geometry, and never a network URL.
    expect(img).toHaveStyle({ objectFit: 'cover' });
    expect(img.getAttribute('src')).not.toMatch(/^https?:/);
    expect(img.getAttribute('src')).not.toMatch(/^\/\//);
  });

  it('renders the placeholder for a missing asset — no broken-image glyph, no throw', async () => {
    // No file written: readFile throws ENOENT.
    const { container } = render(
      <ImageObject o={imgObject({ title: 'missing.png', body: '<Img src="assets/missing.png" />' })} boardRoot="/board" />,
    );

    await waitFor(() => expect(screen.queryByRole('img')).toBeNull());
    // The placeholder renders its icon (an inline svg) — never a broken-image glyph.
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('revokes the object URL on unmount', async () => {
    files.set('/board/assets/plate.png', new Uint8Array([9, 9]));
    const { unmount } = render(
      <ImageObject o={imgObject({ title: 'plate.png', body: '<Img src="assets/plate.png" />' })} boardRoot="/board" />,
    );
    await screen.findByRole('img');
    expect(created).toHaveBeenCalledTimes(1);
    expect(revoked).not.toHaveBeenCalled();

    unmount();
    expect(revoked).toHaveBeenCalledWith('blob:test-1');
  });

  it('round-trips a binary asset through copyIntoAssets() then renders the same bytes', async () => {
    // The source file the store copies from, at the board-space path it reads.
    files.set('/board/photo.png', new Uint8Array([137, 80, 78, 71, 13, 10]));
    const { copyIntoAssets } = await import('../../lib/boardStore');
    const name = await copyIntoAssets({ root: '/board', mode: 'rw' }, 'photo.png');
    expect(name).toBe('photo.png');

    // copyIntoAssets wrote into /board/assets/ — same fs ImageObject reads.
    render(<ImageObject o={imgObject({ title: name, body: `<Img src="assets/${name}" />` })} boardRoot="/board" />);
    const img = await screen.findByRole('img');
    expect(img).toHaveAttribute('src', 'blob:test-1');
  });
});