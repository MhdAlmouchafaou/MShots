import { BlurMask, Canvas, Circle, Group, Line, Rect, RoundedRect, vec } from '@shopify/react-native-skia';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useImages } from '../../engine/images';
import { SceneView, sceneUris } from '../../engine/render/SceneView';
import type { Layer, Scene } from '../../engine/types';
import { hitTest, layerBounds } from '../../lib/bounds';
import { useFontProvider } from '../../lib/fonts';
import { edit, select, useEditor } from '../../store/editor';
import { useSettings } from '../../store/settings';
import { useTheme } from '../../theme';
import { tap } from '../ui';

type Props = { scene: Scene; selected: string | null; onDoubleTap: (l: Layer) => void };

/** Applies a geometric change to one layer (position, scale, rotation). */
function transformLayer(l: Layer, o: { x?: number; y?: number; scale?: number; rotate?: number }): Layer {
  const n = { ...l } as Layer;
  if (o.x !== undefined) n.x = o.x;
  if (o.y !== undefined) n.y = o.y;
  if (o.rotate !== undefined) n.rotate = o.rotate;
  if (o.scale !== undefined) {
    if (n.kind === 'device') n.size = Math.max(40, n.size * o.scale);
    else if (n.kind === 'text') {
      n.size = Math.max(6, n.size * o.scale);
      n.width = Math.max(40, n.width * o.scale);
    } else {
      n.w = Math.max(10, n.w * o.scale);
      n.h = Math.max(10, n.h * o.scale);
    }
  }
  return n;
}

function setLayer(id: string, fn: (l: Layer) => Layer, key: string) {
  edit((scene) => {
    const i = scene.layers.findIndex((l) => l.id === id);
    if (i < 0) return scene;
    const layers = scene.layers.slice();
    layers[i] = fn(layers[i]);
    return { ...scene, layers };
  }, `${id}:${key}`);
}

const Checker = memo(function Checker({ w, h }: { w: number; h: number }) {
  const s = Math.max(12, Math.round(Math.min(w, h) / 24));
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < h; y += s) for (let x = (y / s) % 2 ? s : 0; x < w; x += s * 2) cells.push(<Rect key={`${x}-${y}`} x={x} y={y} width={Math.min(s, w - x)} height={Math.min(s, h - y)} color="#DADADA" />);
  return (
    <Group>
      <Rect x={0} y={0} width={w} height={h} color="#F4F4F4" />
      {cells}
    </Group>
  );
});

/**
 * Interactive artboard: renders the scene fitted to the view, draws the selection, and turns
 * gestures into edits (tap select, drag move, pinch scale, twist rotate, snapping to centre).
 */
export const EditorCanvas = memo(function EditorCanvas({ scene, selected, onDoubleTap }: Props) {
  const t = useTheme();
  const fonts = useFontProvider();
  const snapping = useSettings((s) => s.snapping);
  const uris = useMemo(() => sceneUris(scene), [scene]);
  const images = useImages(uris);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const pad = 18;
  const scale = box.w > 0 ? Math.min((box.w - pad * 2) / scene.width, (box.h - pad * 2) / scene.height) : 0;
  const ox = (box.w - scene.width * scale) / 2;
  const oy = (box.h - scene.height * scale) / 2;

  // Live values for gestures (refs: no re-render per event).
  const live = useRef({ scale, ox, oy, scene, selected, fonts });
  live.current = { scale, ox, oy, scene, selected, fonts };
  const drag = useRef<{ id: string; x: number; y: number; rotate: number; startX: number; startY: number; gScale: number; gRot: number; gx: number; gy: number } | null>(null);
  const frame = useRef<number | null>(null);
  const pending = useRef<(() => void) | null>(null);
  const schedule = useCallback((fn: () => void) => {
    pending.current = fn;
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const f = pending.current;
      pending.current = null;
      f?.();
    });
  }, []);

  const toScene = (x: number, y: number) => {
    const c = live.current;
    return { x: (x - c.ox) / Math.max(0.0001, c.scale), y: (y - c.oy) / Math.max(0.0001, c.scale) };
  };

  const begin = (x: number, y: number) => {
    const c = live.current;
    const p = toScene(x, y);
    let l = c.selected ? c.scene.layers.find((q) => q.id === c.selected) ?? null : null;
    // Start on another layer: grab that one instead.
    const hit = hitTest(c.scene, p.x, p.y, c.fonts, 12 / Math.max(0.0001, c.scale));
    if (hit && (!l || hit.id !== l.id)) {
      const b = l ? layerBounds(l, c.fonts) : null;
      const inSel = b && Math.abs(p.x - b.x) < b.w / 2 && Math.abs(p.y - b.y) < b.h / 2;
      if (!inSel) {
        l = hit;
        select(hit.id);
      }
    }
    if (!l || l.locked) {
      drag.current = null;
      return;
    }
    drag.current = { id: l.id, x: l.x, y: l.y, rotate: l.rotate, startX: p.x, startY: p.y, gScale: 1, gRot: 0, gx: 0, gy: 0 };
  };

  const apply = () => {
    const d = drag.current;
    const c = live.current;
    if (!d) return;
    let nx = d.x + d.gx;
    let ny = d.y + d.gy;
    let v = false;
    let h = false;
    if (snapping) {
      const th = 9 / Math.max(0.0001, c.scale);
      if (Math.abs(nx - c.scene.width / 2) < th) {
        nx = c.scene.width / 2;
        v = true;
      }
      if (Math.abs(ny - c.scene.height / 2) < th) {
        ny = c.scene.height / 2;
        h = true;
      }
    }
    setGuides((g) => {
      if (g.v !== v || g.h !== h) {
        if ((v && !g.v) || (h && !g.h)) tap('selection');
        return { v, h };
      }
      return g;
    });
    let rot = d.rotate + d.gRot;
    // Snap rotation to multiples of 45° (within 3°).
    const near = Math.round(rot / 45) * 45;
    if (Math.abs(rot - near) < 3) rot = near;
    const sc = d.gScale;
    d.gScale = 1;
    setLayer(d.id, (l) => transformLayer(l, { x: nx, y: ny, rotate: rot, scale: sc !== 1 ? sc : undefined }), 'gesture');
  };

  const end = () => {
    drag.current = null;
    setGuides({ v: false, h: false });
  };

  const tapAt = (x: number, y: number) => {
    const c = live.current;
    const p = toScene(x, y);
    const hit = hitTest(c.scene, p.x, p.y, c.fonts, 8 / Math.max(0.0001, c.scale));
    select(hit?.id ?? null);
    if (hit) tap('selection');
  };

  const doubleAt = (x: number, y: number) => {
    const c = live.current;
    const p = toScene(x, y);
    const hit = hitTest(c.scene, p.x, p.y, c.fonts, 8 / Math.max(0.0001, c.scale));
    if (hit) {
      select(hit.id);
      onDoubleTap(hit);
    }
  };

  const gestures = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .maxPointers(2)
      .minDistance(4)
      .onStart((e) => begin(e.x, e.y))
      .onUpdate((e) => {
        const d = drag.current;
        if (!d) return;
        const s = Math.max(0.0001, live.current.scale);
        d.gx = e.translationX / s;
        d.gy = e.translationY / s;
        schedule(apply);
      })
      .onEnd(end)
      .onFinalize(() => {
        if (drag.current) end();
      });
    let lastScale = 1;
    const pinch = Gesture.Pinch()
      .runOnJS(true)
      .onStart((e) => {
        lastScale = 1;
        if (!drag.current) begin(e.focalX, e.focalY);
      })
      .onUpdate((e) => {
        const d = drag.current;
        if (!d) return;
        d.gScale *= e.scale / lastScale;
        lastScale = e.scale;
        schedule(apply);
      });
    const rotation = Gesture.Rotation()
      .runOnJS(true)
      .onStart((e) => {
        if (!drag.current) begin(e.anchorX, e.anchorY);
      })
      .onUpdate((e) => {
        const d = drag.current;
        if (!d) return;
        d.gRot = (e.rotation * 180) / Math.PI;
        schedule(apply);
      });
    const single = Gesture.Tap()
      .runOnJS(true)
      .maxDuration(260)
      .onEnd((e, ok) => {
        if (ok) tapAt(e.x, e.y);
      });
    const double = Gesture.Tap()
      .runOnJS(true)
      .numberOfTaps(2)
      .onEnd((e, ok) => {
        if (ok) doubleAt(e.x, e.y);
      });
    return Gesture.Race(Gesture.Simultaneous(pan, pinch, rotation), Gesture.Exclusive(double, single));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapping]);

  const sel = selected ? scene.layers.find((l) => l.id === selected) ?? null : null;
  const b = sel && !sel.hidden ? layerBounds(sel, fonts) : null;

  return (
    <GestureDetector gesture={gestures}>
      <View style={styles.fill} onLayout={onLayout} collapsable={false}>
        {scale > 0 ? (
          <Canvas style={styles.fill}>
            <Rect x={0} y={0} width={box.w} height={box.h} color={t.canvas} />
            <RoundedRect x={ox} y={oy + 6} width={scene.width * scale} height={scene.height * scale} r={6} color="rgba(0,0,0,0.28)">
              <BlurMask blur={16} style="normal" />
            </RoundedRect>
            {scene.background.transparent ? (
              <Group transform={[{ translateX: ox }, { translateY: oy }]}>
                <Checker w={scene.width * scale} h={scene.height * scale} />
              </Group>
            ) : null}
            <SceneView scene={scene} images={images} fonts={fonts} scale={scale} x={ox} y={oy} />
            {guides.v ? <Line p1={vec(ox + (scene.width / 2) * scale, oy)} p2={vec(ox + (scene.width / 2) * scale, oy + scene.height * scale)} color={t.accent} strokeWidth={1} /> : null}
            {guides.h ? <Line p1={vec(ox, oy + (scene.height / 2) * scale)} p2={vec(ox + scene.width * scale, oy + (scene.height / 2) * scale)} color={t.accent} strokeWidth={1} /> : null}
            {b ? (
              <Group transform={[{ translateX: ox + b.x * scale }, { translateY: oy + b.y * scale }, { rotate: (b.rotate * Math.PI) / 180 }]}>
                <Rect x={(-b.w / 2) * scale - 4} y={(-b.h / 2) * scale - 4} width={b.w * scale + 8} height={b.h * scale + 8} color={sel?.locked ? '#9B978F' : t.accent} style="stroke" strokeWidth={1.5} />
                {sel?.locked
                  ? null
                  : [
                      [-1, -1],
                      [1, -1],
                      [1, 1],
                      [-1, 1],
                    ].map(([sx, sy], i) => (
                      <Group key={i}>
                        <Circle cx={sx * ((b.w / 2) * scale + 4)} cy={sy * ((b.h / 2) * scale + 4)} r={6} color="#fff" />
                        <Circle cx={sx * ((b.w / 2) * scale + 4)} cy={sy * ((b.h / 2) * scale + 4)} r={6} color={t.accent} style="stroke" strokeWidth={2} />
                      </Group>
                    ))}
              </Group>
            ) : null}
          </Canvas>
        ) : null}
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

export { useEditor };
