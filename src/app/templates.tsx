import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { TemplateThumb } from '../components/Thumbs';
import { Button, Chip, ChipRow, IconButton, PressScale } from '../components/ui';
import { TEMPLATE_CATEGORIES, TEMPLATES, type Template, type TemplateCategory } from '../engine/templates';
import { useT } from '../i18n';
import { getPendingCaptures, openTemplate } from '../lib/start';
import { FONT, useTheme } from '../theme';
import { EASE_OUT } from '../theme/motion';

export default function Templates() {
  const t = useTheme();
  const tt = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all');
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState<Template | null>(null);
  const pending = getPendingCaptures();
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TEMPLATES.filter((x) => (cat === 'all' || x.category === cat) && (!s || x.name.toLowerCase().includes(s) || x.tags.some((g) => g.toLowerCase().includes(s))));
  }, [cat, q]);
  const cols = width > 700 ? 3 : 2;
  const cw = (width - 16 * 2 - 12 * (cols - 1)) / cols;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={styles.top}>
        <IconButton icon="back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: t.text }]}>{tt('templates.title')}</Text>
        <Text style={[styles.count, { color: t.textTertiary }]}>{list.length}</Text>
      </View>
      {pending ? (
        <View style={[styles.banner, { backgroundColor: t.accentSoft }]}>
          <Icon name="images" size={18} color={t.accent} />
          <Text style={[styles.bannerText, { color: t.text }]}>{tt('templates.pending', { count: pending.caps.length })}</Text>
        </View>
      ) : null}
      <View style={[styles.search, { backgroundColor: t.surface }]}>
        <Icon name="search" size={19} color={t.textTertiary} />
        <TextInput value={q} onChangeText={setQ} placeholder={tt('templates.search')} placeholderTextColor={t.textTertiary} style={[styles.searchInput, { color: t.text }]} />
        {q ? <IconButton icon="close" size={32} iconSize={16} onPress={() => setQ('')} /> : null}
      </View>
      <ChipRow>
        <Chip label={tt('templates.all')} active={cat === 'all'} onPress={() => setCat('all')} />
        {TEMPLATE_CATEGORIES.map((c) => (
          <Chip key={c.id} label={tt(`cat.${c.id}`)} active={cat === c.id} onPress={() => setCat(c.id)} />
        ))}
      </ChipRow>
      <FlashList
        data={list}
        key={cols}
        numColumns={cols}
        keyExtractor={(x) => x.id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: insets.bottom + 24, paddingTop: 4 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: t.textSecondary }]}>{tt('templates.empty')}</Text>}
        renderItem={({ item }) => (
          <PressScale onPress={() => setPreview(item)} style={{ width: cw + 12, padding: 6 }}>
            <TemplateThumb template={item} style={{ width: cw, height: cw * 1.25, borderRadius: 22 }} width={Math.round(cw * 2)} />
            <Text numberOfLines={1} style={[styles.name, { color: t.text }]}>
              {item.name}
            </Text>
            <Text numberOfLines={1} style={[styles.meta, { color: t.textTertiary }]}>
              {tt(`cat.${item.category}`)} · {tt('templates.screens', { count: item.screens })}
            </Text>
          </PressScale>
        )}
      />
      {preview ? (
        <Modal transparent visible animationType="none" onRequestClose={() => setPreview(null)} statusBarTranslucent navigationBarTranslucent>
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={[StyleSheet.absoluteFill, { backgroundColor: t.scrim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreview(null)} />
          </Animated.View>
          <Animated.View entering={SlideInDown.duration(280).easing(EASE_OUT)} style={[styles.sheet, { backgroundColor: t.surface, paddingBottom: insets.bottom + 16 }]}>
            <TemplateThumb template={preview} style={{ width: width - 32, height: Math.min(height * 0.55, (width - 32) * 1.25), borderRadius: 24, alignSelf: 'center' }} width={720} />
            <Text style={[styles.pTitle, { color: t.text }]}>{preview.name}</Text>
            <Text style={[styles.pMeta, { color: t.textSecondary }]}>
              {tt(`cat.${preview.category}`)} · {tt('templates.screens', { count: preview.screens })}
              {preview.tags.length ? ` · ${preview.tags.slice(0, 4).join(', ')}` : ''}
            </Text>
            <Button
              label={pending ? tt('templates.useWith', { count: pending.caps.length }) : tt('templates.use')}
              icon="sparkles"
              kind="accent"
              style={{ marginHorizontal: 16, marginTop: 16 }}
              onPress={() => {
                const tp = preview;
                setPreview(null);
                openTemplate(tp);
              }}
            />
          </Animated.View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56, gap: 4 },
  title: { fontSize: 26, fontFamily: FONT.display, letterSpacing: -0.8, flex: 1 },
  count: { fontSize: 14, fontFamily: FONT.semi, marginRight: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 },
  bannerText: { fontSize: 13.5, fontFamily: FONT.medium, flex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, height: 48, borderRadius: 24, paddingLeft: 16, paddingRight: 6 },
  searchInput: { flex: 1, fontSize: 15.5, fontFamily: FONT.medium, height: 48 },
  name: { fontSize: 13.5, fontFamily: FONT.semi, marginTop: 8 },
  meta: { fontSize: 12, fontFamily: FONT.regular, marginTop: 1 },
  empty: { textAlign: 'center', marginTop: 60, fontFamily: FONT.medium },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 16 },
  pTitle: { fontSize: 22, fontFamily: FONT.displayBold, marginHorizontal: 20, marginTop: 16, letterSpacing: -0.5 },
  pMeta: { fontSize: 13.5, fontFamily: FONT.regular, marginHorizontal: 20, marginTop: 4 },
});
