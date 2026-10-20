import React from 'react';
import { View } from 'react-native';
import type { DeviceLayer, ImageLayer, Layer, Shadow } from '../../../engine/types';
import { useT } from '../../../i18n';
import { updateLayer, updateShadow } from '../../../store/editor';
import { Slider } from '../../Slider';
import { Chip, ChipRow } from '../../ui';
import { ColorRow, Section } from './kit';

type Tiltable = DeviceLayer | ImageLayer;

/** Camera / pose presets: rx, ry, rotate, perspective. */
export const POSES: { id: string; rx: number; ry: number; rotate: number; perspective: number }[] = [
  { id: 'front', rx: 0, ry: 0, rotate: 0, perspective: 2400 },
  { id: 'left', rx: 0, ry: 28, rotate: 0, perspective: 1800 },
  { id: 'right', rx: 0, ry: -28, rotate: 0, perspective: 1800 },
  { id: 'lying', rx: 48, ry: 0, rotate: -24, perspective: 1600 },
  { id: 'iso', rx: 38, ry: -22, rotate: -32, perspective: 2200 },
  { id: 'hero', rx: 14, ry: -18, rotate: -8, perspective: 1600 },
  { id: 'tilted', rx: 0, ry: 0, rotate: -12, perspective: 2400 },
  { id: 'floating', rx: 18, ry: 22, rotate: 10, perspective: 1900 },
  { id: 'dramatic', rx: 30, ry: 40, rotate: 0, perspective: 1100 },
];

export function TiltPanel({ layer }: { layer: Tiltable }) {
  const tt = useT();
  const set = (p: Partial<Tiltable>, key?: string) => updateLayer<Tiltable>(layer.id, p, key);
  return (
    <View>
      <ChipRow>
        {POSES.map((p) => (
          <Chip key={p.id} label={tt(`pose.${p.id}`)} active={Math.abs(layer.rx - p.rx) < 0.5 && Math.abs(layer.ry - p.ry) < 0.5 && Math.abs(layer.rotate - p.rotate) < 0.5} onPress={() => set({ rx: p.rx, ry: p.ry, rotate: p.rotate, perspective: p.perspective })} />
        ))}
      </ChipRow>
      <Slider label={tt('tilt.rx')} value={layer.rx} min={-75} max={75} step={1} origin={0} format={(v) => `${Math.round(v)}°`} onChange={(v) => set({ rx: v }, 'rx')} />
      <Slider label={tt('tilt.ry')} value={layer.ry} min={-75} max={75} step={1} origin={0} format={(v) => `${Math.round(v)}°`} onChange={(v) => set({ ry: v }, 'ry')} />
      <Slider label={tt('tilt.rotate')} value={layer.rotate} min={-180} max={180} step={1} origin={0} format={(v) => `${Math.round(v)}°`} onChange={(v) => set({ rotate: v }, 'rotate')} />
      <Slider label={tt('tilt.perspective')} value={layer.perspective} min={500} max={6000} step={10} format={(v) => (v < 1200 ? tt('tilt.strong') : v < 2600 ? tt('tilt.medium') : tt('tilt.soft'))} onChange={(v) => set({ perspective: v }, 'persp')} />
      {layer.kind === 'device' ? <Slider label={tt('tilt.depth')} value={layer.depth} min={0} max={3} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => set({ depth: v } as Partial<DeviceLayer>, 'depth')} /> : null}
    </View>
  );
}

export const SHADOW_STYLES: Shadow['style'][] = ['none', 'soft', 'floating', 'contact', 'long', 'hard'];

export function ShadowPanel({ layer }: { layer: Layer & { shadow: Shadow } }) {
  const tt = useT();
  const s = layer.shadow;
  const set = (p: Partial<Shadow>, key?: string) => updateShadow(layer.id, p, key);
  const size = layer.kind === 'device' ? layer.size : 'w' in layer ? Math.max(layer.w, layer.h) : 600;
  return (
    <View>
      <ChipRow>
        {SHADOW_STYLES.map((st) => (
          <Chip key={st} label={tt(`shadow.${st}`)} active={s.style === st} onPress={() => set(st === 'none' ? { style: st } : { style: st, opacity: s.opacity || 0.3, blur: s.blur || size * 0.05, distance: s.distance || size * 0.035 })} />
        ))}
      </ChipRow>
      {s.style !== 'none' ? (
        <>
          <Slider label={tt('common.opacity')} value={s.opacity} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ opacity: v }, 'op')} />
          <Slider label={tt('shadow.blur')} value={s.blur} min={0} max={size * 0.25} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ blur: v }, 'blur')} />
          <Slider label={tt('shadow.distance')} value={s.distance} min={0} max={size * 0.25} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ distance: v }, 'dist')} />
          <Slider label={tt('shadow.angle')} value={s.angle} min={-180} max={180} step={1} origin={0} format={(v) => `${Math.round(v)}°`} onChange={(v) => set({ angle: v }, 'angle')} />
          <Section title={tt('common.color')}>
            <ColorRow label={tt('shadow.color')} value={s.color} onChange={(c) => set({ color: c }, 'color')} />
          </Section>
        </>
      ) : null}
    </View>
  );
}
