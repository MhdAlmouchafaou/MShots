import React from 'react';
import Svg, { Defs, Ellipse, G, Mask, Path, Rect } from 'react-native-svg';

/** Brand colours of the MShots mark. */
export const BRAND = { ink: '#111114', face: '#F4F2EE', orange: '#FF5A1F' };

const HULL = 'M305 205 L825 205 L825 725 L735 815 L215 815 L215 295 Z';
const MOUTH = 'M470 462 C 528 492, 650 492, 706 458 C 702 568, 650 620, 588 620 C 522 620, 474 566, 470 462 Z';
const FACE_T = 'skewY(-2.2) translate(30 4)';

/**
 * The MShots mark: a keycap-like device with a smile.
 * - mark: ink body, light face (default)
 * - inverse: light body, dark face (for dark backgrounds)
 * - mono: one colour, the face is cut out (icons, watermarks)
 * - app: the mark on the orange app-icon tile
 */
export function Logo({ size = 48, variant = 'mark', color }: { size?: number; variant?: 'mark' | 'inverse' | 'mono' | 'app'; color?: string }) {
  const ink = variant === 'inverse' ? BRAND.face : BRAND.ink;
  const face = variant === 'inverse' ? BRAND.ink : BRAND.face;
  if (variant === 'mono') {
    const c = color ?? BRAND.ink;
    return (
      <Svg width={size} height={size} viewBox="150 140 740 740">
        <Defs>
          <Mask id="mshots-mono" x="0" y="0" width="1024" height="1024" maskUnits="userSpaceOnUse">
            <Rect x="0" y="0" width="1024" height="1024" fill="#000" />
            <Path d={HULL} fill="#fff" stroke="#fff" strokeWidth={120} strokeLinejoin="round" />
            <G transform={FACE_T}>
              <Rect x="336" y="218" width="470" height="470" rx="66" fill="#000" />
              <Path d={MOUTH} fill="#fff" stroke="#fff" strokeWidth={26} strokeLinejoin="round" />
              <Ellipse cx="560" cy="574" rx="38" ry="24" transform="rotate(-14 560 574)" fill="#000" />
            </G>
          </Mask>
        </Defs>
        <Rect x="0" y="0" width="1024" height="1024" fill={c} mask="url(#mshots-mono)" />
      </Svg>
    );
  }
  const body = (
    <>
      <Path d={HULL} fill={ink} stroke={ink} strokeWidth={120} strokeLinejoin="round" />
      <G transform={FACE_T}>
        <Rect x="336" y="218" width="470" height="470" rx="66" fill={face} />
        <Path d={MOUTH} fill={ink} stroke={ink} strokeWidth={26} strokeLinejoin="round" />
        <Ellipse cx="560" cy="574" rx="38" ry="24" transform="rotate(-14 560 574)" fill={face} />
      </G>
    </>
  );
  if (variant === 'app') {
    return (
      <Svg width={size} height={size} viewBox="0 0 1024 1024">
        <Rect x="0" y="0" width="1024" height="1024" rx="230" fill={color ?? BRAND.orange} />
        <G transform="translate(512 512) scale(0.74) translate(-515 -515)">{body}</G>
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="150 140 740 740">
      {body}
    </Svg>
  );
}

/** Mark + wordmark "MShots" side by side (text drawn by the caller's font). */
export const LOGO_PATHS = { HULL, MOUTH, FACE_T };
