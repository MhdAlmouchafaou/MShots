import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { DeviceLayer } from '../../../engine/types';
import { useT } from '../../../i18n';
import { persistImage } from '../../../lib/files';
import { setCaptureTarget } from '../../../lib/handoff';
import { pickImages } from '../../../lib/start';
import { updateScreen } from '../../../store/editor';
import { Slider } from '../../Slider';
import { Button, Segmented } from '../../ui';
import { ColorRow, Section } from './kit';

/** Replaces the screen image of a device (gallery). */
export async function replaceScreen(layer: DeviceLayer) {
  const [c] = await pickImages(false);
  if (!c) return;
  const uri = await persistImage(c.uri);
  updateScreen(layer.id, { uri, iw: c.w, ih: c.h, scroll: 0, fit: c.h && c.w && c.h / c.w > 2.6 ? 'top' : layer.screen.fit });
}

export function ScreenPanel({ layer }: { layer: DeviceLayer }) {
  const tt = useT();
  const s = layer.screen;
  const capture = (path: '/capture/web' | '/capture/app' | '/captures') => {
    setCaptureTarget(async (c) => {
      const uri = await persistImage(c.uri);
      updateScreen(layer.id, { uri, iw: c.w, ih: c.h, scroll: 0, fit: path === '/capture/web' ? 'top' : s.fit, label: c.label ?? s.label });
    });
    router.push(path);
  };
  return (
    <View>
      <View style={styles.actions}>
        <Button small icon="images" label={tt('screen.gallery')} onPress={() => replaceScreen(layer)} style={{ flex: 1 }} />
        <Button small kind="secondary" icon="globe" label={tt('screen.web')} onPress={() => capture('/capture/web')} style={{ flex: 1 }} />
      </View>
      <View style={[styles.actions, { paddingTop: 0 }]}>
        <Button small kind="secondary" icon="capture" label={tt('screen.captures')} onPress={() => capture('/captures')} style={{ flex: 1 }} />
        {s.uri ? <Button small kind="ghost" icon="trash" label={tt('screen.clear')} onPress={() => updateScreen(layer.id, { uri: null })} style={{ flex: 1 }} /> : <View style={{ flex: 1 }} />}
      </View>
      <Section title={tt('screen.fit')}>
        <View style={{ paddingHorizontal: 16 }}>
          <Segmented
            options={[
              { key: 'cover', label: tt('screen.cover') },
              { key: 'contain', label: tt('screen.contain') },
              { key: 'top', label: tt('screen.top') },
              { key: 'fill', label: tt('screen.fill') },
            ]}
            value={s.fit}
            onChange={(v) => updateScreen(layer.id, { fit: v })}
          />
        </View>
      </Section>
      {s.fit === 'top' ? <Slider label={tt('screen.scroll')} value={s.scroll} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => updateScreen(layer.id, { scroll: v }, 'scroll')} /> : null}
      <Slider label={tt('screen.zoom')} value={s.zoom} min={0.5} max={3} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => updateScreen(layer.id, { zoom: v }, 'zoom')} />
      <Slider label={tt('screen.glare')} value={s.glare} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => updateScreen(layer.id, { glare: v }, 'glare')} />
      <Section title={tt('screen.statusBar')}>
        <View style={{ paddingHorizontal: 16 }}>
          <Segmented
            options={[
              { key: 'none', label: tt('screen.sbNone') },
              { key: 'dark', label: tt('screen.sbDark') },
              { key: 'light', label: tt('screen.sbLight') },
            ]}
            value={s.statusBar}
            onChange={(v) => updateScreen(layer.id, { statusBar: v })}
          />
        </View>
      </Section>
      <ColorRow label={tt('screen.bg')} value={s.bg} onChange={(c) => updateScreen(layer.id, { bg: c }, 'bg')} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
});
