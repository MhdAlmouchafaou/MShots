import { drawAsImage, ImageFormat, type SkTypefaceFontProvider } from '@shopify/react-native-skia';
import React from 'react';
import { loadImage } from './images';
import { SceneView, sceneUris } from './render/SceneView';
import type { Scene } from './types';

export type ExportOptions = { scale: number; format: 'png' | 'jpg' | 'webp'; quality: number };

/** Renders a scene offscreen at scene size × scale. Returns base64 data. */
export async function renderScene(scene: Scene, fonts: SkTypefaceFontProvider | null, o: ExportOptions): Promise<{ base64: string; width: number; height: number }> {
  const uris = sceneUris(scene);
  const images: Record<string, any> = {};
  await Promise.all(uris.map(async (u) => (images[u] = await loadImage(u))));
  const width = Math.round(scene.width * o.scale);
  const height = Math.round(scene.height * o.scale);
  const img = await drawAsImage(React.createElement(SceneView, { scene, images, fonts, scale: o.scale }), { width, height });
  if (!img) throw new Error('render failed');
  const fmt = o.format === 'jpg' ? ImageFormat.JPEG : o.format === 'webp' ? ImageFormat.WEBP : ImageFormat.PNG;
  return { base64: img.encodeToBase64(fmt, Math.round(o.quality * 100)), width, height };
}
