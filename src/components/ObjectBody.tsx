// Dispatches an object to its built-in library component by `kind`. This is the
// seam where, once the V1 MDX-from-mount gate is settled (spec §3.2), the body
// becomes the compiled MDX of `objects/<id>.mdx` with the library injected into
// scope — the kinds below stay as the presentation hints and fallbacks.

import StickyNote from './library/StickyNote';
import ProseCard from './library/ProseCard';
import CanvasLabel from './library/CanvasLabel';
import CanvasFrame from './library/CanvasFrame';
import ShapeObject from './library/ShapeObject';
import ImageObject from './library/ImageObject';
import VideoObject from './library/VideoObject';
import EmbedObject from './library/EmbedObject';
import ComponentError from './library/ComponentError';
import type { WObject } from '../lib/types';

function ObjectBody({ o }: { o: WObject }) {
  switch (o.kind) {
    case 'note':
      return <StickyNote o={o} />;
    case 'prose':
      return <ProseCard o={o} />;
    case 'label':
      return <CanvasLabel o={o} />;
    case 'frame':
      return <CanvasFrame o={o} />;
    case 'shape':
      return <ShapeObject o={o} />;
    case 'img':
      return <ImageObject o={o} />;
    case 'video':
      return <VideoObject o={o} />;
    case 'embed':
      return <EmbedObject o={o} />;
    case 'component':
      return <ComponentError o={o} />;
    default:
      return <div style={{ position: 'absolute', inset: 0, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12 }} />;
  }
}

export default ObjectBody;
