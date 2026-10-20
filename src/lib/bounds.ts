import type { SkTypefaceFontProvider } from '@shopify/react-native-skia';
import { deviceGeometry } from '../engine/render/DeviceFrame';
import { buildParagraph } from '../engine/render/Layers';
import type { Layer, Scene } from '../engine/types';

export type Bounds = { x: number; y: number; w: number; h: number; rotate: number };

/** Approximate unrotated box of a layer, centred on (x, y), in scene px (3D tilt ignored). */
export function layerBounds(l: Layer, fonts: SkTypefaceFontProvider | null): Bounds {
  switch (l.kind) {
    case 'device': {
      const g = deviceGeometry(l);
      // Tilt shrinks the projected box a little: keep handles close to what is seen.
      const cx = Math.cos((l.ry * Math.PI) / 180);
      const cy = Math.cos((l.rx * Math.PI) / 180);
      return { x: l.x, y: l.y, w: g.W * Math.max(0.35, Math.abs(cx)), h: g.H * Math.max(0.35, Math.abs(cy)), rotate: l.rotate };
    }
    case 'text': {
      let h = l.size * l.lineHeight * 1.2;
      let w = l.width;
      try {
        const p = buildParagraph(l, fonts);
        h = p.getHeight();
        w = Math.min(l.width, Math.max(l.size, p.getLongestLine()));
      } catch {
        // estimate
      }
      const pad = l.bg ? l.bg.padX : 0;
      return { x: l.x, y: l.y, w: w + pad * 2, h: h + (l.bg ? l.bg.padY * 2 : 0), rotate: l.rotate };
    }
    case 'image':
    case 'shape':
      return { x: l.x, y: l.y, w: l.w, h: l.h, rotate: l.rotate };
  }
}

/** Topmost visible, unlocked layer under a scene point. */
export function hitTest(scene: Scene, px: number, py: number, fonts: SkTypefaceFontProvider | null, slop = 0): Layer | null {
  for (let i = scene.layers.length - 1; i >= 0; i--) {
    const l = scene.layers[i];
    if (l.hidden || l.locked) continue;
    const b = layerBounds(l, fonts);
    const a = (-b.rotate * Math.PI) / 180;
    const dx = px - b.x;
    const dy = py - b.y;
    const lx = dx * Math.cos(a) - dy * Math.sin(a);
    const ly = dx * Math.sin(a) + dy * Math.cos(a);
    if (Math.abs(lx) <= b.w / 2 + slop && Math.abs(ly) <= b.h / 2 + slop) return l;
  }
  return null;
}
