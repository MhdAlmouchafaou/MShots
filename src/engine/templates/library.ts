/**
 * Built-in template library. Every template builds a fresh scene (new ids) with placeholder
 * screens (screen.uri null): the user drops screenshots in afterwards.
 */
import { background, deviceLayer, formatById, linear, newScene, shadow, shapeLayer, solid, textLayer } from '../defaults';
import { deviceById, drawnSize } from '../devices';
import type { Background, DeviceLayer, Fill, Layer, Scene, Shadow, TextureId } from '../types';
import type { Template, TemplateCategory } from './index';
import { registerTemplates } from './registry';

// ------------------------------------------------------------------ backgrounds

const tex = (texture: TextureId, color: string, color2: string, o: Partial<Extract<Fill, { type: 'texture' }>> = {}): Fill => ({ type: 'texture', texture, color, color2, scale: 1, contrast: 0.5, angle: 0, ...o });
const mesh = (base: string, points: [number, number, string][], softness = 0.6): Fill => ({ type: 'mesh', base, softness, points: points.map(([x, y, color]) => ({ x, y, color })) });
const light = (pattern: Background['light']['pattern'], o: Partial<Background['light']> = {}): Background['light'] => ({ pattern, angle: 35, intensity: 0.6, softness: 0.45, color: '#FFF1DA', shade: 0.35, ...o });

type BgId = keyof typeof BG;

const BG = {
  velvetOlive: () => background({ fill: tex('velvet', '#B9A43B', '#3B330A'), light: light('window', { angle: 25 }), grain: 0.12, vignette: 0.35 }),
  velvetPlum: () => background({ fill: tex('velvet', '#8E3A6C', '#2A0A1C', { angle: 0.6 }), light: light('side', { angle: 70, intensity: 0.5 }), grain: 0.12, vignette: 0.35 }),
  velvetNavy: () => background({ fill: tex('velvet', '#35629A', '#0A1A33', { angle: 1.2 }), light: light('spot', { intensity: 0.5 }), grain: 0.12, vignette: 0.4 }),
  velvetRust: () => background({ fill: tex('velvet', '#C25A2C', '#3D1406', { angle: 2.1 }), light: light('window', { angle: -30 }), grain: 0.12, vignette: 0.3 }),
  velvetMoss: () => background({ fill: tex('velvet', '#6F7D3C', '#1C230B', { angle: 0.3 }), light: light('leaves', { intensity: 0.45 }), grain: 0.12, vignette: 0.35 }),
  velvetPink: () => background({ fill: tex('velvet', '#E8A3B5', '#6E2D42', { angle: 1.7 }), light: light('blinds', { intensity: 0.4 }), grain: 0.1, vignette: 0.25 }),
  fabricBeige: () => background({ fill: tex('fabric', '#DCCDB6', '#8C7A60'), light: light('window', { angle: 40, intensity: 0.5 }), grain: 0.1, vignette: 0.2 }),
  fabricSage: () => background({ fill: tex('fabric', '#A9B79A', '#4E5A43', { angle: 0.8 }), light: light('leaves', { intensity: 0.5 }), grain: 0.1, vignette: 0.25 }),
  fabricCharcoal: () => background({ fill: tex('fabric', '#55565A', '#18181A', { angle: 0.4 }), light: light('spot', { intensity: 0.45 }), grain: 0.12, vignette: 0.4 }),
  linenWhite: () => background({ fill: tex('linen', '#EFEAE1', '#B3A994'), light: light('blinds', { angle: 30, intensity: 0.45 }), grain: 0.08, vignette: 0.15 }),
  concreteWarm: () => background({ fill: tex('concrete', '#D6CFC4', '#8E867A'), light: light('leaves', { intensity: 0.5 }), grain: 0.1, vignette: 0.2 }),
  concreteDark: () => background({ fill: tex('concrete', '#6B6865', '#262422'), light: light('spot', { intensity: 0.55 }), grain: 0.14, vignette: 0.45 }),
  stoneGrey: () => background({ fill: tex('stone', '#CFC9C0', '#7B746A'), light: light('window', { angle: 15, intensity: 0.45 }), grain: 0.1, vignette: 0.2 }),
  marbleWhite: () => background({ fill: tex('marble', '#F2F0EB', '#6E6C69', { angle: 0.5 }), light: light('top', { intensity: 0.35 }), grain: 0.05, vignette: 0.15 }),
  marbleBlack: () => background({ fill: tex('marble', '#3A3A3D', '#0E0E10', { angle: 1.1 }), light: light('spot', { intensity: 0.4 }), grain: 0.08, vignette: 0.45 }),
  terrazzo: () => background({ fill: tex('terrazzo', '#EFE8DF', '#8B6E59'), light: light('window', { angle: 50, intensity: 0.4 }), grain: 0.06, vignette: 0.15 }),
  woodOak: () => background({ fill: tex('wood', '#C59563', '#6E4526', { angle: 0.15 }), light: light('blinds', { angle: 20, intensity: 0.45 }), grain: 0.08, vignette: 0.3 }),
  woodWalnut: () => background({ fill: tex('wood', '#7A4E31', '#2E1A0D', { angle: 0.1 }), light: light('window', { intensity: 0.5 }), grain: 0.1, vignette: 0.4 }),
  paperCream: () => background({ fill: tex('paper', '#F3EEE4', '#B8AE9C'), light: light('leaves', { intensity: 0.35 }), grain: 0.06, vignette: 0.1 }),
  sand: () => background({ fill: tex('sand', '#E4CFA6', '#9F845A'), light: light('side', { angle: 60, intensity: 0.4 }), grain: 0.08, vignette: 0.25 }),
  leather: () => background({ fill: tex('leather', '#7B4B2F', '#2C190F'), light: light('spot', { intensity: 0.45 }), grain: 0.08, vignette: 0.4 }),
  brushed: () => background({ fill: tex('brushed', '#D1D4D8', '#7C8086'), light: light('side', { angle: 80, intensity: 0.35 }), grain: 0.04, vignette: 0.2 }),
  studioBeige: () => background({ fill: linear(['#EDE8E0', '#D7CEC1'], 170), light: light('side', { angle: 60, intensity: 0.35 }), grain: 0.08, vignette: 0.2 }),
  studioGrey: () => background({ fill: { type: 'radial', cx: 0.5, cy: 0.35, r: 0.9, stops: [{ color: '#F4F4F5', pos: 0 }, { color: '#C9CACD', pos: 1 }] }, grain: 0.06, vignette: 0.2 }),
  studioWhite: () => background({ fill: linear(['#FAFAF8', '#ECEBE7'], 180), grain: 0.04, vignette: 0.08 }),
  studioDark: () => background({ fill: { type: 'radial', cx: 0.5, cy: 0.4, r: 0.85, stops: [{ color: '#2A2B31', pos: 0 }, { color: '#0B0B0E', pos: 1 }] }, grain: 0.1, vignette: 0.4 }),
  midnight: () => background({ fill: linear(['#1A2340', '#5B5E86', '#C8B6C6'], 180), grain: 0.08, vignette: 0.25 }),
  dusk: () => background({ fill: linear(['#20285A', '#7A6FA8', '#E9C6C8'], 180), grain: 0.08, vignette: 0.2 }),
  sunset: () => background({ fill: linear(['#FF8A4C', '#FF5A6E', '#7A3CC2'], 160), grain: 0.1, vignette: 0.2 }),
  auroraPastel: () => background({ fill: mesh('#EEF0F8', [[0.1, 0.12, '#9BD3FF'], [0.92, 0.2, '#E7F59A'], [0.5, 0.95, '#C7B6FF']]), grain: 0.08, vignette: 0.05 }),
  auroraPeach: () => background({ fill: mesh('#FBEFE7', [[0.15, 0.2, '#FFC2A6'], [0.85, 0.15, '#FFE6A6'], [0.6, 0.9, '#F7A7C5']]), grain: 0.08, vignette: 0.05 }),
  auroraMint: () => background({ fill: mesh('#EAF6F1', [[0.2, 0.15, '#A6F0D6'], [0.85, 0.35, '#B9D7FF'], [0.3, 0.9, '#E9F7B2']]), grain: 0.08, vignette: 0.05 }),
  auroraDark: () => background({ fill: mesh('#0D0E14', [[0.15, 0.15, '#3B2C8F'], [0.9, 0.3, '#0E6C80'], [0.5, 1.0, '#8A2F6B']], 0.55), grain: 0.12, vignette: 0.3 }),
  auroraBlue: () => background({ fill: mesh('#E9EEF8', [[0.1, 0.9, '#7FB2FF'], [0.9, 0.1, '#BFE6FF'], [0.8, 0.85, '#E6F2A3']]), grain: 0.06, vignette: 0.05 }),
  orange: () => background({ fill: linear(['#FF6A2C', '#E8450F'], 180), grain: 0.12, vignette: 0.2 }),
  lime: () => background({ fill: linear(['#DDF26B', '#B9D63A'], 180), grain: 0.1, vignette: 0.15 }),
  cobalt: () => background({ fill: linear(['#3D5BFF', '#2337C9'], 180), grain: 0.12, vignette: 0.25 }),
  cream: () => background({ fill: solid('#F1EBE0'), grain: 0.1, vignette: 0.1 }),
  ink: () => background({ fill: solid('#0E0E10'), grain: 0.12, vignette: 0.3 }),
  lavender: () => background({ fill: linear(['#E6E0F6', '#CFC5EE'], 180), grain: 0.08, vignette: 0.1 }),
  rose: () => background({ fill: linear(['#F6DCD8', '#E9B9B3'], 180), grain: 0.08, vignette: 0.1 }),
  forest: () => background({ fill: linear(['#1E3A2B', '#0E1E16'], 180), light: light('leaves', { intensity: 0.5 }), grain: 0.12, vignette: 0.35 }),
  terracotta: () => background({ fill: linear(['#C7653F', '#9A4325'], 170), light: light('window', { intensity: 0.45 }), grain: 0.12, vignette: 0.3 }),
  sky: () => background({ fill: linear(['#BFE0FF', '#EAF4FF'], 180), grain: 0.06, vignette: 0.05 }),
};

// ------------------------------------------------------------------ helpers

type S = Scene;
const contact = (size: number, angle = 15, op = 0.5): Shadow => shadow({ style: 'contact', blur: size * 0.06, distance: size * 0.045, opacity: op, angle });
const floating = (size: number, op = 0.32): Shadow => shadow({ style: 'floating', blur: size * 0.08, distance: size * 0.1, opacity: op });
const soft = (size: number, op = 0.3): Shadow => shadow({ style: 'soft', blur: size * 0.06, distance: size * 0.04, opacity: op });

function dev(s: S, id: string, o: Partial<DeviceLayer> = {}) {
  const l = deviceLayer(s, id, o);
  if (!o.shadow) l.shadow = soft(l.size);
  return l;
}

function scene(formatId: string, bg: BgId, layers: (s: S) => Layer[], name: string): S {
  const s = newScene(formatId, [], {});
  s.background = BG[bg]();
  s.layers = layers(s);
  s.name = name;
  return s;
}

const ink = (bg: BgId) => (['velvetOlive', 'velvetPlum', 'velvetNavy', 'velvetRust', 'velvetMoss', 'fabricCharcoal', 'concreteDark', 'marbleBlack', 'woodWalnut', 'leather', 'studioDark', 'midnight', 'dusk', 'sunset', 'auroraDark', 'orange', 'cobalt', 'ink', 'forest', 'terracotta'].includes(bg) ? '#FFFFFF' : '#111111');

/** Small editorial labels in the corners (brand identity posters). */
function corners(s: S, color: string, a = 'Year // 2025', b = 'Project // Studio', c = 'Brand Identity'): Layer[] {
  const fs = s.width * 0.024;
  const mk = (text: string, x: number, y: number, align: 'left' | 'right') => textLayer(s, text, { font: 'inter', weight: 600, size: fs, color, align, width: s.width * 0.4, letterSpacing: 0, lineHeight: 1.2, x, y });
  return [mk(a, s.width * 0.25, s.height * 0.05, 'left'), mk(b, s.width * 0.75, s.height * 0.05, 'right'), mk(c, s.width * 0.25, s.height * 0.95, 'left')];
}

function headline(s: S, text: string, color: string, o: { y?: number; size?: number; sub?: string; font?: 'bricolage' | 'inter' } = {}): Layer[] {
  const size = o.size ?? s.width * 0.085;
  const out: Layer[] = [textLayer(s, text, { color, size, y: o.y ?? s.height * 0.13, font: o.font ?? 'bricolage', weight: 800, letterSpacing: -size * 0.03, lineHeight: 1.0 })];
  if (o.sub) out.push(textLayer(s, o.sub, { color, size: size * 0.32, y: (o.y ?? s.height * 0.13) + size * 1.25, font: 'inter', weight: 500, opacity: 0.72, letterSpacing: 0, lineHeight: 1.3, width: s.width * 0.7 }));
  return out;
}

const PHONES = ['iphone-17-pro', 'pixel-10-pro', 'galaxy-s25-ultra', 'iphone-air', 'nothing-phone-3', 'iphone-17-pro-max', 'galaxy-s25', 'pixel-10', 'xiaomi-15', 'tecno-camon', 'oneplus-13', 'iphone-17', 'phone-clay'];
const deviceName = (id: string) => deviceById(id).name;

// ------------------------------------------------------------------ compositions

/** Phone lying on a surface, seen from above at an angle (the hero look of fabric shots). */
const lying = (id: string, o: { rx?: number; ry?: number; rotate?: number; finish?: string; size?: number } = {}) => (s: S): Layer[] => {
  const size = o.size ?? s.height * 0.78;
  return [dev(s, id, { size, rx: o.rx ?? 38, ry: o.ry ?? -16, rotate: o.rotate ?? -24, finish: o.finish ?? deviceById(id).finishes[0].id, x: s.width * 0.52, y: s.height * 0.52, perspective: 2600, depth: 1.2, shadow: contact(size, -20, 0.55), screen: { ...deviceLayer(s, id).screen, statusBar: 'light', glare: 0.4 } })];
};

const flat = (id: string, o: Partial<DeviceLayer> = {}) => (s: S): Layer[] => {
  const l = dev(s, id, o);
  l.shadow = o.shadow ?? contact(l.size, 0, 0.4);
  return [l];
};

const tilted = (id: string, rx: number, ry: number, rotate = 0, o: Partial<DeviceLayer> = {}) => (s: S): Layer[] => {
  const l = dev(s, id, { rx, ry, rotate, perspective: 2200, ...o });
  l.shadow = o.shadow ?? floating(l.size);
  return [l];
};

const pair = (id: string, o: { gap?: number; tilt?: number; finish?: string } = {}) => (s: S): Layer[] => {
  const ds = drawnSize(deviceById(id), false);
  const ratio = ds.w / ds.h;
  const pw = Math.min(s.height * 0.66 * ratio, s.width * 0.38);
  const size = pw / ratio;
  const off = pw / 2 + s.width * (o.gap ?? 0.04);
  const t = o.tilt ?? 0;
  const fin = o.finish ?? deviceById(id).finishes[0].id;
  return [
    dev(s, id, { size, x: s.width / 2 - off, y: s.height * 0.52, rotate: -t, finish: fin, shadow: contact(size, 10, 0.4) }),
    dev(s, id, { size, x: s.width / 2 + off, y: s.height * 0.48, rotate: t, finish: fin, shadow: contact(size, 10, 0.4) }),
  ];
};

const trio = (id: string, o: { fan?: number; finish?: string; y?: number; size?: number } = {}) => (s: S): Layer[] => {
  const size = o.size ?? s.height * 0.6;
  const f = o.fan ?? 12;
  const y = o.y ?? s.height * 0.52;
  const fin = o.finish ?? deviceById(id).finishes[0].id;
  return [
    dev(s, id, { size: size * 0.92, x: s.width * 0.24, y: y + size * 0.05, rotate: -f, finish: fin, shadow: soft(size, 0.28) }),
    dev(s, id, { size: size * 0.92, x: s.width * 0.76, y: y + size * 0.05, rotate: f, finish: fin, shadow: soft(size, 0.28) }),
    dev(s, id, { size, x: s.width * 0.5, y, finish: fin, shadow: soft(size, 0.35) }),
  ];
};

const frontBack = (id: string, finish?: string) => (s: S): Layer[] => {
  const size = s.height * 0.68;
  const fin = finish ?? deviceById(id).finishes[0].id;
  return [
    dev(s, id, { size, x: s.width * 0.36, y: s.height * 0.5, rotate: -10, back: true, finish: fin, shadow: contact(size, 10, 0.45) }),
    dev(s, id, { size, x: s.width * 0.64, y: s.height * 0.52, rotate: 8, finish: fin, shadow: contact(size, 10, 0.45), screen: { ...deviceLayer(s, id).screen, statusBar: 'light' } }),
  ];
};

/** Isometric grid of phones (perspective wall of screens). */
const grid = (id: string, cols = 3, rows = 2) => (s: S): Layer[] => {
  const size = s.height * 0.62;
  const out: Layer[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = s.width * (0.2 + (c / Math.max(1, cols - 1)) * 0.6) + (r - (rows - 1) / 2) * s.width * 0.12;
      const y = s.height * (0.5 + (r - (rows - 1) / 2) * 0.46) + (c - (cols - 1) / 2) * s.height * 0.06;
      out.push(dev(s, id, { size, x, y, rx: 44, ry: -12, rotate: -34, perspective: 2800, shadow: contact(size, -25, 0.4) }));
    }
  }
  return out;
};

const cropped = (id: string, o: Partial<DeviceLayer> = {}) => (s: S): Layer[] => {
  const size = s.height * 1.15;
  return [dev(s, id, { size, x: s.width * 0.55, y: s.height * 0.62, rotate: -8, shadow: contact(size, 10, 0.45), ...o })];
};

const pedestal = (id: string, stone: 'stone' | 'marble' | 'concrete' = 'stone') => (s: S): Layer[] => {
  const size = s.height * 0.62;
  const pw = s.width * 0.62;
  const ph = s.height * 0.16;
  return [
    shapeLayer(s, 'pedestal', { w: pw, h: ph, x: s.width / 2, y: s.height * 0.8, fill: tex(stone, stone === 'marble' ? '#ECEAE5' : '#8F8B86', stone === 'marble' ? '#5B5A58' : '#2E2C2A'), shadow: shadow({ style: 'soft', blur: 30, distance: 20, opacity: 0.35 }) }),
    dev(s, id, { size, x: s.width / 2, y: s.height * 0.8 - ph * 0.42 - size / 2, shadow: soft(size, 0.25) }),
  ];
};

const laptopPhone = (lap: string, phone: string) => (s: S): Layer[] => {
  const ls = s.width * 0.66;
  const ps = s.height * 0.5;
  return [
    dev(s, lap, { size: ls, x: s.width * 0.44, y: s.height * 0.5, shadow: contact(ls, 0, 0.35) }),
    dev(s, phone, { size: ps, x: s.width * 0.82, y: s.height * 0.62, rotate: 0, shadow: contact(ps, 0, 0.4) }),
  ];
};

const responsive = (desk: string, tab: string, phone: string) => (s: S): Layer[] => {
  const ds = s.width * 0.56;
  const ts = s.height * 0.5;
  const ps = s.height * 0.38;
  return [
    dev(s, desk, { size: ds, x: s.width * 0.47, y: s.height * 0.46, shadow: soft(ds, 0.25) }),
    dev(s, tab, { size: ts, x: s.width * 0.18, y: s.height * 0.62, shadow: contact(ts, 0, 0.35) }),
    dev(s, phone, { size: ps, x: s.width * 0.82, y: s.height * 0.68, shadow: contact(ps, 0, 0.4) }),
  ];
};

const browser = (id: string, o: Partial<DeviceLayer> = {}) => (s: S): Layer[] => {
  const size = deviceLayer(s, id).size;
  return [dev(s, id, { size, shadow: shadow({ style: 'floating', blur: size * 0.05, distance: size * 0.05, opacity: 0.25 }), screen: { ...deviceLayer(s, id).screen, fit: 'top', label: 'votre-site.com', glare: 0 }, ...o })];
};

const browserStack = (a: string, b: string) => (s: S): Layer[] => {
  const size = s.width * 0.66;
  return [
    dev(s, b, { size, x: s.width * 0.42, y: s.height * 0.42, shadow: soft(size, 0.2), screen: { ...deviceLayer(s, b).screen, fit: 'top', label: 'votre-site.com', glare: 0 } }),
    dev(s, a, { size, x: s.width * 0.58, y: s.height * 0.58, shadow: floating(size, 0.3), screen: { ...deviceLayer(s, a).screen, fit: 'top', label: 'votre-site.com', glare: 0 } }),
  ];
};

const tabletTable = (id: string, o: { landscape?: boolean; rx?: number; ry?: number; rotate?: number; finish?: string } = {}) => (s: S): Layer[] => {
  const size = (o.landscape ?? true) ? s.width * 0.82 : s.height * 0.72;
  return [dev(s, id, { size, landscape: o.landscape ?? true, rx: o.rx ?? 34, ry: o.ry ?? -10, rotate: o.rotate ?? -14, perspective: 2800, depth: 1.2, finish: o.finish ?? deviceById(id).finishes[0].id, shadow: contact(size, -15, 0.5) })];
};

const watchHero = (id: string) => (s: S): Layer[] => {
  const size = s.height * 0.8;
  return [dev(s, id, { size, shadow: floating(size * 0.6, 0.3) })];
};

const imacSet = (finish: string) => (s: S): Layer[] => {
  const is = s.height * 0.78;
  const ps = s.height * 0.36;
  const ws = s.height * 0.3;
  return [
    dev(s, 'imac-24', { size: is, x: s.width * 0.42, y: s.height * 0.48, finish, shadow: soft(is, 0.22) }),
    dev(s, 'iphone-17', { size: ps, x: s.width * 0.8, y: s.height * 0.7, shadow: contact(ps, 0, 0.4) }),
    dev(s, 'watch-series', { size: ws, x: s.width * 0.93, y: s.height * 0.72, shadow: contact(ws, 0, 0.4) }),
  ];
};

const tvRoom = (id: string) => (s: S): Layer[] => {
  const size = s.width * 0.74;
  return [dev(s, id, { size, y: s.height * 0.46, shadow: soft(size, 0.25) }), shapeLayer(s, 'rect', { w: s.width, h: s.height * 0.2, x: s.width / 2, y: s.height * 0.92, radius: 0, fill: linear(['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)'], 180), opacity: 0.8 })];
};

const withText = (layers: (s: S) => Layer[], text: string, bg: BgId, o: { sub?: string; y?: number; size?: number } = {}) => (s: S): Layer[] => [...layers(s), ...headline(s, text, ink(bg), o)];

const withCorners = (layers: (s: S) => Layer[], bg: BgId, a?: string, b?: string, c?: string) => (s: S): Layer[] => [...layers(s), ...corners(s, ink(bg), a, b, c)];

/** Device sits low, headline at the top (store / social). */
const storeShot = (id: string, text: string, bg: BgId, sub?: string) => (s: S): Layer[] => {
  const size = s.height * 0.78;
  return [...headline(s, text, ink(bg), { y: s.height * 0.1, size: s.width * 0.09, sub }), dev(s, id, { size, y: s.height * 0.66, shadow: soft(size, 0.3), screen: { ...deviceLayer(s, id).screen, statusBar: 'dark' } })];
};

// ------------------------------------------------------------------ catalogue

type Def = { id: string; name: string; category: TemplateCategory; format: string; bg: BgId; build: (s: S) => Layer[]; tags?: string[]; featured?: boolean; screens?: number };

const defs: Def[] = [];
const add = (d: Def) => defs.push(d);

// Phones lying on soft surfaces (the signature look)
const lyingSet: [BgId, string, string, Partial<{ rx: number; ry: number; rotate: number; finish: string }>][] = [
  ['velvetOlive', 'iphone-17-pro', 'Velours olive', {}],
  ['velvetPlum', 'iphone-17-pro', 'Velours prune', { finish: 'black', rotate: 22, ry: 16 }],
  ['velvetNavy', 'pixel-10-pro', 'Velours nuit', { rotate: -12 }],
  ['velvetRust', 'iphone-17-pro', 'Velours rouille', { finish: 'orange', rotate: 30, ry: 18 }],
  ['velvetMoss', 'galaxy-s25-ultra', 'Velours mousse', { rotate: -35 }],
  ['velvetPink', 'iphone-air', 'Velours rose', { rotate: 18, ry: 12 }],
  ['fabricBeige', 'iphone-17-pro', 'Lin beige', { finish: 'desert' }],
  ['fabricSage', 'nothing-phone-3', 'Coton sauge', { rotate: 26, ry: 14 }],
  ['fabricCharcoal', 'iphone-17-pro-max', 'Tissu anthracite', { finish: 'black' }],
  ['linenWhite', 'iphone-17', 'Drap blanc', { rotate: -8 }],
  ['leather', 'iphone-17-pro', 'Cuir cognac', { finish: 'natural', rotate: 15 }],
  ['sand', 'pixel-10', 'Sable chaud', { rotate: -40 }],
];
lyingSet.forEach(([bg, d, n, o], i) => add({ id: `lying-${i}`, name: `${n} · ${deviceName(d)}`, category: 'scene', format: i % 3 === 2 ? 'square' : 'post-45', bg, build: lying(d, o), tags: ['réaliste', 'tissu', 'incliné'], featured: i < 5 }));

// Phones on hard surfaces
const hardSet: [BgId, string, string][] = [
  ['concreteWarm', 'iphone-17-pro', 'Béton & feuillage'],
  ['concreteDark', 'galaxy-s25-ultra', 'Béton nuit'],
  ['stoneGrey', 'pixel-10-pro', 'Pierre grise'],
  ['marbleWhite', 'iphone-17-pro', 'Marbre blanc'],
  ['marbleBlack', 'iphone-17-pro-max', 'Marbre noir'],
  ['terrazzo', 'iphone-air', 'Terrazzo'],
  ['woodOak', 'iphone-17', 'Chêne & stores'],
  ['woodWalnut', 'oneplus-13', 'Noyer'],
  ['paperCream', 'phone-clay', 'Papier crème'],
  ['brushed', 'xiaomi-15', 'Métal brossé'],
];
hardSet.forEach(([bg, d, n], i) => add({ id: `surface-${i}`, name: `${n} · ${deviceName(d)}`, category: 'scene', format: 'post-45', bg, build: lying(d, { rx: 30 + (i % 3) * 6, ry: i % 2 ? 14 : -14, rotate: i % 2 ? 20 : -22 }), tags: ['réaliste', 'surface'], featured: i === 0 || i === 3 }));

// Flat studio phones
const flatSet: [BgId, string, string][] = [
  ['studioBeige', 'iphone-17-pro', 'Studio beige'],
  ['studioGrey', 'pixel-10-pro', 'Studio gris'],
  ['studioWhite', 'iphone-17', 'Studio blanc'],
  ['studioDark', 'iphone-17-pro', 'Studio sombre'],
  ['cream', 'galaxy-s25', 'Crème minimal'],
  ['lavender', 'iphone-air', 'Lavande'],
  ['rose', 'iphone-17', 'Rose poudré'],
  ['sky', 'pixel-10', 'Ciel'],
  ['lime', 'nothing-phone-3', 'Citron vert'],
  ['ink', 'iphone-17-pro-max', 'Encre'],
];
flatSet.forEach(([bg, d, n], i) => add({ id: `flat-${i}`, name: `${n} · ${deviceName(d)}`, category: 'phone', format: ['post-45', 'square', 'story'][i % 3], bg, build: flat(d), tags: ['minimal', 'face'] }));

// Tilted / floating phones
const tiltSet: [BgId, string, number, number, number][] = [
  ['auroraPastel', 'iphone-17-pro', 18, -28, 0],
  ['auroraPeach', 'iphone-air', 14, 30, -6],
  ['auroraMint', 'pixel-10-pro', 22, -20, 8],
  ['auroraDark', 'iphone-17-pro-max', 16, 26, 0],
  ['auroraBlue', 'galaxy-s25-ultra', 10, -34, 4],
  ['midnight', 'iphone-17-pro', 24, 18, -10],
  ['dusk', 'iphone-17', 12, -26, 6],
  ['sunset', 'nothing-phone-3', 20, 24, -8],
  ['studioDark', 'galaxy-s25', 26, -18, 10],
  ['cobalt', 'iphone-17-pro', 14, 32, 0],
];
tiltSet.forEach(([bg, d, rx, ry, rot], i) => add({ id: `float-${i}`, name: `Flottant ${i + 1} · ${deviceName(d)}`, category: 'phone', format: i % 2 ? 'square' : 'post-45', bg, build: tilted(d, rx, ry, rot), tags: ['3d', 'flottant'], featured: i === 0 || i === 3 }));

// Pairs, trios, front/back, grids, crops, pedestals
(['iphone-17-pro', 'pixel-10-pro', 'galaxy-s25', 'iphone-air'] as const).forEach((d, i) => add({ id: `pair-${i}`, name: `Duo · ${deviceName(d)}`, category: 'multi', format: i % 2 ? 'landscape' : 'post-45', bg: (['studioBeige', 'auroraPastel', 'cream', 'rose'] as BgId[])[i], build: pair(d, { tilt: i % 2 ? 6 : 0, gap: i % 2 ? 0.05 : 0.03 }), screens: 2 }));
(['iphone-17-pro', 'pixel-10', 'iphone-17', 'galaxy-s25-ultra', 'phone-clay'] as const).forEach((d, i) => add({ id: `trio-${i}`, name: `Trio en éventail · ${deviceName(d)}`, category: 'multi', format: 'landscape', bg: (['auroraPeach', 'studioGrey', 'lavender', 'studioDark', 'cream'] as BgId[])[i], build: trio(d, { fan: 8 + i * 2 }), screens: 3, featured: i === 0 }));
([['iphone-17-pro', 'orange', 'orange'], ['iphone-17-pro', 'blue', 'cobalt'], ['iphone-17-pro', 'natural', 'studioBeige'], ['pixel-10-pro', 'porcelain', 'cream'], ['galaxy-s25-ultra', 'titanium-gray', 'studioDark'], ['iphone-air', 'mist', 'sky']] as const).forEach(([d, f, bg], i) =>
  add({ id: `frontback-${i}`, name: `Recto verso · ${deviceName(d)}`, category: 'phone', format: 'square', bg: bg as BgId, build: frontBack(d, f), tags: ['dos', 'couleur'], featured: i === 0 })
);
(['iphone-17-pro', 'pixel-10-pro', 'iphone-17'] as const).forEach((d, i) => add({ id: `grid-${i}`, name: `Mur d’écrans · ${deviceName(d)}`, category: 'multi', format: 'landscape', bg: (['studioBeige', 'auroraDark', 'concreteWarm'] as BgId[])[i], build: grid(d), screens: 6, featured: i === 0 }));
(['iphone-17-pro', 'pixel-10-pro', 'iphone-17', 'galaxy-s25'] as const).forEach((d, i) => add({ id: `crop-${i}`, name: `Gros plan · ${deviceName(d)}`, category: 'phone', format: 'post-45', bg: (['studioGrey', 'orange', 'cream', 'terracotta'] as BgId[])[i], build: cropped(d, { rotate: i % 2 ? 10 : -8 }), tags: ['détail'] }));
([['iphone-17-pro', 'stone', 'studioGrey'], ['pixel-10-pro', 'marble', 'studioBeige'], ['iphone-air', 'concrete', 'studioDark']] as const).forEach(([d, st, bg], i) => add({ id: `pedestal-${i}`, name: `Piédestal ${st === 'marble' ? 'marbre' : st === 'stone' ? 'pierre' : 'béton'} · ${deviceName(d)}`, category: 'scene', format: 'post-45', bg: bg as BgId, build: pedestal(d, st), featured: i === 0 }));

// Back views alone
(['iphone-17-pro', 'xiaomi-15-ultra', 'pixel-10-pro', 'nothing-phone-3'] as const).forEach((d, i) => add({ id: `back-${i}`, name: `Dos · ${deviceName(d)}`, category: 'phone', format: 'square', bg: (['velvetRust', 'studioDark', 'cream', 'studioWhite'] as BgId[])[i], build: flat(d, { back: true, rotate: i % 2 ? 12 : -12 }) }));

// Tablets
([['ipad-pro-13', 'woodOak', true], ['ipad-pro-11', 'velvetOlive', true], ['ipad-air-11', 'linenWhite', false], ['galaxy-tab-s10', 'concreteWarm', true], ['ipad-mini', 'fabricBeige', false], ['xiaomi-pad-7', 'terrazzo', true], ['ipad-pro-13', 'marbleBlack', true], ['ipad-11', 'paperCream', false]] as const).forEach(([d, bg, land], i) =>
  add({ id: `tablet-table-${i}`, name: `Tablette posée · ${deviceName(d)}`, category: 'tablet', format: land ? 'dribbble' : 'post-45', bg: bg as BgId, build: tabletTable(d, { landscape: land, rotate: i % 2 ? 12 : -14, ry: i % 2 ? 10 : -10 }), tags: ['réaliste'], featured: i === 0 })
);
([['ipad-pro-13', 'auroraPastel', true], ['ipad-pro-11', 'studioBeige', false], ['galaxy-tab-s10', 'studioDark', true], ['surface-pro', 'auroraBlue', true], ['tablet-clay', 'cream', false]] as const).forEach(([d, bg, land], i) =>
  add({ id: `tablet-flat-${i}`, name: `Tablette studio · ${deviceName(d)}`, category: 'tablet', format: land ? 'dribbble' : 'post-45', bg: bg as BgId, build: flat(d, { landscape: land, size: land ? undefined : undefined }) })
);

// Laptops
([['macbook-pro-14', 'concreteWarm'], ['macbook-air-13', 'woodOak'], ['macbook-pro-16', 'studioDark'], ['laptop-windows', 'studioGrey'], ['surface-laptop', 'auroraPastel'], ['laptop-xps', 'linenWhite'], ['laptop-clay', 'cream'], ['macbook-air-15', 'sky']] as const).forEach(([d, bg], i) =>
  add({ id: `laptop-${i}`, name: `Portable · ${deviceName(d)}`, category: 'laptop', format: 'landscape', bg: bg as BgId, build: flat(d, { size: undefined }), tags: ['web'], featured: i === 0 })
);
([['macbook-pro-14', 'auroraDark', 16, -24], ['macbook-air-13', 'auroraPeach', 12, 26], ['laptop-gaming', 'studioDark', 18, -20]] as const).forEach(([d, bg, rx, ry], i) =>
  add({ id: `laptop-3d-${i}`, name: `Portable en perspective · ${deviceName(d)}`, category: 'laptop', format: 'landscape', bg: bg as BgId, build: tilted(d, rx, ry, 0, { size: undefined }) })
);
([['macbook-pro-14', 'iphone-17-pro', 'studioBeige'], ['macbook-air-13', 'pixel-10', 'auroraMint'], ['laptop-windows', 'galaxy-s25', 'concreteWarm']] as const).forEach(([l, p, bg], i) =>
  add({ id: `laptop-phone-${i}`, name: `Portable + mobile · ${deviceName(l)}`, category: 'multi', format: 'landscape', bg: bg as BgId, build: laptopPhone(l, p), screens: 2, featured: i === 0 })
);

// Desktops
(['blue', 'green', 'pink', 'silver', 'orange'] as const).forEach((f, i) => add({ id: `imac-${i}`, name: `Bureau iMac ${f}`, category: 'desktop', format: 'landscape', bg: (['studioBeige', 'auroraMint', 'rose', 'studioGrey', 'auroraPeach'] as BgId[])[i], build: imacSet(f), screens: 3, featured: i === 0 }));
([['studio-display', 'studioDark'], ['monitor-27', 'concreteWarm'], ['monitor-ultrawide', 'auroraDark'], ['monitor-24-white', 'cream'], ['pro-display', 'studioGrey']] as const).forEach(([d, bg], i) =>
  add({ id: `monitor-${i}`, name: `Écran · ${deviceName(d)}`, category: 'desktop', format: 'landscape', bg: bg as BgId, build: flat(d, { size: undefined }), tags: ['web'] })
);
([['monitor-27', 'ipad-pro-11', 'iphone-17-pro', 'studioBeige'], ['studio-display', 'ipad-air-11', 'iphone-17', 'auroraPastel'], ['imac-24', 'galaxy-tab-s10', 'pixel-10', 'studioGrey'], ['monitor-24-white', 'tablet-generic', 'galaxy-s25', 'cream']] as const).forEach(([a, b, c, bg], i) =>
  add({ id: `responsive-${i}`, name: `Site responsive ${i + 1}`, category: 'web', format: 'landscape', bg: bg as BgId, build: responsive(a, b, c), screens: 3, tags: ['responsive', 'web'], featured: i === 0 })
);

// Browser windows
([['browser-light', 'auroraPastel'], ['browser-dark', 'auroraDark'], ['browser-minimal', 'studioBeige'], ['browser-safari-dark', 'midnight'], ['browser-chrome-light', 'sky'], ['browser-light', 'orange'], ['browser-minimal', 'lime'], ['browser-dark', 'concreteDark']] as const).forEach(([d, bg], i) =>
  add({ id: `browser-${i}`, name: `Fenêtre web · ${deviceName(d)}`, category: 'web', format: i % 3 === 2 ? 'dribbble' : 'landscape', bg: bg as BgId, build: browser(d), tags: ['site', 'web'], featured: i === 0 })
);
add({ id: 'browser-stack-0', name: 'Deux fenêtres superposées', category: 'web', format: 'landscape', bg: 'auroraBlue', build: browserStack('browser-light', 'browser-dark'), screens: 2 });
add({ id: 'browser-stack-1', name: 'Deux fenêtres minimales', category: 'web', format: 'dribbble', bg: 'studioGrey', build: browserStack('browser-minimal', 'browser-minimal'), screens: 2 });
add({ id: 'browser-tilt-0', name: 'Fenêtre en perspective', category: 'web', format: 'landscape', bg: 'auroraDark', build: (s) => browser('browser-dark', { rx: 18, ry: -22, perspective: 2400 })(s) });

// Watches & TVs
([['watch-ultra', 'studioDark'], ['watch-series', 'cream'], ['watch-round', 'auroraMint'], ['watch-se', 'rose'], ['galaxy-watch-ultra', 'concreteDark'], ['pixel-watch', 'studioBeige']] as const).forEach(([d, bg], i) =>
  add({ id: `watch-${i}`, name: `Montre · ${deviceName(d)}`, category: 'watch', format: 'square', bg: bg as BgId, build: watchHero(d) })
);
([['tv-65', 'midnight'], ['tv-frame', 'cream'], ['tv-55-pedestal', 'studioDark'], ['tv-wall', 'woodWalnut']] as const).forEach(([d, bg], i) =>
  add({ id: `tv-${i}`, name: `Salon · ${deviceName(d)}`, category: 'tv', format: 'landscape', bg: bg as BgId, build: tvRoom(d) })
);

// Foldables
([['galaxy-z-fold7', 'studioGrey'], ['pixel-10-pro-fold', 'auroraPastel'], ['tecno-phantom-fold', 'velvetNavy']] as const).forEach(([d, bg], i) =>
  add({ id: `fold-${i}`, name: `Pliable · ${deviceName(d)}`, category: 'phone', format: 'square', bg: bg as BgId, build: i === 2 ? lying(d, { size: undefined }) : flat(d) })
);

// Social posts with headline
const socialSet: [string, BgId, string, string, string][] = [
  ['iphone-17-pro', 'orange', 'Suivez vos progrès', 'Une app simple pour avancer chaque jour.', 'post-45'],
  ['pixel-10-pro', 'cream', 'Votre agenda, enfin clair', 'Tout au même endroit.', 'post-45'],
  ['iphone-air', 'lavender', 'Écoutez, créez, partagez', 'Le studio audio dans votre poche.', 'story'],
  ['galaxy-s25', 'lime', 'Nouveau', 'Découvrez la version 2.0', 'square'],
  ['iphone-17', 'auroraPeach', 'Bienvenue', 'Téléchargez gratuitement.', 'story'],
  ['nothing-phone-3', 'ink', 'Track fitness data', 'Steps · Sleep · Heart', 'post-45'],
  ['iphone-17-pro-max', 'cobalt', 'Payez en un geste', 'Rapide. Sûr. Sans frais.', 'post-45'],
  ['pixel-10', 'sky', 'La météo qui vous comprend', '', 'story'],
  ['iphone-17-pro', 'rose', 'Prenez soin de vous', 'Un jour à la fois.', 'square'],
  ['galaxy-s25-ultra', 'studioDark', 'Pensé pour les pros', 'Tableaux de bord en temps réel.', 'post-45'],
];
socialSet.forEach(([d, bg, t, sub, f], i) =>
  add({ id: `social-${i}`, name: `Post · ${t}`, category: 'social', format: f, bg, build: storeShot(d, t, bg, sub || undefined), tags: ['texte', 'réseaux'], featured: i < 2 })
);

// Store screenshots
const storeSet: [string, BgId, string, string][] = [
  ['iphone-17-pro', 'auroraPastel', 'Organisez votre journée', 'appstore-67'],
  ['iphone-17-pro', 'auroraPeach', 'Des rappels intelligents', 'appstore-67'],
  ['iphone-17-pro', 'auroraMint', 'Synchronisé partout', 'appstore-67'],
  ['pixel-10-pro', 'sky', 'Tout votre budget en un coup d’œil', 'play-phone'],
  ['pixel-10-pro', 'lavender', 'Des graphiques clairs', 'play-phone'],
  ['galaxy-s25', 'cream', 'Commandez en 2 clics', 'play-phone'],
  ['galaxy-s25', 'lime', 'Livraison suivie en direct', 'play-phone'],
  ['iphone-air', 'ink', 'Le mode sombre parfait', 'appstore-67'],
];
storeSet.forEach(([d, bg, t, f], i) => add({ id: `store-${i}`, name: `Store · ${t}`, category: 'store', format: f, bg, build: storeShot(d, t, bg), tags: ['store', 'texte'] }));
add({ id: 'store-feature-0', name: 'Bannière Play Store', category: 'store', format: 'play-feature', bg: 'cobalt', build: (s) => [...headline(s, 'Votre app', '#FFFFFF', { y: s.height * 0.42, size: s.width * 0.07 }).map((l) => ({ ...l, x: s.width * 0.3 }) as Layer), dev(s, 'pixel-10-pro', { size: s.height * 1.05, x: s.width * 0.76, y: s.height * 0.7, rotate: -10, shadow: soft(s.height, 0.3) })] });

// Brand identity posters with corner labels
const posterSet: [BgId, (s: S) => Layer[], string][] = [
  ['terracotta', tabletTable('ipad-pro-13', { rotate: -28, rx: 30, ry: -12 }), 'Affiche tablette terracotta'],
  ['velvetOlive', lying('iphone-17-pro'), 'Affiche velours'],
  ['studioBeige', flat('iphone-17-pro'), 'Affiche studio'],
  ['ink', tilted('iphone-17-pro-max', 18, -24), 'Affiche noire'],
  ['cream', pair('iphone-17'), 'Affiche duo'],
  ['concreteWarm', lying('pixel-10-pro', { rotate: 20 }), 'Affiche béton'],
  ['orange', frontBack('iphone-17-pro', 'orange'), 'Affiche orange'],
  ['midnight', tabletTable('ipad-pro-11', { landscape: false, rotate: 12 }), 'Affiche crépuscule'],
];
posterSet.forEach(([bg, b, n], i) => add({ id: `poster-${i}`, name: n, category: 'social', format: i % 2 ? 'post-45' : 'pinterest', bg, build: withCorners(b, bg, 'Year // 2025', 'Project // Nom', 'Brand Identity'), tags: ['affiche', 'portfolio'], featured: i < 3 }));

// Headlines over hero scenes
add({ id: 'hero-0', name: 'Titre + téléphone flottant', category: 'social', format: 'story', bg: 'auroraDark', build: (s) => [...headline(s, 'Design Threads', '#FFFFFF', { y: s.height * 0.1, size: s.width * 0.12, sub: 'Rejoignez la communauté' }), dev(s, 'iphone-17-pro', { size: s.height * 0.64, y: s.height * 0.6, rx: 14, ry: -20, perspective: 2400, shadow: floating(s.height * 0.6, 0.35) })], featured: true });
add({ id: 'hero-1', name: 'Titre + trio', category: 'social', format: 'landscape', bg: 'studioBeige', build: (s) => [...headline(s, 'Smarter living starts here', '#111111', { y: s.height * 0.13, size: s.width * 0.05 }), ...trio('iphone-17-pro', { y: s.height * 0.62, size: s.height * 0.62 })(s)] });
add({ id: 'hero-2', name: 'Calendrier minimal', category: 'social', format: 'pinterest', bg: 'cream', build: (s) => [textLayer(s, 'SWA | L’art de travailler intelligemment', { font: 'inter', weight: 600, size: s.width * 0.032, color: '#F26A3D', y: s.height * 0.07, letterSpacing: 0, lineHeight: 1.2 }), dev(s, 'iphone-17-pro', { size: s.height * 0.8, y: s.height * 0.57, shadow: soft(s.height * 0.8, 0.25) })] });

// Clay set
(['phone-clay', 'tablet-clay', 'laptop-clay'] as const).forEach((d, i) => add({ id: `clay-${i}`, name: `Argile · ${deviceName(d)}`, category: d === 'phone-clay' ? 'phone' : d === 'tablet-clay' ? 'tablet' : 'laptop', format: i === 2 ? 'landscape' : 'post-45', bg: (['auroraPeach', 'studioGrey', 'cream'] as BgId[])[i], build: flat(d, { finish: ['peach', 'clay', 'sand'][i] }), tags: ['argile', 'minimal'] }));

// More Android phones lying/flat for variety
(['tecno-camon', 'infinix-note-50', 'redmi-note-14-pro', 'galaxy-a56', 'oneplus-nord-4', 'motorola-edge-60', 'oppo-find-x8', 'vivo-x200'] as const).forEach((d, i) =>
  add({ id: `android-${i}`, name: `${deviceName(d)} · ${i % 2 ? 'posé' : 'studio'}`, category: 'phone', format: 'post-45', bg: (['fabricBeige', 'studioGrey', 'velvetNavy', 'cream', 'concreteWarm', 'auroraMint', 'marbleWhite', 'studioDark'] as BgId[])[i], build: i % 2 ? lying(d, { rotate: i % 4 === 1 ? 18 : -18 }) : flat(d) })
);

// ------------------------------------------------------------------ fix-ups + registration

/** Templates where builder sizes were left undefined get the default sizing. */
function finalize(s: S): S {
  for (const l of s.layers) {
    if (l.kind === 'device' && !(l.size > 0)) {
      const d = deviceLayer(s, l.device, { landscape: l.landscape });
      l.size = d.size;
      l.shadow = l.shadow?.blur ? l.shadow : d.shadow;
    }
  }
  return s;
}

const templates: Template[] = defs.map((d) => ({
  id: d.id,
  name: d.name,
  category: d.category,
  tags: d.tags ?? [],
  featured: d.featured,
  screens: d.screens ?? 1,
  build: () => {
    const s = scene(d.format, d.bg, d.build, d.name);
    s.template = d.id;
    // keep the chosen format size
    const f = formatById(d.format);
    s.width = f.width;
    s.height = f.height;
    return finalize(s);
  },
}));

registerTemplates(templates);

export const TEMPLATE_COUNT = templates.length;
