import { Image } from 'expo-image';
import React, { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { background, deviceLayer, solid } from '../../../engine/defaults';
import { CATEGORY_LABEL, DEVICES, deviceById, type DeviceCategory } from '../../../engine/devices';
import type { DeviceLayer, Scene } from '../../../engine/types';
import { useT } from '../../../i18n';
import { useThumb } from '../../../lib/thumbs';
import { addLayer, updateLayer } from '../../../store/editor';
import { FONT, useTheme } from '../../../theme';
import { Slider } from '../../Slider';
import { Chip, ChipRow, Segmented, Toggle, tap } from '../../ui';
import { ColorRow, Section } from './kit';

const CATS = Object.keys(CATEGORY_LABEL) as DeviceCategory[];

function deviceScene(id: string, finish?: string): Scene {
  const s = { id: `dev-${id}`, name: id, width: 400, height: 400, background: background({ fill: solid('#ECE9E3'), grain: 0, vignette: 0 }), layers: [] as DeviceLayer[], createdAt: 0, updatedAt: 0 };
  const spec = deviceById(id);
  const big = ['laptop', 'desktop', 'tv', 'browser'].includes(spec.category);
  const l = deviceLayer(s, id, { size: big ? 340 : 330, finish: finish ?? spec.finishes[0].id, shadow: { style: 'soft', opacity: 0.18, blur: 14, distance: 8, angle: 0, color: '#000' } });
  s.layers.push(l);
  return s as Scene;
}

const DeviceCard = memo(function DeviceCard({ id, active, onPress }: { id: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  const spec = deviceById(id);
  const uri = useThumb(`dev-${id}`, () => deviceScene(id), { width: 220 });
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.cardBox, { backgroundColor: t.chip, borderColor: active ? t.accent : 'transparent' }]}>{uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}</View>
      <Text numberOfLines={1} style={[styles.cardName, { color: active ? t.text : t.textSecondary }]}>
        {spec.name}
      </Text>
    </Pressable>
  );
});

export function DevicePanel({ scene, layer }: { scene: Scene; layer: DeviceLayer | null }) {
  const t = useTheme();
  const tt = useT();
  const spec = layer ? deviceById(layer.device) : null;
  const [cat, setCat] = useState<DeviceCategory>(spec?.category ?? 'phone');
  const list = useMemo(() => DEVICES.filter((d) => d.category === cat).map((d) => d.id), [cat]);

  const choose = (id: string) => {
    tap('selection');
    const next = deviceById(id);
    if (!layer) {
      addLayer(deviceLayer(scene, id));
      return;
    }
    const prev = deviceById(layer.device);
    const big = (c: string) => ['laptop', 'desktop', 'tv', 'browser'].includes(c);
    // Keep the visual size when switching between similar kinds of devices.
    const size = big(prev.category) === big(next.category) ? layer.size : big(next.category) ? scene.width * 0.8 : scene.height * 0.7;
    updateLayer<DeviceLayer>(layer.id, {
      device: id,
      finish: next.finishes.some((f) => f.id === layer.finish) ? layer.finish : next.finishes[0].id,
      size,
      landscape: ['phone', 'tablet', 'foldable'].includes(next.category) ? layer.landscape : false,
      back: ['phone', 'tablet', 'foldable'].includes(next.category) ? layer.back : false,
    });
  };

  return (
    <View>
      <ChipRow>
        {CATS.map((c) => (
          <Chip key={c} label={tt(`device.cat.${c}`)} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </ChipRow>
      <FlatList
        horizontal
        data={list}
        keyExtractor={(x) => x}
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 4 }}
        renderItem={({ item }) => <DeviceCard id={item} active={layer?.device === item} onPress={() => choose(item)} />}
      />
      {layer && spec ? (
        <>
          <Section title={tt('device.finish')}>
            <ChipRow>
              {spec.finishes.map((f) => (
                <Chip key={f.id} label={f.name} swatch={f.frame} active={!layer.bodyColor && layer.finish === f.id} onPress={() => updateLayer<DeviceLayer>(layer.id, { finish: f.id, bodyColor: null })} />
              ))}
            </ChipRow>
            <ColorRow label={tt('device.custom')} value={layer.bodyColor ?? deviceById(layer.device).finishes.find((f) => f.id === layer.finish)?.frame ?? '#888888'} onChange={(c) => updateLayer<DeviceLayer>(layer.id, { bodyColor: c }, 'body')} />
          </Section>
          <Section title={tt('device.view')}>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {['phone', 'tablet', 'foldable'].includes(spec.category) ? (
                <>
                  <Segmented
                    options={[
                      { key: 'portrait', label: tt('device.portrait'), icon: 'phone' },
                      { key: 'landscape', label: tt('device.landscape'), icon: 'landscape' },
                    ]}
                    value={layer.landscape ? 'landscape' : 'portrait'}
                    onChange={(v) => updateLayer<DeviceLayer>(layer.id, { landscape: v === 'landscape' })}
                  />
                  <Segmented
                    options={[
                      { key: 'front', label: tt('device.front') },
                      { key: 'back', label: tt('device.back') },
                    ]}
                    value={layer.back ? 'back' : 'front'}
                    onChange={(v) => updateLayer<DeviceLayer>(layer.id, { back: v === 'back' })}
                  />
                </>
              ) : null}
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: t.text }]}>{tt('device.details')}</Text>
                <Toggle value={layer.details} onChange={(v) => updateLayer<DeviceLayer>(layer.id, { details: v })} />
              </View>
            </View>
          </Section>
          <Slider label={tt('common.size')} value={layer.size} min={Math.max(scene.width, scene.height) * 0.1} max={Math.max(scene.width, scene.height) * 1.6} step={1} format={(v) => `${Math.round(v)} px`} onChange={(v) => updateLayer<DeviceLayer>(layer.id, { size: v }, 'size')} />
          <Slider label={tt('common.opacity')} value={layer.opacity} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => updateLayer<DeviceLayer>(layer.id, { opacity: v }, 'opacity')} />
        </>
      ) : (
        <Text style={[styles.hint, { color: t.textSecondary }]}>{tt('device.addHint')}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 104, padding: 4 },
  cardBox: { width: 96, height: 96, borderRadius: 20, borderWidth: 2, overflow: 'hidden' },
  cardName: { fontSize: 11.5, fontFamily: FONT.semi, marginTop: 5, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  toggleLabel: { fontSize: 14.5, fontFamily: FONT.medium },
  hint: { fontSize: 13.5, fontFamily: FONT.regular, paddingHorizontal: 16, paddingVertical: 14 },
});
