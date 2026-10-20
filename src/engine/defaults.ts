import { deviceById, drawnSize } from './devices';
import type { Background, DeviceLayer, Fill, Format, ImageLayer, Layer, Scene, ScreenContent, Shadow, ShapeLayer, TextLayer } from './types';

let n = 0;
export const uid = (p = 'l') => `${p}${Date.now().toString(36)}${(n++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export const FORMATS: Format[] = [
  { id: 'post-45', label: 'Post 4:5', width: 1080, height: 1350, group: 'social' },
  { id: 'square', label: 'Carré 1:1', width: 1080, height: 1080, group: 'social' },
  { id: 'story', label: 'Story 9:16', width: 1080, height: 1920, group: 'social' },
  { id: 'landscape', label: 'Paysage 16:9', width: 1920, height: 1080, group: 'web' },
  { id: 'dribbble', label: 'Dribbble 4:3', width: 1600, height: 1200, group: 'web' },
  { id: 'behance', label: 'Behance 1400', width: 1400, height: 1100, group: 'web' },
  { id: 'twitter', label: 'X / Twitter 16:9', width: 1600, height: 900, group: 'social' },
  { id: 'linkedin', label: 'LinkedIn 1.91:1', width: 1200, height: 627, group: 'social' },
  { id: 'youtube', label: 'Miniature YouTube', width: 1280, height: 720, group: 'social' },
  { id: 'pinterest', label: 'Pinterest 2:3', width: 1000, height: 1500, group: 'social' },
  { id: 'play-phone', label: 'Play Store téléphone', width: 1080, height: 1920, group: 'store' },
  { id: 'appstore-67', label: 'App Store 6.7″', width: 1290, height: 2796, group: 'store' },
  { id: 'play-feature', label: 'Play Store bannière', width: 1024, height: 500, group: 'store' },
  { id: 'a4', label: 'A4 portrait', width: 2480, height: 3508, group: 'print' },
  { id: 'wallpaper', label: 'Fond d’écran 4K', width: 3840, height: 2160, group: 'web' },
];

export const formatById = (id: string) => FORMATS.find((f) => f.id === id) ?? FORMATS[0];

export const shadow = (o: Partial<Shadow> = {}): Shadow => ({ style: 'soft', opacity: 0.32, blur: 40, distance: 30, angle: 0, color: '#000000', ...o });

export const screen = (o: Partial<ScreenContent> = {}): ScreenContent => ({ uri: null, fit: 'cover', scroll: 0, zoom: 1, bg: '#F2F1EE', statusBar: 'none', glare: 0.35, ...o });

export const solid = (color: string): Fill => ({ type: 'solid', color });
export const linear = (colors: string[], angle = 180): Fill => ({ type: 'linear', angle, stops: colors.map((color, i) => ({ color, pos: colors.length === 1 ? 0 : i / (colors.length - 1) })) });

export function background(o: Partial<Background> = {}): Background {
  return {
    fill: solid('#ECEAE5'),
    grain: 0.15,
    vignette: 0.15,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    light: { pattern: 'none', angle: 35, intensity: 0.5, softness: 0.4, color: '#FFF4E0', shade: 0.3 },
    ...o,
  };
}

/** A device layer centred in a scene, sized to fill `fill` of the scene height. */
export function deviceLayer(scene: { width: number; height: number }, device: string, o: Partial<DeviceLayer> = {}): DeviceLayer {
  const spec = deviceById(device);
  // Fit inside the scene with a margin, whatever the device and scene shapes.
  const ds = drawnSize(spec, !!o.landscape);
  const maxW = scene.width * 0.8;
  const maxH = scene.height * 0.74;
  const k = Math.min(maxW / ds.w, maxH / ds.h);
  const size = Math.max(ds.w, ds.h) * k;
  return {
    id: uid('d'),
    kind: 'device',
    device,
    finish: spec.finishes[0].id,
    bodyColor: null,
    x: scene.width / 2,
    y: scene.height / 2,
    rotate: 0,
    opacity: 1,
    size,
    landscape: false,
    rx: 0,
    ry: 0,
    perspective: 2400,
    depth: 1,
    details: true,
    screen: screen({ statusBar: 'none' }),
    shadow: shadow({ blur: size * 0.05, distance: size * 0.035, opacity: 0.35 }),
    ...o,
  };
}

export function textLayer(scene: { width: number; height: number }, text: string, o: Partial<TextLayer> = {}): TextLayer {
  return {
    id: uid('t'),
    kind: 'text',
    text,
    font: 'bricolage',
    weight: 700,
    size: scene.width * 0.075,
    color: '#111111',
    align: 'center',
    width: scene.width * 0.84,
    letterSpacing: -1,
    lineHeight: 1.05,
    x: scene.width / 2,
    y: scene.height * 0.12,
    rotate: 0,
    opacity: 1,
    ...o,
  };
}

export function shapeLayer(scene: { width: number; height: number }, shape: ShapeLayer['shape'], o: Partial<ShapeLayer> = {}): ShapeLayer {
  return {
    id: uid('s'),
    kind: 'shape',
    shape,
    w: scene.width * 0.4,
    h: scene.width * 0.4,
    radius: 24,
    fill: solid('#FF5A1F'),
    stroke: null,
    blur: 0,
    shadow: shadow({ style: 'none' }),
    x: scene.width / 2,
    y: scene.height / 2,
    rotate: 0,
    opacity: 1,
    ...o,
  };
}

export function imageLayer(scene: { width: number; height: number }, uri: string, w: number, h: number, o: Partial<ImageLayer> = {}): ImageLayer {
  const s = Math.min((scene.width * 0.6) / w, (scene.height * 0.6) / h);
  return {
    id: uid('i'),
    kind: 'image',
    uri,
    w: w * s,
    h: h * s,
    radius: 24,
    rx: 0,
    ry: 0,
    perspective: 2400,
    shadow: shadow({ opacity: 0.25 }),
    x: scene.width / 2,
    y: scene.height / 2,
    rotate: 0,
    opacity: 1,
    ...o,
  };
}

export function newScene(formatId = 'post-45', layers: Layer[] = [], bg: Partial<Background> = {}): Scene {
  const f = formatById(formatId);
  const now = Date.now();
  return { id: uid('p'), name: 'Sans titre', width: f.width, height: f.height, background: background(bg), layers, createdAt: now, updatedAt: now };
}

/** Deep copy (scenes are plain JSON). */
export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
