import { Blur, Circle, ColorMatrix, Fill, Group, Image, LinearGradient, RadialGradient, Rect, Shader, vec, type SkImage } from '@shopify/react-native-skia';
import React, { memo } from 'react';
import { parseHex } from '../color';
import type { Background, Fill as FillT, Light } from '../types';
import { effects, lightIndex, textureIndex } from './shaders';

const rad = (d: number) => (d * Math.PI) / 180;

export function color4(c: string): number[] {
  const [r, g, b, a] = parseHex(c);
  return [r / 255, g / 255, b / 255, a];
}

/** Brightness / contrast / saturation / temperature as one colour matrix. */
export function adjustMatrix(brightness: number, contrast: number, saturation: number, temperature: number) {
  const c = 1 + contrast;
  const t = (1 - c) * 0.5 + brightness * 0.35;
  const s = 1 + saturation;
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;
  const sr = (1 - s) * lr;
  const sg = (1 - s) * lg;
  const sb = (1 - s) * lb;
  const warm = temperature * 0.08;
  // saturation then contrast, then temperature offsets
  return [
    (sr + s) * c, sg * c, sb * c, 0, t + warm,
    sr * c, (sg + s) * c, sb * c, 0, t + warm * 0.3,
    sr * c, sg * c, (sb + s) * c, 0, t - warm,
    0, 0, 0, 1, 0,
  ];
}

/** Gradient endpoints for an angle (deg, 0 = top→bottom) over a w×h box. */
export function gradientPoints(angle: number, w: number, h: number, x = 0, y = 0) {
  const a = rad(angle);
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const len = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return { start: vec(cx - dx * len, cy - dy * len), end: vec(cx + dx * len, cy + dy * len) };
}

/** Paints a Fill over a rect (also used by shape layers). */
export const FillPaint = memo(function FillPaint({ fill, w, h, x = 0, y = 0, images, children }: { fill: FillT; w: number; h: number; x?: number; y?: number; images: Record<string, SkImage | null>; children?: React.ReactNode }) {
  switch (fill.type) {
    case 'solid':
      return (
        <Rect x={x} y={y} width={w} height={h} color={fill.color}>
          {children}
        </Rect>
      );
    case 'linear': {
      const { start, end } = gradientPoints(fill.angle, w, h, x, y);
      return (
        <Rect x={x} y={y} width={w} height={h}>
          <LinearGradient start={start} end={end} colors={fill.stops.map((s) => s.color)} positions={fill.stops.map((s) => s.pos)} />
          {children}
        </Rect>
      );
    }
    case 'radial':
      return (
        <Rect x={x} y={y} width={w} height={h}>
          <RadialGradient c={vec(x + fill.cx * w, y + fill.cy * h)} r={Math.max(w, h) * fill.r} colors={fill.stops.map((s) => s.color)} positions={fill.stops.map((s) => s.pos)} />
          {children}
        </Rect>
      );
    case 'mesh': {
      const R = Math.max(w, h) * (0.45 + fill.softness * 0.55);
      return (
        <Group>
          <Rect x={x} y={y} width={w} height={h} color={fill.base} />
          {fill.points.map((p, i) => {
            const [r, g, b] = parseHex(p.color);
            return (
              <Circle key={i} cx={x + p.x * w} cy={y + p.y * h} r={R}>
                <RadialGradient c={vec(x + p.x * w, y + p.y * h)} r={R} colors={[`rgba(${r},${g},${b},0.95)`, `rgba(${r},${g},${b},0.45)`, `rgba(${r},${g},${b},0)`]} positions={[0, 0.45, 1]} />
              </Circle>
            );
          })}
        </Group>
      );
    }
    case 'texture': {
      const fx = effects().texture;
      if (!fx) return <Rect x={x} y={y} width={w} height={h} color={fill.color} />;
      return (
        <Rect x={x} y={y} width={w} height={h}>
          <Shader
            source={fx}
            uniforms={{
              res: [w, h],
              kind: textureIndex(fill.texture),
              c1: color4(fill.color2),
              c2: color4(fill.color),
              scale: Math.max(0.05, fill.scale),
              contrast: fill.contrast,
              angle: rad(fill.angle),
              seed: 3.7,
            }}
          />
          {children}
        </Rect>
      );
    }
    case 'image': {
      const img = images[fill.uri] ?? null;
      if (!img) return <Rect x={x} y={y} width={w} height={h} color="#202024" />;
      const iw = img.width();
      const ih = img.height();
      const s = (fill.fit === 'contain' ? Math.min(w / iw, h / ih) : Math.max(w / iw, h / ih)) * Math.max(0.2, fill.zoom || 1);
      const dw = iw * s;
      const dh = ih * s;
      return (
        <Group clip={{ x, y, width: w, height: h }}>
          <Image image={img} x={x + (w - dw) / 2 + fill.x * w} y={y + (h - dh) / 2 + fill.y * h} width={dw} height={dh} fit="fill">
            {fill.blur > 0 ? <Blur blur={fill.blur} mode="clamp" /> : null}
          </Image>
        </Group>
      );
    }
  }
});

/** Scene background: fill + colour adjustments + vignette (light and grain are drawn on top of the layers). */
export const BackgroundView = memo(function BackgroundView({ bg, w, h, images }: { bg: Background; w: number; h: number; images: Record<string, SkImage | null> }) {
  if (bg.transparent) return null;
  const adjust = bg.brightness || bg.contrast || bg.saturation || bg.temperature;
  return (
    <Group>
      {adjust ? (
        <Group layer>
          <ColorMatrix matrix={adjustMatrix(bg.brightness, bg.contrast, bg.saturation, bg.temperature)} />
          <FillPaint fill={bg.fill} w={w} h={h} images={images} />
        </Group>
      ) : (
        <FillPaint fill={bg.fill} w={w} h={h} images={images} />
      )}
    </Group>
  );
});

/** Light pattern, grain and vignette over the whole composition. */
export const Atmosphere = memo(function Atmosphere({ bg, w, h }: { bg: Background; w: number; h: number }) {
  const fx = effects();
  const light: Light = bg.light;
  return (
    <Group>
      {light.pattern !== 'none' && light.intensity > 0 && fx.light ? (
        <Rect x={0} y={0} width={w} height={h} blendMode="overlay">
          <Shader
            source={fx.light}
            uniforms={{
              res: [w, h],
              kind: lightIndex(light.pattern),
              angle: rad(light.angle),
              intensity: light.intensity,
              softness: light.softness,
              shadeAmt: light.shade,
              tint: color4(light.color),
            }}
          />
          {light.softness > 0.05 ? <Blur blur={light.softness * Math.max(w, h) * 0.01} /> : null}
        </Rect>
      ) : null}
      {bg.vignette > 0 ? (
        <Rect x={0} y={0} width={w} height={h}>
          <RadialGradient c={vec(w / 2, h / 2)} r={Math.hypot(w, h) * 0.62} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', `rgba(0,0,0,${Math.min(0.85, bg.vignette * 0.75)})`]} positions={[0, 0.55, 1]} />
        </Rect>
      ) : null}
      {bg.grain > 0 && fx.grain ? (
        <Rect x={0} y={0} width={w} height={h} blendMode="overlay" opacity={Math.min(1, bg.grain * 0.5)}>
          <Shader source={fx.grain} uniforms={{ res: [w, h], seed: 1.3 }} />
        </Rect>
      ) : null}
    </Group>
  );
});

export { Fill };
