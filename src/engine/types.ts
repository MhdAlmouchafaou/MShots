/**
 * MShots scene model. A scene is a plain JSON document (saved as a project, used by templates,
 * rendered by SceneCanvas for the editor and for export). All geometry is in scene pixels:
 * (0,0) top-left, scene.width × scene.height is the base export size (export can scale it).
 */

export type Color = string;

export type GradientStop = { color: Color; pos: number };

/** Procedural textures drawn by shaders (see engine/render/shaders.ts). */
export type TextureId =
  | 'fabric'
  | 'velvet'
  | 'linen'
  | 'concrete'
  | 'stone'
  | 'marble'
  | 'terrazzo'
  | 'wood'
  | 'paper'
  | 'sand'
  | 'leather'
  | 'brushed'
  | 'noise';

export type Fill =
  | { type: 'solid'; color: Color }
  | { type: 'linear'; stops: GradientStop[]; angle: number }
  | { type: 'radial'; stops: GradientStop[]; cx: number; cy: number; r: number }
  /** Soft "aurora" gradient from 3–5 colours placed at points (0..1). */
  | { type: 'mesh'; points: { x: number; y: number; color: Color }[]; base: Color; softness: number }
  | { type: 'texture'; texture: TextureId; color: Color; color2: Color; scale: number; contrast: number; angle: number }
  | { type: 'image'; uri: string; fit: 'cover' | 'contain'; blur: number; zoom: number; x: number; y: number };

/** Light overlay patterns projected on the whole scene (sun through a window, leaves…). */
export type LightPattern = 'none' | 'window' | 'blinds' | 'leaves' | 'spot' | 'side' | 'top' | 'rays';

export type Light = {
  pattern: LightPattern;
  /** Direction of the light in degrees (0 = from the top, 90 = from the right). */
  angle: number;
  intensity: number;
  softness: number;
  color: Color;
  /** Shadow side darkening (0..1). */
  shade: number;
};

export type Background = {
  fill: Fill;
  /** Film grain 0..1. */
  grain: number;
  vignette: number;
  /** Global colour adjustments of the background only. */
  brightness: number; // -1..1
  contrast: number; // -1..1
  saturation: number; // -1..1
  temperature: number; // -1 (cool) .. 1 (warm)
  light: Light;
  /** Transparent export (background not drawn). */
  transparent?: boolean;
};

export type ShadowStyle = 'none' | 'soft' | 'floating' | 'contact' | 'long' | 'hard';

export type Shadow = {
  style: ShadowStyle;
  opacity: number;
  blur: number;
  /** Distance of the shadow from the object, in scene px. */
  distance: number;
  /** Direction the shadow falls to, in degrees (0 = down). */
  angle: number;
  color: Color;
};

export type ScreenContent = {
  /** Image shown in the screen (screenshot, capture, photo). null = placeholder. */
  uri: string | null;
  /** Natural size of the image (used for full-page scrolling). */
  iw?: number;
  ih?: number;
  fit: 'cover' | 'contain' | 'top' | 'fill';
  /** Vertical scroll inside a tall capture, 0..1 (top-aligned fits). */
  scroll: number;
  zoom: number;
  /** Colour behind the image (contain) and placeholder colour. */
  bg: Color;
  /** Draw a status bar on top of the screenshot (phones). */
  statusBar: 'none' | 'light' | 'dark';
  /** Glass reflection strength 0..1. */
  glare: number;
  /** Text shown in the address bar of browser windows (website domain). */
  label?: string;
};

type LayerBase = {
  id: string;
  name?: string;
  /** Centre of the layer in scene px. */
  x: number;
  y: number;
  /** Rotation in the scene plane (deg). */
  rotate: number;
  opacity: number;
  hidden?: boolean;
  locked?: boolean;
  blend?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'softLight';
};

export type DeviceLayer = LayerBase & {
  kind: 'device';
  device: string;
  /** Finish id from the device spec (colour of the body). */
  finish: string;
  /** Custom body colour (overrides the finish frame colour). */
  bodyColor?: Color | null;
  /** Height of the device body in scene px (portrait), width for landscape devices. */
  size: number;
  landscape: boolean;
  /** 3D tilt (deg) and camera distance. */
  rx: number;
  ry: number;
  perspective: number;
  /** Body thickness multiplier (0 = flat). */
  depth: number;
  screen: ScreenContent;
  shadow: Shadow;
  /** Show side buttons, camera bump details. */
  details: boolean;
  /** Show the back of the device instead of the screen. */
  back?: boolean;
};

export type ImageLayer = LayerBase & {
  kind: 'image';
  uri: string;
  w: number;
  h: number;
  radius: number;
  rx: number;
  ry: number;
  perspective: number;
  shadow: Shadow;
  /** Optional 4-corner placement (perspective pin), scene px, overrides x/y/w/h when set. */
  corners?: [number, number][] | null;
  stroke?: { color: Color; width: number } | null;
};

export type TextLayer = LayerBase & {
  kind: 'text';
  text: string;
  font: FontId;
  weight: 400 | 500 | 600 | 700 | 800;
  size: number;
  color: Color;
  align: 'left' | 'center' | 'right';
  /** Max width in scene px (wraps). */
  width: number;
  letterSpacing: number;
  lineHeight: number;
  uppercase?: boolean;
  shadow?: Shadow | null;
  /** Optional pill/background behind the text. */
  bg?: { color: Color; radius: number; padX: number; padY: number } | null;
};

export type ShapeKind = 'rect' | 'circle' | 'blob' | 'pedestal' | 'ring' | 'line' | 'star' | 'arrow';

export type ShapeLayer = LayerBase & {
  kind: 'shape';
  shape: ShapeKind;
  w: number;
  h: number;
  radius: number;
  fill: Fill;
  stroke?: { color: Color; width: number } | null;
  blur: number;
  shadow: Shadow;
  seed?: number;
};

export type Layer = DeviceLayer | ImageLayer | TextLayer | ShapeLayer;
export type LayerKind = Layer['kind'];

export type FontId = 'bricolage' | 'inter' | 'serif' | 'mono';

export type Scene = {
  id: string;
  name: string;
  width: number;
  height: number;
  background: Background;
  /** Bottom to top. */
  layers: Layer[];
  /** Template it came from. */
  template?: string;
  createdAt: number;
  updatedAt: number;
};

/** Output formats (aspect presets). */
export type Format = { id: string; label: string; width: number; height: number; group: 'social' | 'store' | 'web' | 'print' | 'free' };
