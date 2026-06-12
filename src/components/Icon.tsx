// A single inline Lucide icon. Strokes use currentColor by default so icons take
// the color of their surrounding text. Path data lives in `data/iconPaths.ts`.

import { iconPaths } from '../data/iconPaths';

interface IconProps {
  name: keyof typeof iconPaths | string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.75 }: IconProps) {
  const d = iconPaths[name] ?? '';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flex: 'none' }}
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}

export default Icon;
