import React, { memo } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** Line icons drawn on a 24 grid, 1.8 stroke by default. */
const P: Record<string, (c: string) => React.ReactNode> = {
  back: () => <Path d="M15 5l-7 7 7 7" />,
  close: () => <Path d="M6 6l12 12M18 6L6 18" />,
  plus: () => <Path d="M12 5v14M5 12h14" />,
  minus: () => <Path d="M5 12h14" />,
  check: () => <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  undo: () => <Path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11" />,
  redo: () => <Path d="M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 000 11H13" />,
  download: () => <Path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" />,
  share: () => <Path d="M12 15V4M8 8l4-4 4 4M6 12v6.5A1.5 1.5 0 007.5 20h9a1.5 1.5 0 001.5-1.5V12" />,
  device: () => <Rect x={7} y={2.8} width={10} height={18.4} rx={2.6} />,
  phone: () => (
    <>
      <Rect x={7} y={2.8} width={10} height={18.4} rx={2.6} />
      <Path d="M10.5 5.6h3" />
    </>
  ),
  tablet: () => (
    <>
      <Rect x={4.5} y={3} width={15} height={18} rx={2.4} />
      <Circle cx={12} cy={5.6} r={0.4} />
    </>
  ),
  laptop: () => (
    <>
      <Rect x={4.5} y={5} width={15} height={10} rx={1.4} />
      <Path d="M2.5 18.5h19" />
    </>
  ),
  desktop: () => (
    <>
      <Rect x={3} y={4} width={18} height={12} rx={1.6} />
      <Path d="M10 16l-1 4h6l-1-4" />
    </>
  ),
  tv: () => (
    <>
      <Rect x={2.5} y={5} width={19} height={12} rx={1.2} />
      <Path d="M7 20l2-3M17 20l-2-3" />
    </>
  ),
  watch: () => (
    <>
      <Rect x={6.5} y={6.5} width={11} height={11} rx={3} />
      <Path d="M9 6.5L9.6 3h4.8l.6 3.5M9 17.5L9.6 21h4.8l.6-3.5" />
    </>
  ),
  browser: () => (
    <>
      <Rect x={3} y={4.5} width={18} height={15} rx={2.4} />
      <Path d="M3 9h18" />
      <Circle cx={6} cy={6.8} r={0.3} />
      <Circle cx={8} cy={6.8} r={0.3} />
    </>
  ),
  fold: () => (
    <>
      <Rect x={3.5} y={4} width={17} height={16} rx={2.2} />
      <Path d="M12 4v16" strokeDasharray="1.6 1.6" />
    </>
  ),
  screen: () => (
    <>
      <Rect x={7} y={2.8} width={10} height={18.4} rx={2.6} />
      <Path d="M9.5 15l2-2.5 1.5 1.6 1.5-2 1 1.4" />
    </>
  ),
  cube: () => <Path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9" />,
  shadow: () => (
    <>
      <Rect x={5} y={4} width={10} height={13} rx={2} />
      <Path d="M9 20.5h10.5a1.5 1.5 0 001.5-1.5V8.5" />
    </>
  ),
  background: () => (
    <>
      <Rect x={3} y={3} width={18} height={18} rx={3} />
      <Path d="M3 15.5l5-4.5 4 3.5 3-2.5 6 5" />
      <Circle cx={15.5} cy={8} r={1.6} />
    </>
  ),
  light: () => <Path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z" />,
  text: () => <Path d="M5 6.5V5h14v1.5M12 5v14M9 19h6" />,
  shapes: () => (
    <>
      <Circle cx={8} cy={8} r={4.2} />
      <Rect x={12} y={12} width={8.5} height={8.5} rx={1.6} />
    </>
  ),
  layers: () => <Path d="M12 3.5l9 4.8-9 4.8-9-4.8 9-4.8zM3 12.6l9 4.8 9-4.8M3 16.6l9 4.8 9-4.8" />,
  format: () => <Path d="M7 3v14h14M3 7h14v14" />,
  globe: () => (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z" />
    </>
  ),
  link: () => <Path d="M10 14a4.5 4.5 0 006.4.4l3-3a4.5 4.5 0 00-6.4-6.4l-1.3 1.3M14 10a4.5 4.5 0 00-6.4-.4l-3 3a4.5 4.5 0 006.4 6.4l1.3-1.3" />,
  capture: () => <Path d="M4 8V5.5A1.5 1.5 0 015.5 4H8M16 4h2.5A1.5 1.5 0 0120 5.5V8M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16M8 20H5.5A1.5 1.5 0 014 18.5V16M12 9a3 3 0 100 6 3 3 0 000-6z" />,
  images: () => (
    <>
      <Rect x={7} y={3} width={14} height={14} rx={2.2} />
      <Path d="M4 7v11.5A2.5 2.5 0 006.5 21H17M7 13l3.5-3.5L14 13l2-2 5 5" />
    </>
  ),
  grid: () => (
    <>
      <Rect x={3.5} y={3.5} width={7} height={7} rx={1.8} />
      <Rect x={13.5} y={3.5} width={7} height={7} rx={1.8} />
      <Rect x={3.5} y={13.5} width={7} height={7} rx={1.8} />
      <Rect x={13.5} y={13.5} width={7} height={7} rx={1.8} />
    </>
  ),
  settings: () => (
    <>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 010-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 014 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z" />
    </>
  ),
  trash: () => <Path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  copy: () => (
    <>
      <Rect x={8} y={8} width={12} height={12} rx={2.2} />
      <Path d="M16 8V5.5A1.5 1.5 0 0014.5 4h-9A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8" />
    </>
  ),
  eye: () => (
    <>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
  eyeOff: () => <Path d="M4 4l16 16M10.6 6A9.6 9.6 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.9 3.6M6.5 7.4A16.6 16.6 0 002.5 12S6 18.5 12 18.5a9.2 9.2 0 004.4-1.1M9.9 10a3 3 0 004.1 4.1" />,
  lock: () => (
    <>
      <Rect x={5} y={10.5} width={14} height={10} rx={2} />
      <Path d="M8 10.5V8a4 4 0 018 0v2.5" />
    </>
  ),
  unlock: () => (
    <>
      <Rect x={5} y={10.5} width={14} height={10} rx={2} />
      <Path d="M8 10.5V8a4 4 0 017.6-1.7" />
    </>
  ),
  up: () => <Path d="M6 15l6-6 6 6" />,
  down: () => <Path d="M6 9l6 6 6-6" />,
  chevron: () => <Path d="M9 5l7 7-7 7" />,
  search: () => (
    <>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="M16 16l4.5 4.5" />
    </>
  ),
  edit: () => <Path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  refresh: () => <Path d="M20 11a8 8 0 00-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0014.3 4.9L20 16M20 20v-4h-4" />,
  sparkles: () => <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />,
  more: () => (
    <>
      <Circle cx={5.5} cy={12} r={0.9} />
      <Circle cx={12} cy={12} r={0.9} />
      <Circle cx={18.5} cy={12} r={0.9} />
    </>
  ),
  rotate: () => <Path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4.5h4.5" />,
  flip: () => <Path d="M12 3v18M8 7L3 17h5V7zM16 7l5 10h-5V7z" />,
  landscape: () => (
    <>
      <Rect x={2.8} y={7} width={18.4} height={10} rx={2.6} />
    </>
  ),
  magnet: () => <Path d="M6 4v8a6 6 0 0012 0V4M6 8h4M14 8h4M10 4v8a2 2 0 004 0V4" />,
  folder: () => <Path d="M3.5 7.5A1.5 1.5 0 015 6h4.5l2 2.2H19a1.5 1.5 0 011.5 1.5v8.8A1.5 1.5 0 0119 20H5a1.5 1.5 0 01-1.5-1.5v-11z" />,
  app: () => (
    <>
      <Rect x={4} y={4} width={16} height={16} rx={4.5} />
      <Path d="M9 12h6M12 9v6" />
    </>
  ),
  pages: () => (
    <>
      <Rect x={3.5} y={6} width={11} height={14} rx={2} />
      <Path d="M8 3.5h10.5A2 2 0 0120.5 5.5v12" />
    </>
  ),
  palette: () => (
    <>
      <Path d="M12 3a9 9 0 100 18c1 0 1.6-.7 1.6-1.5 0-.5-.2-.8-.5-1.2-.3-.4-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 005-5C21 6.4 17 3 12 3z" />
      <Circle cx={7.5} cy={11} r={0.6} />
      <Circle cx={10} cy={7} r={0.6} />
      <Circle cx={15} cy={7.5} r={0.6} />
    </>
  ),
  align: () => <Path d="M4 6h16M7 10h10M4 14h16M7 18h10" />,
  wand: () => <Path d="M4 20L15 9M14 4v2M18 6l-1.4 1.4M20 10h-2M9 5l1.4 1.4M16.5 7.5l-2 2" />,
  info: () => (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v5.5M12 7.6v.1" />
    </>
  ),
  moon: () => <Path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  sun: () => <Path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z" />,
  language: () => <Path d="M4 5h9M8.5 3v2M6 5c.6 3 2.6 5.6 5.5 7M11 5c-.7 3.6-3.2 6.6-6.5 8M13 21l4-10 4 10M14.5 17.5h5" />,
  star: () => <Path d="M12 3.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8L3.5 9.6l5.9-.8L12 3.5z" />,
  heart: () => <Path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0112 7.3 4.5 4.5 0 0119.5 10c0 5.4-7.5 10-7.5 10z" />,
};

export type IconName = keyof typeof P | string;

export const Icon = memo(function Icon({ name, size = 22, color = '#000', strokeWidth = 1.8, fill }: { name: IconName; size?: number; color?: string; strokeWidth?: number; fill?: string }) {
  const draw = P[name] ?? P.info;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill ?? 'none'} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {draw(color)}
    </Svg>
  );
});
