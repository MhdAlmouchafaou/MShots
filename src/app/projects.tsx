import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { Icon } from '../components/Icon';
import { ProjectThumb } from '../components/Thumbs';
import { Button, IconButton, PressScale } from '../components/ui';
import { locale, useT } from '../i18n';
import { useProjects, type Project } from '../store/projects';
import { showConfirm, showPrompt, showSheet } from '../store/ui';
import { FONT, useTheme } from '../theme';

export default function Projects() {
  const t = useTheme();
  const tt = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const list = useProjects(useShallow((s) => s.order.map((id) => s.projects[id]).filter(Boolean)));
  const cols = width > 700 ? 3 : 2;
  const cw = (width - 20 - 12 * cols) / cols;
  const menu = (p: Project) =>
    showSheet({
      title: p.name,
      subtitle: tt('home.pages', { count: p.pages.length }),
      actions: [
        { label: tt('projects.open'), icon: 'edit', onPress: () => router.push({ pathname: '/editor', params: { project: p.id } }) },
        { label: tt('projects.rename'), icon: 'text', onPress: () => showPrompt({ title: tt('project.rename'), initial: p.name, onSubmit: (v) => v.trim() && useProjects.getState().rename(p.id, v.trim()) }) },
        { label: tt('projects.duplicate'), icon: 'copy', onPress: () => useProjects.getState().duplicate(p.id) },
        { label: tt('projects.delete'), icon: 'trash', destructive: true, onPress: () => showConfirm({ title: tt('projects.deleteQ'), message: p.name, confirmLabel: tt('common.delete'), destructive: true, onConfirm: () => useProjects.getState().remove(p.id) }) },
      ],
    });
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={styles.top}>
        <IconButton icon="back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: t.text }]}>{tt('projects.title')}</Text>
      </View>
      <FlashList
        data={list}
        key={cols}
        numColumns={cols}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="pages" size={44} color={t.textTertiary} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>{tt('projects.empty')}</Text>
            <Text style={[styles.emptySub, { color: t.textSecondary }]}>{tt('projects.emptySub')}</Text>
            <Button label={tt('home.browse')} icon="grid" onPress={() => router.push('/templates')} style={{ marginTop: 18 }} />
          </View>
        }
        renderItem={({ item }) => (
          <PressScale onPress={() => router.push({ pathname: '/editor', params: { project: item.id } })} onLongPress={() => menu(item)} style={{ width: cw + 12, padding: 6 }}>
            <ProjectThumb project={item} style={{ width: cw, height: cw * 1.25, borderRadius: 22 }} />
            <View style={styles.meta}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.name, { color: t.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.date, { color: t.textTertiary }]}>{new Date(item.updatedAt).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })}</Text>
              </View>
              <IconButton icon="more" size={32} iconSize={18} onPress={() => menu(item)} />
            </View>
          </PressScale>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56, gap: 4 },
  title: { fontSize: 26, fontFamily: FONT.display, letterSpacing: -0.8 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  name: { fontSize: 13.5, fontFamily: FONT.semi },
  date: { fontSize: 12, fontFamily: FONT.regular, marginTop: 1 },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 30 },
  emptyTitle: { fontSize: 19, fontFamily: FONT.displayBold, marginTop: 14 },
  emptySub: { fontSize: 14, fontFamily: FONT.regular, marginTop: 6, textAlign: 'center' },
});
