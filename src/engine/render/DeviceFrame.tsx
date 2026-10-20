import {
  BlurMask,
  Circle,
  Group,
  Image,
  LinearGradient,
  matchFont,
  Path,
  RadialGradient,
  Rect,
  rect,
  RoundedRect,
  rrect,
  Skia,
  Text,
  vec,
  type SkImage,
  type SkPath,
  type Transforms3d,
} from '@shopify/react-native-skia';
import React, { memo, useMemo } from 'react';
import { alpha, isDark, mix, shade } from '../color';
import { deviceById, drawnSize, finishOf, screenRect, type DeviceSpec, type Finish } from '../devices';
import type { DeviceLayer, ScreenContent, Shadow } from '../types';

export const rad = (d: number) => (d * Math.PI) / 180;

type Box = { x: number; y: number; w: number; h: number };

/** Geometry of a device layer in local (unrotated, unprojected) coordinates, centred on 0,0. */
export function deviceGeometry(layer: DeviceLayer) {
  const spec = deviceById(layer.device);
  const ds = drawnSize(spec, layer.landscape);
  const k = layer.size / Math.max(ds.w, ds.h);
  const W = ds.w * k;
  const H = ds.h * k;
  // Body box (top-left in local coords): centred horizontally, at the top of the drawn area
  // (straps of watches are drawn above and below the body).
  const strap = spec.base && (spec.base.style === 'strap' || spec.base.style === 'crown-strap') ? spec.base.h * k : 0;
  const body: Box = { x: -ds.bw * k / 2, y: -H / 2 + strap, w: ds.bw * k, h: ds.bh * k };
  const s = screenRect(spec, layer.landscape);
  const screen: Box & { r: number } = { x: body.x + s.x * k, y: body.y + s.y * k, w: s.w * k, h: s.h * k, r: s.r * k };
  return { spec, k, W, H, body, screen, rotate: ds.rotate };
}

export function layerTransform(l: { x: number; y: number; rotate: number; rx: number; ry: number; perspective: number }): Transforms3d {
  return [
    { translateX: l.x },
    { translateY: l.y },
    { perspective: Math.max(200, l.perspective) },
    { rotateX: rad(l.rx) },
    { rotateY: rad(l.ry) },
    { rotate: rad(l.rotate) },
  ];
}

// ------------------------------------------------------------------ shapes

function rr(b: Box, r: number) {
  return rrect(rect(b.x, b.y, b.w, b.h), Math.max(0, r), Math.max(0, r));
}

function inset(b: Box, d: number): Box {
  return { x: b.x + d, y: b.y + d, w: b.w - 2 * d, h: b.h - 2 * d };
}

/** Silhouette path of the whole device (used for shadows and the 3D thickness). */
function silhouette(spec: DeviceSpec, body: Box, k: number, H: number) {
  const p = Skia.PathBuilder.Make();
  if (spec.round) p.addCircle(body.x + body.w / 2, body.y + body.h / 2, body.w / 2);
  else p.addRRect(rr(body, spec.body.r * k));
  return p.build();
}

// ------------------------------------------------------------------ shadow

/** Soft shadow(s) under a shape, projected with the same 3D transform as the object. */
export function ShadowOf({ path, shadow, transform, depth, scale }: { path: SkPath; shadow: Shadow; transform: Transforms3d; depth: number; scale: number }) {
  if (shadow.style === 'none' || shadow.opacity <= 0) return null;
  const a = rad(shadow.angle);
  const d = shadow.distance;
  const dx = Math.sin(a) * d;
  const dy = Math.cos(a) * d;
  const blur = Math.max(0.5, shadow.blur);
  const layers: { dx: number; dy: number; blur: number; op: number; grow: number }[] = [];
  switch (shadow.style) {
    case 'soft':
      layers.push({ dx, dy, blur, op: shadow.opacity, grow: 0 });
      break;
    case 'floating':
      layers.push({ dx: dx * 1.6, dy: dy * 1.6, blur: blur * 1.7, op: shadow.opacity * 0.75, grow: -0.04 });
      layers.push({ dx: dx * 0.6, dy: dy * 0.6, blur: blur * 0.6, op: shadow.opacity * 0.25, grow: -0.02 });
      break;
    case 'contact':
      layers.push({ dx: dx * 0.15, dy: dy * 0.15, blur: blur * 0.18, op: Math.min(1, shadow.opacity * 1.3), grow: 0 });
      layers.push({ dx, dy, blur, op: shadow.opacity * 0.7, grow: 0.01 });
      break;
    case 'long':
      for (let i = 1; i <= 6; i++) layers.push({ dx: (dx * i) / 2, dy: (dy * i) / 2, blur: blur * (0.4 + i * 0.25), op: (shadow.opacity * 0.9) / (i + 0.5), grow: 0 });
      break;
    case 'hard':
      layers.push({ dx, dy, blur: Math.min(blur, 3), op: shadow.opacity, grow: 0 });
      break;
  }
  return (
    <>
      {layers.map((s, i) => (
        <Group key={i} transform={[{ translateX: s.dx }, { translateY: s.dy }, ...transform, { translateZ: -depth }, { scale: 1 + s.grow }]}>
          <Path path={path} color={alpha(shadow.color, s.op)}>
            <BlurMask blur={s.blur / Math.max(0.2, scale)} style="normal" respectCTM />
          </Path>
        </Group>
      ))}
    </>
  );
}

// ------------------------------------------------------------------ screen

/** Text width (falls back to an estimate where measuring is unavailable). */
function textWidth(f: ReturnType<typeof matchFont>, s: string) {
  try {
    return f.measureText(s).width;
  } catch {
    return s.length * f.getSize() * 0.55;
  }
}

let statusFont: ReturnType<typeof matchFont> | null = null;
function font(size: number, weight: '500' | '600' | '700' = '600') {
  // matchFont is cheap but not free: cache the last one per size.
  if (!statusFont || statusFont.getSize() !== size) statusFont = matchFont({ fontFamily: 'sans-serif', fontSize: size, fontWeight: weight });
  return statusFont;
}

/** Placeholder UI when no screenshot is set: a tasteful skeleton. */
function Placeholder({ box, r, color }: { box: Box; r: number; color: string }) {
  const dark = isDark(color);
  const fg = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
  const fg2 = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';
  const u = box.w / 20;
  const rows = Math.max(3, Math.floor((box.h - 6 * u) / (3.2 * u)));
  return (
    <Group>
      <RoundedRect x={box.x} y={box.y} width={box.w} height={box.h} r={r}>
        <LinearGradient start={vec(box.x, box.y)} end={vec(box.x + box.w, box.y + box.h)} colors={[shade(color, 0.04), shade(color, -0.04)]} />
      </RoundedRect>
      <RoundedRect x={box.x + 2 * u} y={box.y + 3.4 * u} width={9 * u} height={1.6 * u} r={0.8 * u} color={fg2} />
      <RoundedRect x={box.x + 2 * u} y={box.y + 5.6 * u} width={16 * u} height={7 * u} r={1.4 * u} color={fg} />
      {Array.from({ length: Math.min(rows, 12) }).map((_, i) => (
        <Group key={i}>
          <Circle cx={box.x + 3.2 * u} cy={box.y + 15 * u + i * 3.2 * u} r={1.1 * u} color={fg2} />
          <RoundedRect x={box.x + 5.2 * u} y={box.y + 14.4 * u + i * 3.2 * u} width={(9 + ((i * 7) % 5)) * u} height={1.2 * u} r={0.6 * u} color={fg} />
        </Group>
      ))}
    </Group>
  );
}

function StatusBar({ box, spec, k, color, island }: { box: Box; spec: DeviceSpec; k: number; color: string; island: boolean }) {
  const h = (spec.family === 'ios' ? 5.6 : 4.4) * k;
  const fs = h * 0.5;
  const f = font(Math.max(4, fs));
  const y = box.y + h * 0.62 + fs * 0.35 + (island ? 0.6 * k : 0);
  const right = box.x + box.w - box.w * 0.08;
  const u = fs * 0.22;
  return (
    <Group>
      <Text x={box.x + box.w * (spec.family === 'ios' ? 0.12 : 0.06)} y={y} text="9:41" font={f} color={color} />
      {/* signal */}
      {[0, 1, 2, 3].map((i) => (
        <RoundedRect key={i} x={right - 9.2 * u * 2.2 + i * 1.6 * u} y={y - (1.2 + i * 0.8) * u * 2} width={1.1 * u} height={(1.2 + i * 0.8) * u * 2} r={0.3 * u} color={color} />
      ))}
      {/* battery */}
      <RoundedRect x={right - 5.2 * u * 2} y={y - 2.6 * u * 2} width={4.6 * u * 2} height={2.4 * u * 2} r={0.7 * u * 2} color={alpha(color, 0.35)} />
      <RoundedRect x={right - 5.0 * u * 2} y={y - 2.4 * u * 2} width={3.4 * u * 2} height={2.0 * u * 2} r={0.5 * u * 2} color={color} />
    </Group>
  );
}

export const ScreenView = memo(function ScreenView({ box, r, content, image, spec, k, round }: { box: Box; r: number; content: ScreenContent; image: SkImage | null; spec: DeviceSpec; k: number; round?: boolean }) {
  const clip = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    if (round) p.addCircle(box.x + box.w / 2, box.y + box.h / 2, box.w / 2);
    else p.addRRect(rr(box, r));
    return p.build();
  }, [box.x, box.y, box.w, box.h, r, round]);
  let draw: Box | null = null;
  if (image) {
    const iw = image.width();
    const ih = image.height();
    const z = Math.max(0.2, content.zoom || 1);
    if (content.fit === 'fill') draw = { ...box };
    else {
      const cover = Math.max(box.w / iw, box.h / ih);
      const contain = Math.min(box.w / iw, box.h / ih);
      const s = (content.fit === 'contain' ? contain : content.fit === 'top' ? box.w / iw : cover) * z;
      const w = iw * s;
      const h = ih * s;
      const x = box.x + (box.w - w) / 2;
      let y = box.y + (box.h - h) / 2;
      if (content.fit === 'top') y = box.y - Math.max(0, h - box.h) * Math.max(0, Math.min(1, content.scroll));
      draw = { x, y, w, h };
    }
  }
  const g = Math.max(0, Math.min(1, content.glare));
  return (
    <Group clip={clip}>
      <Rect x={box.x} y={box.y} width={box.w} height={box.h} color={content.bg} />
      {image && draw ? <Image image={image} x={draw.x} y={draw.y} width={draw.w} height={draw.h} fit="fill" /> : <Placeholder box={box} r={r} color={content.bg} />}
      {content.statusBar !== 'none' && (spec.category === 'phone' || spec.category === 'foldable') ? (
        <StatusBar box={box} spec={spec} k={k} color={content.statusBar === 'light' ? '#ffffff' : '#0b0b0c'} island={spec.cutout.type === 'island'} />
      ) : null}
      {g > 0 ? (
        <Rect x={box.x} y={box.y} width={box.w} height={box.h}>
          <LinearGradient
            start={vec(box.x, box.y)}
            end={vec(box.x + box.w, box.y + box.h)}
            colors={[`rgba(255,255,255,${0.22 * g})`, `rgba(255,255,255,${0.05 * g})`, 'rgba(255,255,255,0)', `rgba(255,255,255,${0.04 * g})`]}
            positions={[0, 0.35, 0.5, 1]}
          />
        </Rect>
      ) : null}
    </Group>
  );
});

// ------------------------------------------------------------------ parts

function metal(b: Box, fin: Finish, color: string) {
  return (
    <LinearGradient
      start={vec(b.x, b.y)}
      end={vec(b.x + b.w, b.y + b.h)}
      colors={[shade(color, 0.28), color, shade(color, -0.18), color, shade(color, 0.18)]}
      positions={[0, 0.22, 0.5, 0.78, 1]}
    />
  );
}

function Buttons({ spec, body, k, color, rotate }: { spec: DeviceSpec; body: Box; k: number; color: string; rotate: boolean }) {
  const t = 0.7 * k;
  return (
    <>
      {spec.buttons.map((b, i) => {
        // Landscape handhelds: sides rotate clockwise (left → top, right → bottom, top → right).
        const side = rotate ? ({ left: 'top', right: 'bottom', top: 'right' } as const)[b.side] : b.side;
        const along = rotate ? body.w : side === 'top' ? body.w : body.h;
        const pos = (rotate ? 1 - b.at - b.len : b.at) * along;
        const len = b.len * along;
        let r: Box;
        if (side === 'left') r = { x: body.x - t, y: body.y + pos, w: t * 2, h: len };
        else if (side === 'right') r = { x: body.x + body.w - t, y: body.y + pos, w: t * 2, h: len };
        else if (side === 'top') r = { x: body.x + pos, y: body.y - t, w: len, h: t * 2 };
        else r = { x: body.x + pos, y: body.y + body.h - t, w: len, h: t * 2 };
        return (
          <RoundedRect key={i} x={r.x} y={r.y} width={r.w} height={r.h} r={t}>
            <LinearGradient start={vec(r.x, r.y)} end={vec(r.x + r.w, r.y + r.h)} colors={[shade(color, 0.25), shade(color, -0.2)]} />
          </RoundedRect>
        );
      })}
    </>
  );
}

function Cutout({ spec, screen, k, rotate }: { spec: DeviceSpec; screen: Box; k: number; rotate: boolean }) {
  const c = spec.cutout;
  if (c.type === 'island') {
    const w = c.w * k;
    const h = c.h * k;
    if (rotate) {
      // Island on the left side in landscape.
      return <RoundedRect x={screen.x + c.y * k} y={screen.y + (screen.h - w) / 2} width={h} height={w} r={h / 2} color="#000" />;
    }
    return (
      <Group>
        <RoundedRect x={screen.x + (screen.w - w) / 2} y={screen.y + c.y * k} width={w} height={h} r={h / 2} color="#000" />
        <Circle cx={screen.x + (screen.w + w) / 2 - h * 0.55} cy={screen.y + c.y * k + h / 2} r={h * 0.22} color="#0d1220">
          <RadialGradient c={vec(screen.x + (screen.w + w) / 2 - h * 0.6, screen.y + c.y * k + h * 0.42)} r={h * 0.22} colors={['#2a3557', '#05070d']} />
        </Circle>
      </Group>
    );
  }
  if (c.type === 'notch') {
    const w = c.w * k;
    const h = c.h * k;
    const p = Skia.PathBuilder.Make();
    if (rotate) {
      const x = screen.x;
      const y = screen.y + (screen.h - w) / 2;
      p.addRRect(rrect(rect(x - h, y, h * 2, w), h * 0.9, h * 0.9));
    } else {
      const x = screen.x + (screen.w - w) / 2;
      const y = screen.y;
      p.addRRect(rrect(rect(x, y - h, w, h * 2), h * 0.9, h * 0.9));
    }
    return <Path path={p.build()} color="#000" />;
  }
  if (c.type === 'punch') {
    const r = c.r * k;
    const cx = rotate ? screen.x + c.y * k + r : screen.x + screen.w * c.x;
    const cy = rotate ? screen.y + screen.h * (1 - c.x) : screen.y + c.y * k + r;
    return (
      <Group>
        <Circle cx={cx} cy={cy} r={r} color="#000" />
        <Circle cx={cx - r * 0.25} cy={cy - r * 0.25} r={r * 0.3} color="#1d2438" />
      </Group>
    );
  }
  return null;
}

function BezelDot({ spec, body, screen, k, rotate }: { spec: DeviceSpec; body: Box; screen: Box; k: number; rotate: boolean }) {
  if (spec.cutout.type !== 'dot') return null;
  const r = spec.cutout.r * k;
  const cx = rotate ? body.x + (screen.x - body.x) / 2 : body.x + body.w / 2;
  const cy = rotate ? body.y + body.h / 2 : body.y + (screen.y - body.y) / 2;
  return <Circle cx={cx} cy={cy} r={r} color="#1a1d27" />;
}

function CameraModule({ spec, body, k, fin, rotate }: { spec: DeviceSpec; body: Box; k: number; fin: Finish; rotate: boolean }) {
  const c = spec.camera;
  if (!c) return null;
  const bw = rotate ? body.h : body.w;
  // The module is defined in portrait body units; landscape back views mirror it to the top-right.
  const m: Box = rotate
    ? { x: body.x + body.w - (c.y + c.h) * bw - 0, y: body.y + c.x * body.h, w: c.h * bw, h: c.w * body.h }
    : { x: body.x + c.x * body.w, y: body.y + c.y * body.w, w: c.w * body.w, h: c.h * body.w };
  if (c.layout === 'bar' && !rotate) {
    m.h = c.h * body.w;
  }
  const r = Math.min(m.w, m.h) * c.r;
  const lensR = Math.min(m.w, m.h) * (c.lenses >= 3 ? 0.22 : 0.26);
  const pts: [number, number][] = [];
  const cx = m.x + m.w / 2;
  const cy = m.y + m.h / 2;
  const L = c.layout;
  if (L === 'triangle') pts.push([m.x + m.w * 0.3, m.y + m.h * 0.3], [m.x + m.w * 0.3, m.y + m.h * 0.72], [m.x + m.w * 0.72, m.y + m.h * 0.51]);
  else if (L === 'column') for (let i = 0; i < c.lenses; i++) pts.push([cx, m.y + (m.h * (i + 0.5)) / c.lenses]);
  else if (L === 'row' || L === 'bar') for (let i = 0; i < c.lenses; i++) pts.push([m.x + m.w * (0.18 + (0.3 * i) / Math.max(1, c.lenses - 1) * Math.min(1, c.lenses - 1)), cy]);
  else pts.push([m.x + m.w * 0.3, m.y + m.h * 0.3], [m.x + m.w * 0.7, m.y + m.h * 0.7]);
  const plate = shade(fin.body, isDark(fin.body) ? 0.06 : -0.05);
  return (
    <Group>
      <RoundedRect x={m.x} y={m.y} width={m.w} height={m.h} r={r} color={plate}>
        <LinearGradient start={vec(m.x, m.y)} end={vec(m.x + m.w, m.y + m.h)} colors={[shade(plate, 0.12), plate, shade(plate, -0.1)]} />
      </RoundedRect>
      <RoundedRect x={m.x} y={m.y} width={m.w} height={m.h} r={r} color={alpha('#000', 0.18)} style="stroke" strokeWidth={0.25 * k} />
      {pts.slice(0, c.lenses).map(([x, y], i) => (
        <Group key={i}>
          <Circle cx={x} cy={y} r={lensR * 1.18} color={shade(fin.frame, -0.35)} />
          <Circle cx={x} cy={y} r={lensR}>
            <RadialGradient c={vec(x - lensR * 0.3, y - lensR * 0.3)} r={lensR * 1.2} colors={['#3b4466', '#0b0e18', '#020205']} />
          </Circle>
          <Circle cx={x - lensR * 0.32} cy={y - lensR * 0.32} r={lensR * 0.18} color="rgba(255,255,255,0.35)" />
        </Group>
      ))}
    </Group>
  );
}

// ------------------------------------------------------------------ device

/**
 * Draws one device layer: shadow, 3D thickness (stacked slices), body, screen, details.
 * `image` is the decoded screenshot (null = placeholder).
 */
export const DeviceFrame = memo(function DeviceFrame({ layer, image }: { layer: DeviceLayer; image: SkImage | null }) {
  const g = useMemo(() => deviceGeometry(layer), [layer]);
  const { spec, k, body, screen, rotate, H } = g;
  const fin = finishOf(spec, layer.finish);
  const frameColor = layer.bodyColor || fin.frame;
  const transform = useMemo(() => layerTransform({ ...layer }), [layer]);
  const path = useMemo(() => silhouette(spec, body, k, H), [spec, body, k, H]);
  const depthPx = spec.depth * k * Math.max(0, layer.depth);
  const slices = depthPx > 0.5 && (Math.abs(layer.rx) > 0.5 || Math.abs(layer.ry) > 0.5) ? Math.min(14, Math.max(4, Math.round(depthPx / 1.2))) : 0;
  const edgeDark = shade(frameColor, -0.42);
  const handheld = spec.category === 'phone' || spec.category === 'tablet' || spec.category === 'foldable';

  const content = (() => {
    if (layer.back && handheld) {
      return (
        <Group>
          <Path path={path}>
            <LinearGradient start={vec(body.x, body.y)} end={vec(body.x + body.w, body.y + body.h)} colors={[shade(fin.body, 0.1), fin.body, shade(fin.body, -0.08)]} />
          </Path>
          <Path path={path} style="stroke" strokeWidth={spec.frame * k * 1.6}>
            {metal(body, fin, frameColor)}
          </Path>
          {layer.details ? <CameraModule spec={spec} body={body} k={k} fin={fin} rotate={rotate} /> : null}
        </Group>
      );
    }
    switch (spec.category) {
      case 'laptop':
        return <Laptop layer={layer} g={g} fin={fin} frameColor={frameColor} image={image} />;
      case 'desktop':
      case 'tv':
        return <Display layer={layer} g={g} fin={fin} frameColor={frameColor} image={image} />;
      case 'watch':
        return <Watch layer={layer} g={g} fin={fin} frameColor={frameColor} image={image} />;
      case 'browser':
        return <Browser layer={layer} g={g} fin={fin} image={image} />;
      default:
        return <Handheld layer={layer} g={g} fin={fin} frameColor={frameColor} image={image} path={path} />;
    }
  })();

  return (
    <Group opacity={layer.opacity}>
      <ShadowOf path={path} shadow={layer.shadow} transform={transform} depth={depthPx} scale={1} />
      <Group transform={transform}>
        {Array.from({ length: slices }).map((_, i) => {
          const t = (slices - i) / slices;
          return (
            <Group key={i} transform={[{ translateZ: -depthPx * t }]}>
              <Path path={path} color={mix(edgeDark, frameColor, 1 - t * 0.85)} />
            </Group>
          );
        })}
        {slices ? (
          <Group transform={[{ translateZ: -depthPx * 0.04 }]}>
            <Path path={path} color={shade(frameColor, 0.15)} />
          </Group>
        ) : null}
        {content}
      </Group>
    </Group>
  );
});

type Geo = ReturnType<typeof deviceGeometry>;

function Handheld({ layer, g, fin, frameColor, image, path }: { layer: DeviceLayer; g: Geo; fin: Finish; frameColor: string; image: SkImage | null; path: SkPath }) {
  const { spec, k, body, screen, rotate } = g;
  const glass = inset(body, spec.frame * k);
  const glassR = Math.max(0, spec.body.r * k - spec.frame * k);
  return (
    <Group>
      {layer.details ? <Buttons spec={spec} body={body} k={k} color={frameColor} rotate={rotate} /> : null}
      <Path path={path}>{metal(body, fin, frameColor)}</Path>
      {/* thin highlight line on the band */}
      <RoundedRect x={body.x + 0.3 * k} y={body.y + 0.3 * k} width={body.w - 0.6 * k} height={body.h - 0.6 * k} r={spec.body.r * k - 0.3 * k} color={alpha(fin.edge, 0.55)} style="stroke" strokeWidth={0.22 * k} />
      <RoundedRect x={glass.x} y={glass.y} width={glass.w} height={glass.h} r={glassR} color="#050506" />
      <ScreenView box={screen} r={screen.r} content={layer.screen} image={image} spec={spec} k={k} />
      <Cutout spec={spec} screen={screen} k={k} rotate={rotate} />
      <BezelDot spec={spec} body={body} screen={screen} k={k} rotate={rotate} />
      {spec.crease ? (
        rotate ? (
          <Rect x={screen.x} y={screen.y + screen.h / 2 - 0.6 * k} width={screen.w} height={1.2 * k}>
            <LinearGradient start={vec(0, screen.y + screen.h / 2 - 0.6 * k)} end={vec(0, screen.y + screen.h / 2 + 0.6 * k)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0)']} />
          </Rect>
        ) : (
          <Rect x={screen.x + screen.w / 2 - 0.6 * k} y={screen.y} width={1.2 * k} height={screen.h}>
            <LinearGradient start={vec(screen.x + screen.w / 2 - 0.6 * k, 0)} end={vec(screen.x + screen.w / 2 + 0.6 * k, 0)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0)']} />
          </Rect>
        )
      ) : null}
    </Group>
  );
}

function Laptop({ layer, g, fin, frameColor, image }: { layer: DeviceLayer; g: Geo; fin: Finish; frameColor: string; image: SkImage | null }) {
  const { spec, k, body, screen } = g;
  const base = spec.base!;
  const deckW = body.w * base.w;
  const deckH = base.h * k;
  const dx = body.x - (deckW - body.w) / 2;
  const dy = body.y + body.h - 1.2 * k;
  const deck = Skia.PathBuilder.Make();
  // Front lip of the base: slightly wider at the bottom, rounded corners.
  deck.moveTo(dx + deckW * 0.012, dy);
  deck.lineTo(dx + deckW * 0.988, dy);
  deck.quadTo(dx + deckW, dy + deckH * 0.2, dx + deckW, dy + deckH * 0.55);
  deck.quadTo(dx + deckW, dy + deckH, dx + deckW - deckH * 1.2, dy + deckH);
  deck.lineTo(dx + deckH * 1.2, dy + deckH);
  deck.quadTo(dx, dy + deckH, dx, dy + deckH * 0.55);
  deck.quadTo(dx, dy + deckH * 0.2, dx + deckW * 0.012, dy);
  deck.close();
  const scoopW = deckW * 0.13;
  return (
    <Group>
      {/* lid */}
      <RoundedRect x={body.x} y={body.y} width={body.w} height={body.h} r={spec.body.r * k}>
        <LinearGradient start={vec(body.x, body.y)} end={vec(body.x, body.y + body.h)} colors={[shade(frameColor, 0.1), shade(frameColor, -0.15)]} />
      </RoundedRect>
      <RoundedRect x={body.x + 0.7 * k} y={body.y + 0.7 * k} width={body.w - 1.4 * k} height={body.h - 1.4 * k} r={Math.max(0, spec.body.r * k - 0.7 * k)} color="#060607" />
      <ScreenView box={screen} r={screen.r} content={layer.screen} image={image} spec={spec} k={k} />
      <Cutout spec={spec} screen={screen} k={k} rotate={false} />
      <BezelDot spec={spec} body={body} screen={screen} k={k} rotate={false} />
      {/* hinge */}
      <Rect x={body.x + body.w * 0.06} y={body.y + body.h - 2.6 * k} width={body.w * 0.88} height={1.6 * k}>
        <LinearGradient start={vec(0, body.y + body.h - 2.6 * k)} end={vec(0, body.y + body.h - 1 * k)} colors={['#111', shade(frameColor, -0.4)]} />
      </Rect>
      {/* base */}
      <Path path={deck.build()}>
        <LinearGradient start={vec(0, dy)} end={vec(0, dy + deckH)} colors={[shade(fin.body, 0.25), fin.body, shade(fin.body, -0.25), shade(fin.body, -0.45)]} positions={[0, 0.2, 0.75, 1]} />
      </Path>
      <RoundedRect x={dx + (deckW - scoopW) / 2} y={dy} width={scoopW} height={deckH * 0.32} r={deckH * 0.16} color={alpha(shade(fin.body, -0.35), 0.9)} />
    </Group>
  );
}

function Display({ layer, g, fin, frameColor, image }: { layer: DeviceLayer; g: Geo; fin: Finish; frameColor: string; image: SkImage | null }) {
  const { spec, k, body, screen } = g;
  const base = spec.base;
  const imac = !!spec.chin;
  const frameTv = spec.id === 'tv-frame';
  const bezelColor = imac ? '#EEEEEC' : frameTv ? frameColor : '#08080A';
  const parts: React.ReactNode[] = [];
  if (base && base.style !== 'none') {
    const bh = base.h * k;
    const top = body.y + body.h;
    const cx = body.x + body.w / 2;
    if (base.style === 'feet') {
      for (const fx of [0.12, 0.88]) {
        const p = Skia.PathBuilder.Make();
        const x = body.x + body.w * fx;
        p.moveTo(x - bh * 0.05, top - bh * 0.1);
        p.lineTo(x + bh * 0.05, top - bh * 0.1);
        p.lineTo(x + bh * 0.5 * (fx < 0.5 ? -1 : 1) + bh * 0.06, top + bh);
        p.lineTo(x + bh * 0.5 * (fx < 0.5 ? -1 : 1) - bh * 0.06, top + bh);
        p.close();
        parts.push(<Path key={fx} path={p.build()} color={shade(frameColor, -0.1)} />);
      }
    } else {
      const neckW = body.w * base.w * (base.style === 'pedestal' ? 0.25 : 0.62);
      const footW = body.w * base.w;
      const neck = Skia.PathBuilder.Make();
      neck.moveTo(cx - neckW / 2, top - bh * 0.25);
      neck.lineTo(cx + neckW / 2, top - bh * 0.25);
      neck.lineTo(cx + neckW / 2 + (base.style === 'pedestal' ? 0 : neckW * 0.1), top + bh * 0.92);
      neck.lineTo(cx - neckW / 2 - (base.style === 'pedestal' ? 0 : neckW * 0.1), top + bh * 0.92);
      neck.close();
      const standColor = imac ? fin.body : base.style === 'stand' ? fin.body : shade(frameColor, 0.06);
      parts.push(
        <Path key="neck" path={neck.build()}>
          <LinearGradient start={vec(cx - neckW / 2, 0)} end={vec(cx + neckW / 2, 0)} colors={[shade(standColor, -0.15), shade(standColor, 0.12), shade(standColor, -0.1)]} />
        </Path>
      );
      parts.push(
        <RoundedRect key="foot" x={cx - footW / 2} y={top + bh * 0.9} width={footW} height={bh * 0.1} r={bh * 0.05}>
          <LinearGradient start={vec(0, top + bh * 0.9)} end={vec(0, top + bh)} colors={[shade(standColor, 0.15), shade(standColor, -0.3)]} />
        </RoundedRect>
      );
    }
  }
  return (
    <Group>
      {parts}
      <RoundedRect x={body.x} y={body.y} width={body.w} height={body.h} r={spec.body.r * k} color={imac ? fin.body : shade(frameColor, -0.1)} />
      <RoundedRect x={body.x + 0.5 * k} y={body.y + 0.5 * k} width={body.w - 1 * k} height={body.h - (imac ? spec.chin! * k : 0) - 1 * k} r={Math.max(0, spec.body.r * k - 0.5 * k)} color={bezelColor} />
      {imac ? (
        <Rect x={body.x} y={body.y + body.h - spec.chin! * k} width={body.w} height={spec.chin! * k - spec.body.r * k * 0.2}>
          <LinearGradient start={vec(0, body.y + body.h - spec.chin! * k)} end={vec(0, body.y + body.h)} colors={[shade(fin.body, 0.08), fin.body, shade(fin.body, -0.08)]} />
        </Rect>
      ) : null}
      {frameTv ? (
        <RoundedRect x={screen.x - 12 * k} y={screen.y - 12 * k} width={screen.w + 24 * k} height={screen.h + 24 * k} r={0} color="#F4F2EC" />
      ) : null}
      <ScreenView box={screen} r={screen.r} content={layer.screen} image={image} spec={spec} k={k} />
    </Group>
  );
}

function Watch({ layer, g, fin, frameColor, image }: { layer: DeviceLayer; g: Geo; fin: Finish; frameColor: string; image: SkImage | null }) {
  const { spec, k, body, screen } = g;
  const base = spec.base;
  const strapColor = base?.color ?? '#222';
  const sw = body.w * (base?.w ?? 0.8);
  const sh = (base?.h ?? 40) * k;
  const sx = body.x + (body.w - sw) / 2;
  const round = !!spec.round;
  const pattern = base?.style === 'crown-strap';
  return (
    <Group>
      {/* straps */}
      {[body.y - sh + body.h * 0.12, body.y + body.h - body.h * 0.12].map((y, i) => (
        <Group key={i}>
          <RoundedRect x={sx} y={y} width={sw} height={sh} r={sw * 0.18}>
            <LinearGradient start={vec(sx, 0)} end={vec(sx + sw, 0)} colors={[shade(strapColor, -0.2), shade(strapColor, 0.1), shade(strapColor, -0.2)]} />
          </RoundedRect>
          {pattern
            ? Array.from({ length: 5 }).map((_, j) => <RoundedRect key={j} x={sx + sw * 0.12} y={y + sh * (0.15 + j * 0.16)} width={sw * 0.76} height={sh * 0.04} r={sh * 0.02} color={shade(strapColor, -0.25)} />)
            : null}
        </Group>
      ))}
      {/* crown + buttons */}
      {spec.buttons.map((b, i) => {
        const big = i === 0;
        const w = (big ? 2.6 : 1.4) * k;
        const x = b.side === 'right' ? body.x + body.w - 0.6 * k : body.x - w + 0.6 * k;
        return (
          <RoundedRect key={i} x={x} y={body.y + body.h * b.at} width={w} height={body.h * b.len} r={w * 0.4}>
            <LinearGradient start={vec(x, 0)} end={vec(x + w, 0)} colors={[shade(frameColor, 0.2), shade(frameColor, -0.3)]} />
          </RoundedRect>
        );
      })}
      {round ? (
        <>
          <Circle cx={body.x + body.w / 2} cy={body.y + body.h / 2} r={body.w / 2}>
            {metal(body, fin, frameColor)}
          </Circle>
          <Circle cx={body.x + body.w / 2} cy={body.y + body.h / 2} r={body.w / 2 - spec.frame * k} color="#050506" />
        </>
      ) : (
        <>
          <RoundedRect x={body.x} y={body.y} width={body.w} height={body.h} r={spec.body.r * k}>
            {metal(body, fin, frameColor)}
          </RoundedRect>
          <RoundedRect x={body.x + spec.frame * k} y={body.y + spec.frame * k} width={body.w - 2 * spec.frame * k} height={body.h - 2 * spec.frame * k} r={Math.max(0, (spec.body.r - spec.frame) * k)} color="#050506" />
        </>
      )}
      <ScreenView box={screen} r={screen.r} content={layer.screen} image={image} spec={spec} k={k} round={round} />
    </Group>
  );
}

function Browser({ layer, g, fin, image }: { layer: DeviceLayer; g: Geo; fin: Finish; image: SkImage | null }) {
  const { spec, k, body, screen } = g;
  const bar = spec.bezel.top * k;
  const dark = isDark(fin.body);
  const r = spec.body.r * k;
  const fg = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const style = spec.browser?.style ?? 'safari';
  const clip = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addRRect(rrect(rect(body.x, body.y, body.w, body.h), r, r));
    return p.build();
  }, [body.x, body.y, body.w, body.h, r]);
  const f = font(Math.max(5, bar * 0.28), '500');
  const url = 'mshots.app';
  const pillW = body.w * (style === 'chrome' ? 0.62 : 0.4);
  return (
    <Group clip={clip}>
      <Rect x={body.x} y={body.y} width={body.w} height={body.h} color={fin.body} />
      <Rect x={body.x} y={body.y} width={body.w} height={bar} color={fin.frame} />
      {[0, 1, 2].map((i) => (
        <Circle key={i} cx={body.x + bar * (0.45 + i * 0.36)} cy={body.y + bar / 2} r={bar * 0.12} color={['#FF5F57', '#FEBC2E', '#28C840'][i]} />
      ))}
      {style !== 'minimal' ? (
        <Group>
          <RoundedRect x={body.x + (body.w - pillW) / 2} y={body.y + bar * 0.2} width={pillW} height={bar * 0.6} r={bar * 0.3} color={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.055)'} />
          <Text x={body.x + body.w / 2 - textWidth(f, url) / 2} y={body.y + bar * 0.5 + f.getSize() * 0.36} text={url} font={f} color={fg} />
        </Group>
      ) : null}
      <Rect x={body.x} y={body.y + bar - 0.5} width={body.w} height={0.8} color={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
      <ScreenView box={screen} r={0} content={layer.screen} image={image} spec={spec} k={k} />
      <RoundedRect x={body.x} y={body.y} width={body.w} height={body.h} r={r} style="stroke" strokeWidth={1} color={dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'} />
    </Group>
  );
}
