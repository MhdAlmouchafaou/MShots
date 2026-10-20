import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Scene } from '../../engine/types';
import { useT } from '../../i18n';
import { saveToGallery, sharePage } from '../../lib/exporter';
import { useSettings } from '../../store/settings';
import { FONT, useTheme } from '../../theme';
import { EASE_OUT } from '../../theme/motion';
import { Slider } from '../Slider';
import { Button, Segmented, Toggle, success } from '../ui';

export function ExportSheet({ visible, onClose, pages, page, name }: { visible: boolean; onClose: () => void; pages: Scene[]; page: number; name: string }) {
  const t = useTheme();
  const tt = useT();
  const insets = useSafeAreaInsets();
  const st = useSettings();
  const [transparent, setTransparent] = useState(false);
  const scene = pages[page];
  if (!visible || !scene) return null;
  const o = { scale: st.exportScale, format: st.exportFormat, quality: st.exportQuality, transparent };
  const w = Math.round(scene.width * st.exportScale);
  const h = Math.round(scene.height * st.exportScale);
  const tooBig = w * h > 7000 * 7000;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={[StyleSheet.absoluteFill, { backgroundColor: t.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View entering={SlideInDown.duration(280).easing(EASE_OUT)} exiting={SlideOutDown.duration(200)} style={[styles.sheet, { backgroundColor: t.surface, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.grabber, { backgroundColor: t.divider }]} />
        <Text style={[styles.title, { color: t.text }]}>{tt('export.title')}</Text>
        <Text style={[styles.sub, { color: t.textSecondary }]}>
          {w} × {h} px{pages.length > 1 ? ` · ${tt('export.pages', { count: pages.length })}` : ''}
        </Text>
        <View style={styles.block}>
          <Text style={[styles.label, { color: t.textSecondary }]}>{tt('export.format')}</Text>
          <Segmented
            options={[
              { key: 'png', label: 'PNG' },
              { key: 'jpg', label: 'JPG' },
              { key: 'webp', label: 'WebP' },
            ]}
            value={st.exportFormat}
            onChange={(v) => st.set({ exportFormat: v })}
          />
        </View>
        <View style={styles.block}>
          <Text style={[styles.label, { color: t.textSecondary }]}>{tt('export.size')}</Text>
          <Segmented
            options={[
              { key: 1, label: `1× · ${scene.width}` },
              { key: 2, label: `2× · ${scene.width * 2}` },
              { key: 3, label: `3× · ${scene.width * 3}` },
            ]}
            value={st.exportScale}
            onChange={(v) => st.set({ exportScale: v as 1 | 2 | 3 })}
          />
        </View>
        {st.exportFormat !== 'png' ? <Slider label={tt('export.quality')} value={st.exportQuality} min={0.5} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => st.set({ exportQuality: v })} /> : null}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toggleLabel, { color: t.text }]}>{tt('export.transparent')}</Text>
            <Text style={[styles.toggleSub, { color: t.textTertiary }]}>{tt('export.transparentSub')}</Text>
          </View>
          <Toggle value={transparent} onChange={setTransparent} />
        </View>
        {tooBig ? <Text style={[styles.warn, { color: t.danger }]}>{tt('export.tooBig')}</Text> : null}
        <View style={styles.actions}>
          <Button
            icon="download"
            label={tt('export.save')}
            kind="accent"
            style={{ flex: 1 }}
            onPress={async () => {
              onClose();
              const n = await saveToGallery([scene], o, name);
              if (n) success();
            }}
          />
          <Button
            icon="share"
            label={tt('export.share')}
            kind="secondary"
            style={{ flex: 1 }}
            onPress={() => {
              onClose();
              sharePage(scene, o, name);
            }}
          />
        </View>
        {pages.length > 1 ? (
          <Button
            icon="pages"
            label={tt('export.all', { count: pages.length })}
            style={{ marginHorizontal: 16, marginTop: 10 }}
            onPress={async () => {
              onClose();
              const n = await saveToGallery(pages, o, name);
              if (n) success();
            }}
          />
        ) : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 8 },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontFamily: FONT.displayBold, paddingHorizontal: 20, letterSpacing: -0.5 },
  sub: { fontSize: 13.5, fontFamily: FONT.medium, paddingHorizontal: 20, marginTop: 2 },
  block: { paddingHorizontal: 16, marginTop: 16, gap: 8 },
  label: { fontSize: 12, fontFamily: FONT.semi, letterSpacing: 0.4, textTransform: 'uppercase' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 14, gap: 12 },
  toggleLabel: { fontSize: 15, fontFamily: FONT.medium },
  toggleSub: { fontSize: 12.5, fontFamily: FONT.regular, marginTop: 1 },
  warn: { fontSize: 13, fontFamily: FONT.medium, paddingHorizontal: 20, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 20 },
});
