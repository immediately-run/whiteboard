import { describe, it, expect } from 'vitest';
import { imgAssetRef, imgSrcFromBody } from './imgRef';

describe('imgSrcFromBody', () => {
  it('extracts the src from the canonical <Img src="assets/..."> body', () => {
    expect(imgSrcFromBody('<Img src="assets/plate.png" />')).toBe('assets/plate.png');
  });

  it('returns null for a body without an <Img>', () => {
    expect(imgSrcFromBody('plain prose')).toBeNull();
    expect(imgSrcFromBody(undefined)).toBeNull();
  });
});

describe('imgAssetRef', () => {
  it('resolves the canonical body reference to a board-relative assets path', () => {
    expect(imgAssetRef({ body: '<Img src="assets/plate.png" />' })).toBe('assets/plate.png');
  });

  it('falls back to title when there is no body <Img> (the app write path)', () => {
    expect(imgAssetRef({ title: 'plate.png' })).toBe('assets/plate.png');
  });

  it('prefers the body reference over title', () => {
    expect(imgAssetRef({ title: 'other.png', body: '<Img src="assets/plate.png" />' })).toBe('assets/plate.png');
  });

  it('returns null with no reference at all', () => {
    expect(imgAssetRef({})).toBeNull();
    expect(imgAssetRef({ title: '' })).toBeNull();
  });

  it('rejects a URL scheme reference (no network fetch)', () => {
    expect(imgAssetRef({ body: '<Img src="https://evil.example/steal.png" />' })).toBeNull();
    expect(imgAssetRef({ body: '<Img src="data:image/png;base64,AAAA" />' })).toBeNull();
    expect(imgAssetRef({ body: '<Img src="blob:https://x/abc" />' })).toBeNull();
  });

  it('rejects absolute and protocol-relative references', () => {
    expect(imgAssetRef({ body: '<Img src="/etc/passwd" />' })).toBeNull();
    expect(imgAssetRef({ body: '<Img src="//cdn.example/x.png" />' })).toBeNull();
  });

  it('rejects path traversal', () => {
    expect(imgAssetRef({ body: '<Img src="assets/../board.md" />' })).toBeNull();
  });

  it('accepts a bare filename from title and prefixes assets/', () => {
    expect(imgAssetRef({ title: 'pacific-map.png' })).toBe('assets/pacific-map.png');
  });
});