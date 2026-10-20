import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FORMATS } from '../../../engine/defaults';
import { deviceById } from '../../../engine/devices';
import type { Format, Layer, Scene } from '../../../engine/types';
import { useT, type TFn } from '../../../i18n';
import { duplicateLayer, edit, moveLayer, removeLayer, select, updateLayer } from '../../../store/editor';
import { showPrompt } from '../../../store/ui';
import { FONT, useTheme } from '../../../theme';
import { Icon, type IconName } from '../../Icon';
import { Chip, ChipRow, IconButton, tap } from '../../ui';
import { Section } from './kit';

const ICON: Record<Layer['kind'], IconName> = { device: 'phone', image: 'images', text: 'text', shape: 'shapes' };

export function layerName(l: Layer, tt: TFn) {
  if (l.name) return l.name;
  if (l.kind === 'device') return deviceById(l.device).name;
  if (l.kind === 'text') return l.text.split('\n')[0].slice(0, 32) || tt('layer.text');
  if (l.kind === 'image') return tt('layer.image');
  return tt(`shape.${l.shape}`);
}

export function LayersPanel({ scene, selected }: { scene: Scene; selected: string | null }) {
  const t = useTheme();
  const tt = useT();
  const list = scene.layers.slice().reverse();
  if (!list.length) return <Text style={[styles.empty, { color: t.textSecondary }]}>{tt('layers.empty')}</Text>;
  return (
    <View style={{ paddingVertical: 8 }}>
      {list.map((l, i) => {
        const on = l.id === selected;
        return (
          <Pressable
            key={l.id}
            onPress={() => {
              tap('selection');
              select(l.id);
            }}
            onLongPress={() => showPrompt({ title: tt('layers.rename'), initial: layerName(l, tt), onSubmit: (v) => updateLayer(l.id, { name: v.trim() || undefined }) })}
            style={[styles.row, { backgroundColor: on ? t.accentSoft : 'transparent' }]}
          >
            <View style={[styles.icon, { backgroundColor: t.chip }]}>
              <Icon name={ICON[l.kind]} size={18} color={t.icon} />
            </View>
            <Text numberOfLines={1} style={[styles.name, { color: l.hidden ? t.textTertiary : t.text }]}>
              {layerName(l, tt)}
            </Text>
            <IconButton size={34} iconSize={17} icon={l.hidden ? 'eyeOff' : 'eye'} onPress={() => updateLayer(l.id, { hidden: !l.hidden })} />
            <IconButton size={34} iconSize={17} icon={l.locked ? 'lock' : 'unlock'} onPress={() => updateLayer(l.id, { locked: !l.locked })} />
            <IconButton size={34} iconSize={17} icon="up" disabled={i === 0} onPress={() => moveLayer(l.id, 1)} />
            <IconButton size={34} iconSize={17} icon="down" disabled={i === list.length - 1} onPress={() => moveLayer(l.id, -1)} />
          </Pressable>
        );
      })}
      {selected ? (
        <View style={styles.actions}>
          <IconButton icon="copy" bg={t.chip} onPress={() => duplicateLayer(selected)} label={tt('layers.duplicate')} />
          <IconButton icon="trash" bg={t.chip} color={t.danger} onPress={() => removeLayer(selected)} label={tt('layers.delete')} />
        </View>
      ) : null}
    </View>
  );
}

/** Resizes a scene to a new format: positions and sizes follow proportionally. */
export function resizeScene(scene: Scene, f: Format): Scene {
  const sx = f.width / scene.width;
  const sy = f.height / scene.height;
  const s = Math.min(sx, sy);
  const layers = scene.layers.map((l) => {
    const n = { ...l, x: l.x * sx, y: l.y * sy } as Layer;
    if (n.kind === 'device') {
      n.size *= s;
      n.shadow = { ...n.shadow, blur: n.shadow.blur * s, distance: n.shadow.distance * s };
    } else if (n.kind === 'text') {
      n.size *= s;
      n.width *= sx;
      if (n.bg) n.bg = { ...n.bg, padX: n.bg.padX * s, padY: n.bg.padY * s, radius: n.bg.radius * s };
    } else {
      n.w *= s;
      n.h *= s;
    }
    return n;
  });
  return { ...scene, width: f.width, height: f.height, layers };
}

export function FormatPanel({ scene }: { scene: Scene }) {
  const t = useTheme();
  const tt = useT();
  const groups: Format['group'][] = ['social', 'store', 'web', 'print'];
  return (
    <View>
      <Text style={[styles.dims, { color: t.textSecondary }]}>
        {scene.width} × {scene.height} px
      </Text>
      {groups.map((g) => (
        <Section key={g} title={tt(`format.${g}`)}>
          <ChipRow>
            {FORMATS.filter((f) => f.group === g).map((f) => (
              <Chip key={f.id} label={tt(`format.id.${f.id}`)} active={scene.width === f.width && scene.height === f.height} onPress={() => edit((s) => resizeScene(s, f))} />
            ))}
          </ChipRow>
        </Section>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 16, paddingRight: 8, height: 52, borderRadius: 16, marginHorizontal: 8 },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  name: { flex: 1, fontSize: 14.5, fontFamily: FONT.medium },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  empty: { padding: 20, fontFamily: FONT.medium, fontSize: 14 },
  dims: { paddingHorizontal: 16, paddingTop: 12, fontFamily: FONT.semi, fontSize: 13 },
});
