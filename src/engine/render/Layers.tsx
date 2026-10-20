import {
  BlurMask,
  Group,
  Image,
  Paragraph,
  Path,
  RoundedRect,
  Skia,
  TextAlign,
  type SkImage,
  type SkTypefaceFontProvider,
} from '@shopify/react-native-skia';
import React, { memo, useMemo } from 'react';
import { alpha } from '../color';
import type { FontId, ImageLayer, Layer, ShapeLayer, TextLayer } from '../types';
import { FillPaint } from './Background';
import { DeviceFrame, layerTransform, ShadowOf } from './DeviceFrame';

export const FONT_FAMILY: Record<FontId, string> = {
  bricolage: 'Bricolage Grotesque',
  inter: 'Inter',
  serif: 'serif',
  mono: 'monospace',
};

/** 4-point homography: maps the unit rect (0..w, 0..h) to the four corners (TL, TR, BR, BL). */
export function quadMatrix(w: number, h: number, c: [number, number][]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = c;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0;
  let hh = 0;
  if (sx !== 0 || sy !== 0) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    hh = (dx1 * sy - sx * dy1) / den;
  }
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  // unit square → quad, then scale from w×h to the unit square
  return Skia.Matrix([a / w, b / h, x0, d / w, e / h, y0, g / w, hh / h, 1]);
}

const ImageLayerView = memo(function ImageLayerView({ layer, image }: { layer: ImageLayer; image: SkImage | null }) {
  const transform = useMemo(() => layerTransform(layer), [layer]);
  const path = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(-layer.w / 2, -layer.h / 2, layer.w, layer.h), layer.radius, layer.radius));
    return p.build();
  }, [layer.w, layer.h, layer.radius]);
  if (!image) return null;
  if (layer.corners && layer.corners.length === 4) {
    const m = quadMatrix(image.width(), image.height(), layer.corners);
    return (
      <Group opacity={layer.opacity} matrix={m}>
        <Image image={image} x={0} y={0} width={image.width()} height={image.height()} fit="fill" />
      </Group>
    );
  }
  return (
    <Group opacity={layer.opacity}>
      <ShadowOf path={path} shadow={layer.shadow} transform={transform} depth={0} scale={1} />
      <Group transform={transform} clip={path}>
        <Image image={image} x={-layer.w / 2} y={-layer.h / 2} width={layer.w} height={layer.h} fit="cover" />
      </Group>
      {layer.stroke ? (
        <Group transform={transform}>
          <Path path={path} style="stroke" strokeWidth={layer.stroke.width} color={layer.stroke.color} />
        </Group>
      ) : null}
    </Group>
  );
});

export function buildParagraph(layer: TextLayer, fonts: SkTypefaceFontProvider | null) {
  const align = layer.align === 'center' ? TextAlign.Center : layer.align === 'right' ? TextAlign.Right : TextAlign.Left;
  const builder = fonts ? Skia.ParagraphBuilder.Make({ textAlign: align }, fonts) : Skia.ParagraphBuilder.Make({ textAlign: align });
  builder.pushStyle({
    color: Skia.Color(layer.color),
    fontFamilies: [FONT_FAMILY[layer.font], 'Inter', 'sans-serif'],
    fontSize: layer.size,
    fontStyle: { weight: layer.weight },
    letterSpacing: layer.letterSpacing,
    heightMultiplier: layer.lineHeight,
  });
  builder.addText(layer.uppercase ? layer.text.toUpperCase() : layer.text);
  const p = builder.build();
  p.layout(layer.width);
  return p;
}

const TextLayerView = memo(function TextLayerView({ layer, fonts }: { layer: TextLayer; fonts: SkTypefaceFontProvider | null }) {
  const para = useMemo(() => buildParagraph(layer, fonts), [layer, fonts]);
  const h = para.getHeight();
  const x = -layer.width / 2;
  const y = -h / 2;
  const transform = useMemo(() => [{ translateX: layer.x }, { translateY: layer.y }, { rotate: (layer.rotate * Math.PI) / 180 }], [layer.x, layer.y, layer.rotate]);
  const bg = layer.bg;
  // Background pill hugs the text lines.
  const lw = Math.min(layer.width, para.getLongestLine());
  const bx = layer.align === 'center' ? -lw / 2 : layer.align === 'right' ? layer.width / 2 - lw : x;
  return (
    <Group opacity={layer.opacity} transform={transform}>
      {bg ? <RoundedRect x={bx - bg.padX} y={y - bg.padY} width={lw + bg.padX * 2} height={h + bg.padY * 2} r={bg.radius} color={bg.color} /> : null}
      {layer.shadow && layer.shadow.style !== 'none' ? (
        <Group transform={[{ translateY: layer.shadow.distance }]} opacity={layer.shadow.opacity}>
          <Paragraph paragraph={para} x={x} y={y} width={layer.width}>
            <BlurMask blur={Math.max(0.5, layer.shadow.blur)} style="normal" />
          </Paragraph>
        </Group>
      ) : null}
      <Paragraph paragraph={para} x={x} y={y} width={layer.width} />
    </Group>
  );
});

function shapePath(l: ShapeLayer) {
  const p = Skia.PathBuilder.Make();
  const w = l.w;
  const h = l.h;
  switch (l.shape) {
    case 'circle':
      p.addOval(Skia.XYWHRect(-w / 2, -h / 2, w, h));
      break;
    case 'ring': {
      p.addOval(Skia.XYWHRect(-w / 2, -h / 2, w, h));
      const t = Math.min(w, h) * 0.12;
      p.addOval(Skia.XYWHRect(-w / 2 + t, -h / 2 + t, w - 2 * t, h - 2 * t));
      p.setFillType(1);
      break;
    }
    case 'pedestal': {
      // Cylinder: top ellipse + body; the top is drawn lighter by the view.
      const eh = h * 0.18;
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(-w / 2, -h / 2 + eh / 2, w, h - eh / 2), 0, 0));
      p.addOval(Skia.XYWHRect(-w / 2, h / 2 - eh, w, eh));
      p.addOval(Skia.XYWHRect(-w / 2, -h / 2, w, eh));
      break;
    }
    case 'blob': {
      const n = 7;
      const seed = l.seed ?? 1;
      const pts: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const r = 0.78 + 0.22 * Math.sin(seed * 12.9898 + i * 78.233);
        pts.push([Math.cos(a) * (w / 2) * r, Math.sin(a) * (h / 2) * r]);
      }
      p.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
      for (let i = 0; i < n; i++) {
        const c = pts[i];
        const nx = pts[(i + 1) % n];
        p.quadTo(c[0], c[1], (c[0] + nx[0]) / 2, (c[1] + nx[1]) / 2);
      }
      p.close();
      break;
    }
    case 'star': {
      const n = 5;
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 ? 0.45 : 1;
        const x = Math.cos(a) * (w / 2) * r;
        const y = Math.sin(a) * (h / 2) * r;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      p.close();
      break;
    }
    case 'line':
      p.addRect(Skia.XYWHRect(-w / 2, -h / 2, w, Math.max(1, h)));
      break;
    case 'arrow': {
      const t = h * 0.3;
      p.moveTo(-w / 2, -t / 2);
      p.lineTo(w / 2 - h / 2, -t / 2);
      p.lineTo(w / 2 - h / 2, -h / 2);
      p.lineTo(w / 2, 0);
      p.lineTo(w / 2 - h / 2, h / 2);
      p.lineTo(w / 2 - h / 2, t / 2);
      p.lineTo(-w / 2, t / 2);
      p.close();
      break;
    }
    default:
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(-w / 2, -h / 2, w, h), l.radius, l.radius));
  }
  return p.build();
}

const ShapeLayerView = memo(function ShapeLayerView({ layer, images }: { layer: ShapeLayer; images: Record<string, SkImage | null> }) {
  const path = useMemo(() => shapePath(layer), [layer]);
  const transform = useMemo(() => [{ translateX: layer.x }, { translateY: layer.y }, { rotate: (layer.rotate * Math.PI) / 180 }], [layer.x, layer.y, layer.rotate]);
  return (
    <Group opacity={layer.opacity}>
      <ShadowOf path={path} shadow={layer.shadow} transform={transform} depth={0} scale={1} />
      <Group transform={transform} clip={path}>
        {layer.blur > 0 ? (
          <Group layer>
            <FillPaint fill={layer.fill} w={layer.w * 1.2} h={layer.h * 1.2} x={-layer.w * 0.6} y={-layer.h * 0.6} images={images} />
          </Group>
        ) : (
          <FillPaint fill={layer.fill} w={layer.w} h={layer.h} x={-layer.w / 2} y={-layer.h / 2} images={images} />
        )}
        {layer.shape === 'pedestal' ? (
          <Path path={(() => { const p = Skia.PathBuilder.Make(); p.addOval(Skia.XYWHRect(-layer.w / 2, -layer.h / 2, layer.w, layer.h * 0.18)); return p.build(); })()} color={alpha('#ffffff', 0.22)} />
        ) : null}
      </Group>
      {layer.stroke ? (
        <Group transform={transform}>
          <Path path={path} style="stroke" strokeWidth={layer.stroke.width} color={layer.stroke.color} />
        </Group>
      ) : null}
    </Group>
  );
});

export const LayerView = memo(function LayerView({ layer, images, fonts }: { layer: Layer; images: Record<string, SkImage | null>; fonts: SkTypefaceFontProvider | null }) {
  if (layer.hidden) return null;
  const blend = layer.blend && layer.blend !== 'normal' ? layer.blend : undefined;
  let el: React.ReactNode = null;
  switch (layer.kind) {
    case 'device':
      el = <DeviceFrame layer={layer} image={layer.screen.uri ? images[layer.screen.uri] ?? null : null} />;
      break;
    case 'image':
      el = <ImageLayerView layer={layer} image={images[layer.uri] ?? null} />;
      break;
    case 'text':
      el = <TextLayerView layer={layer} fonts={fonts} />;
      break;
    case 'shape':
      el = <ShapeLayerView layer={layer} images={images} />;
      break;
  }
  return blend ? (
    <Group layer blendMode={blend}>
      {el}
    </Group>
  ) : (
    <>{el}</>
  );
});
