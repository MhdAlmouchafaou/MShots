import { Group, type SkImage, type SkTypefaceFontProvider } from '@shopify/react-native-skia';
import React, { memo } from 'react';
import type { Scene } from '../types';
import { Atmosphere, BackgroundView } from './Background';
import { LayerView } from './Layers';

/**
 * Renders a whole scene at scene size, scaled by `scale` (editor fit, export resolution).
 * Pure: all images and fonts are passed in (so it also works offscreen for export).
 */
export const SceneView = memo(function SceneView({
  scene,
  images,
  fonts,
  scale = 1,
  x = 0,
  y = 0,
}: {
  scene: Scene;
  images: Record<string, SkImage | null>;
  fonts: SkTypefaceFontProvider | null;
  scale?: number;
  x?: number;
  y?: number;
}) {
  const { width: w, height: h } = scene;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale }]} clip={{ x: 0, y: 0, width: w, height: h }}>
      <BackgroundView bg={scene.background} w={w} h={h} images={images} />
      {scene.layers.map((l) => (
        <LayerView key={l.id} layer={l} images={images} fonts={fonts} />
      ))}
      {!scene.background.transparent ? <Atmosphere bg={scene.background} w={w} h={h} /> : null}
    </Group>
  );
});

/** Every image uri a scene needs (screens, image layers, image fills). */
export function sceneUris(scene: Scene): string[] {
  const out = new Set<string>();
  const f = scene.background.fill;
  if (f.type === 'image' && f.uri) out.add(f.uri);
  for (const l of scene.layers) {
    if (l.kind === 'device' && l.screen.uri) out.add(l.screen.uri);
    if (l.kind === 'image' && l.uri) out.add(l.uri);
    if (l.kind === 'shape' && l.fill.type === 'image' && l.fill.uri) out.add(l.fill.uri);
  }
  return [...out];
}
