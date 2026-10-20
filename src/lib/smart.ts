import { background, deviceLayer, linear, newScene, shadow, textLayer } from '../engine/defaults';
import { deviceById } from '../engine/devices';
import type { DeviceLayer, Scene } from '../engine/types';

export type CaptureInput = { uri: string; w?: number; h?: number };
export type CaptureKind = 'web' | 'app' | 'image';

/** Picks a device whose screen suits a capture's aspect ratio. */
export function deviceFor(c: CaptureInput, kind: CaptureKind): { device: string; landscape: boolean; fit: DeviceLayer['screen']['fit'] } {
  const ar = c.w && c.h ? c.w / c.h : 0.46;
  if (kind === 'web') {
    if (ar >= 0.9 || (c.w ?? 0) >= 900) return { device: 'browser-light', landscape: false, fit: 'top' };
    if (ar >= 0.6) return { device: 'ipad-pro-11', landscape: false, fit: 'top' };
    return { device: 'iphone-17-pro', landscape: false, fit: 'top' };
  }
  if (ar < 0.62) return { device: 'iphone-17-pro', landscape: false, fit: ar < 0.4 ? 'top' : 'cover' };
  if (ar < 0.9) return { device: 'ipad-pro-11', landscape: false, fit: 'cover' };
  if (ar < 1.15) return { device: 'galaxy-z-fold7', landscape: false, fit: 'cover' };
  if (ar < 1.5) return { device: 'ipad-pro-13', landscape: true, fit: 'cover' };
  return { device: 'macbook-pro-14', landscape: false, fit: 'top' };
}

/** A tasteful scene built from 1–3 captures (more captures become extra pages). */
export function sceneFromCaptures(caps: CaptureInput[], kind: CaptureKind, label?: string): Scene[] {
  const groups: CaptureInput[][] = [];
  const first = caps.slice(0, 3);
  const firstPick = first.map((c) => deviceFor(c, kind));
  const sameFamily = firstPick.every((p) => deviceById(p.device).category === deviceById(firstPick[0].device).category);
  if (first.length > 1 && sameFamily && deviceById(firstPick[0].device).category === 'phone') {
    groups.push(first);
    for (const c of caps.slice(3)) groups.push([c]);
  } else {
    for (const c of caps) groups.push([c]);
  }
  const palettes = [
    ['#EDE7DD', '#D9CFC0'],
    ['#E6ECF2', '#C9D6E4'],
    ['#EFE9F7', '#D6CBEA'],
    ['#F1E6DF', '#E2C9B9'],
  ];
  return groups.map((g, gi) => {
    const pick = g.map((c) => deviceFor(c, kind));
    const wide = pick.some((p) => {
      const cat = deviceById(p.device).category;
      return cat === 'browser' || cat === 'laptop' || p.landscape;
    });
    const scene = newScene(wide ? 'landscape' : 'post-45', [], background({ fill: linear(palettes[gi % palettes.length], 165), grain: 0.12, vignette: 0.12 }));
    scene.name = label ?? 'Mockup';
    const n = g.length;
    g.forEach((c, i) => {
      const p = pick[i];
      const layer = deviceLayer(scene, p.device, {
        landscape: p.landscape,
        screen: { uri: c.uri, iw: c.w, ih: c.h, fit: p.fit, scroll: 0, zoom: 1, bg: '#FFFFFF', statusBar: 'none', glare: 0.3, label },
      });
      if (n > 1) {
        const spread = scene.width * 0.3;
        layer.x = scene.width / 2 + (i - (n - 1) / 2) * spread;
        layer.size = scene.height * 0.62;
        layer.rotate = (i - (n - 1) / 2) * 6;
        layer.y = scene.height * 0.54 + Math.abs(i - (n - 1) / 2) * scene.height * 0.03;
        layer.shadow = shadow({ blur: layer.size * 0.05, distance: layer.size * 0.035, opacity: 0.3 });
      }
      scene.layers.push(layer);
    });
    if (label && gi === 0) scene.layers.push(textLayer(scene, label, { y: scene.height * 0.09, size: scene.width * (wide ? 0.04 : 0.06), weight: 700 }));
    return scene;
  });
}
