import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shadow, shapeLayer, textLayer } from '../../../engine/defaults';
import type { FontId, Scene, ShapeKind, ShapeLayer, TextLayer } from '../../../engine/types';
import { useT } from '../../../i18n';
import { addLayer, updateLayer } from '../../../store/editor';
import { showPrompt } from '../../../store/ui';
import { FONT, useTheme } from '../../../theme';
import { Icon, type IconName } from '../../Icon';
import { Slider } from '../../Slider';
import { Button, Chip, ChipRow, Segmented, Toggle } from '../../ui';
import { ColorRow, Option, OptionGrid, Section } from './kit';

export function editText(layer: TextLayer, title: string) {
  showPrompt({ title, initial: layer.text, multiline: true, onSubmit: (v) => v.trim() && updateLayer<TextLayer>(layer.id, { text: v }) });
}

export function TextPanel({ scene, layer }: { scene: Scene; layer: TextLayer | null }) {
  const t = useTheme();
  const tt = useT();
  const add = (kind: 'title' | 'subtitle' | 'badge' | 'caption') => {
    const w = scene.width;
    const base =
      kind === 'title'
        ? textLayer(scene, tt('text.sampleTitle'), { size: w * 0.08, y: scene.height * 0.12 })
        : kind === 'subtitle'
          ? textLayer(scene, tt('text.sampleSub'), { size: w * 0.038, weight: 500, font: 'inter', letterSpacing: 0, lineHeight: 1.3, color: '#5E5B55', y: scene.height * 0.2 })
          : kind === 'badge'
            ? textLayer(scene, tt('text.sampleBadge'), { size: w * 0.03, weight: 700, font: 'inter', letterSpacing: 1.2, uppercase: true, color: '#FFFFFF', width: w * 0.5, y: scene.height * 0.07, bg: { color: '#FF5A1F', radius: w * 0.03, padX: w * 0.03, padY: w * 0.012 } })
            : textLayer(scene, tt('text.sampleCaption'), { size: w * 0.026, weight: 500, font: 'inter', letterSpacing: 0.2, color: '#9B978F', y: scene.height * 0.94 });
    addLayer(base);
  };
  if (!layer) {
    return (
      <View style={styles.addGrid}>
        {(['title', 'subtitle', 'badge', 'caption'] as const).map((k) => (
          <Button key={k} small kind={k === 'title' ? 'primary' : 'secondary'} icon="text" label={tt(`text.add.${k}`)} onPress={() => add(k)} style={{ width: '48%' }} />
        ))}
      </View>
    );
  }
  const set = (p: Partial<TextLayer>, key?: string) => updateLayer<TextLayer>(layer.id, p, key);
  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Button small icon="edit" label={tt('text.edit')} onPress={() => editText(layer, tt('text.edit'))} />
      </View>
      <ChipRow>
        {(['bricolage', 'inter', 'serif', 'mono'] as FontId[]).map((f) => (
          <Chip key={f} label={tt(`font.${f}`)} active={layer.font === f} onPress={() => set({ font: f })} />
        ))}
      </ChipRow>
      <ChipRow contentStyle={{ height: 40 }}>
        {([400, 500, 600, 700, 800] as TextLayer['weight'][]).map((w) => (
          <Chip key={w} label={tt(`weight.${w}`)} active={layer.weight === w} onPress={() => set({ weight: w })} />
        ))}
      </ChipRow>
      <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
        <Segmented
          options={[
            { key: 'left', label: tt('text.left') },
            { key: 'center', label: tt('text.center') },
            { key: 'right', label: tt('text.right') },
          ]}
          value={layer.align}
          onChange={(v) => set({ align: v })}
        />
      </View>
      <Slider label={tt('common.size')} value={layer.size} min={8} max={scene.width * 0.25} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ size: v }, 'tsize')} />
      <Slider label={tt('text.width')} value={layer.width} min={60} max={scene.width * 1.2} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ width: v }, 'twidth')} />
      <Slider label={tt('text.spacing')} value={layer.letterSpacing} min={-6} max={20} step={0.1} origin={0} format={(v) => v.toFixed(1)} onChange={(v) => set({ letterSpacing: v }, 'tls')} />
      <Slider label={tt('text.lineHeight')} value={layer.lineHeight} min={0.8} max={2} step={0.01} format={(v) => v.toFixed(2)} onChange={(v) => set({ lineHeight: v }, 'tlh')} />
      <Slider label={tt('common.opacity')} value={layer.opacity} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ opacity: v }, 'top')} />
      <ColorRow label={tt('common.color')} value={layer.color} onChange={(c) => set({ color: c }, 'tcolor')} />
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: t.text }]}>{tt('text.uppercase')}</Text>
        <Toggle value={!!layer.uppercase} onChange={(v) => set({ uppercase: v })} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: t.text }]}>{tt('text.pill')}</Text>
        <Toggle value={!!layer.bg} onChange={(v) => set({ bg: v ? { color: '#0B0B0C', radius: layer.size * 0.6, padX: layer.size * 0.7, padY: layer.size * 0.35 } : null })} />
      </View>
      {layer.bg ? (
        <>
          <ColorRow label={tt('text.pillColor')} value={layer.bg.color} onChange={(c) => set({ bg: { ...layer.bg!, color: c } }, 'pillc')} />
          <Slider label={tt('text.pillRadius')} value={layer.bg.radius} min={0} max={layer.size * 2} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ bg: { ...layer.bg!, radius: v } }, 'pillr')} />
        </>
      ) : null}
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: t.text }]}>{tt('text.shadow')}</Text>
        <Toggle value={!!layer.shadow && layer.shadow.style !== 'none'} onChange={(v) => set({ shadow: v ? shadow({ blur: layer.size * 0.25, distance: layer.size * 0.08, opacity: 0.25 }) : null })} />
      </View>
    </View>
  );
}

const SHAPES: { kind: ShapeKind; icon: IconName }[] = [
  { kind: 'circle', icon: 'shapes' },
  { kind: 'rect', icon: 'format' },
  { kind: 'blob', icon: 'sparkles' },
  { kind: 'pedestal', icon: 'cube' },
  { kind: 'ring', icon: 'refresh' },
  { kind: 'star', icon: 'star' },
  { kind: 'arrow', icon: 'chevron' },
  { kind: 'line', icon: 'minus' },
];

export function ShapePanel({ scene, layer }: { scene: Scene; layer: ShapeLayer | null }) {
  const t = useTheme();
  const tt = useT();
  const add = (k: ShapeKind) => {
    const w = scene.width;
    const o: Partial<ShapeLayer> =
      k === 'pedestal'
        ? { w: w * 0.5, h: w * 0.22, y: scene.height * 0.78, fill: { type: 'linear', angle: 180, stops: [{ color: '#F2EFEA', pos: 0 }, { color: '#CFC9BF', pos: 1 }] } }
        : k === 'line'
          ? { w: w * 0.5, h: 4, fill: { type: 'solid', color: '#0B0B0C' } }
          : k === 'arrow'
            ? { w: w * 0.3, h: w * 0.1, fill: { type: 'solid', color: '#0B0B0C' } }
            : k === 'blob'
              ? { w: w * 0.7, h: w * 0.6, fill: { type: 'solid', color: '#FFD9C7' }, seed: Math.random() * 10 }
              : {};
    const l = shapeLayer(scene, k, o);
    // Decorative shapes go behind the devices.
    addLayer(l);
  };
  return (
    <View>
      <OptionGrid>
        {SHAPES.map((s) => (
          <Option key={s.kind} label={tt(`shape.${s.kind}`)} onPress={() => add(s.kind)}>
            <Icon name={s.icon} size={28} color={t.icon} />
          </Option>
        ))}
      </OptionGrid>
      {layer ? (
        <Section title={tt('shape.style')}>
          <ColorRow label={tt('common.color')} value={layer.fill.type === 'solid' ? layer.fill.color : layer.fill.type === 'linear' ? layer.fill.stops[0].color : '#FF5A1F'} onChange={(c) => updateLayer<ShapeLayer>(layer.id, { fill: { type: 'solid', color: c } }, 'sfill')} />
          {layer.shape === 'rect' ? <Slider label={tt('shape.radius')} value={layer.radius} min={0} max={Math.min(layer.w, layer.h) / 2} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => updateLayer<ShapeLayer>(layer.id, { radius: v }, 'srad')} /> : null}
          <Slider label={tt('shape.width')} value={layer.w} min={4} max={scene.width * 2} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => updateLayer<ShapeLayer>(layer.id, { w: v }, 'sw')} />
          <Slider label={tt('shape.height')} value={layer.h} min={2} max={scene.height * 2} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => updateLayer<ShapeLayer>(layer.id, { h: v }, 'sh')} />
          <Slider label={tt('common.opacity')} value={layer.opacity} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => updateLayer<ShapeLayer>(layer.id, { opacity: v }, 'sop')} />
        </Section>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  addGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, justifyContent: 'space-between' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50 },
  toggleLabel: { fontSize: 14.5, fontFamily: FONT.medium },
});
