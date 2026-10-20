import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { imageLayer } from '../../../engine/defaults';
import type { ImageLayer, Scene } from '../../../engine/types';
import { useT } from '../../../i18n';
import { persistImage } from '../../../lib/files';
import { pickImages } from '../../../lib/start';
import { addLayer, updateLayer } from '../../../store/editor';
import { FONT, useTheme } from '../../../theme';
import { Slider } from '../../Slider';
import { Button, Toggle } from '../../ui';
import { ColorRow } from './kit';

export async function addImageLayer(scene: Scene) {
  const [c] = await pickImages(false);
  if (!c) return;
  const uri = await persistImage(c.uri);
  addLayer(imageLayer(scene, uri, c.w ?? 800, c.h ?? 800));
}

export function ImagePanel({ scene, layer }: { scene: Scene; layer: ImageLayer | null }) {
  const t = useT();
  const th = useTheme();
  if (!layer) {
    return (
      <View style={{ padding: 16 }}>
        <Button small icon="images" label={t('image.add')} onPress={() => addImageLayer(scene)} />
        <Text style={[styles.hint, { color: th.textSecondary }]}>{t('image.hint')}</Text>
      </View>
    );
  }
  const set = (p: Partial<ImageLayer>, key?: string) => updateLayer<ImageLayer>(layer.id, p, key);
  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Button
          small
          kind="secondary"
          icon="refresh"
          label={t('image.replace')}
          onPress={async () => {
            const [c] = await pickImages(false);
            if (!c) return;
            const uri = await persistImage(c.uri);
            const ar = (c.w ?? 1) / (c.h ?? 1);
            set({ uri, h: layer.w / ar });
          }}
        />
      </View>
      <Slider label={t('shape.width')} value={layer.w} min={20} max={scene.width * 1.5} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ w: v, h: (layer.h / layer.w) * v }, 'iw')} />
      <Slider label={t('shape.radius')} value={layer.radius} min={0} max={Math.min(layer.w, layer.h) / 2} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ radius: v }, 'irad')} />
      <Slider label={t('common.opacity')} value={layer.opacity} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ opacity: v }, 'iop')} />
      <View style={styles.toggleRow}>
        <Text style={[styles.toggleLabel, { color: th.text }]}>{t('image.stroke')}</Text>
        <Toggle value={!!layer.stroke} onChange={(v) => set({ stroke: v ? { color: '#FFFFFF', width: Math.max(2, layer.w * 0.01) } : null })} />
      </View>
      {layer.stroke ? (
        <>
          <ColorRow label={t('common.color')} value={layer.stroke.color} onChange={(c) => set({ stroke: { ...layer.stroke!, color: c } }, 'isc')} />
          <Slider label={t('image.strokeWidth')} value={layer.stroke.width} min={1} max={60} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => set({ stroke: { ...layer.stroke!, width: v } }, 'isw')} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, fontFamily: FONT.regular, marginTop: 10 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50 },
  toggleLabel: { fontSize: 14.5, fontFamily: FONT.medium },
});
