import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, IconButton, Label, Row, Segmented, Toggle } from '../components/ui';
import { useT } from '../i18n';
import { useProjects } from '../store/projects';
import { useSettings } from '../store/settings';
import { FONT, useTheme } from '../theme';

export default function Settings() {
  const t = useTheme();
  const tt = useT();
  const insets = useSafeAreaInsets();
  const st = useSettings();
  const count = useProjects((s) => s.order.length);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 30 }}>
      <View style={styles.top}>
        <IconButton icon="back" onPress={() => router.back()} />
        <Text style={[styles.title, { color: t.text }]}>{tt('settings.title')}</Text>
      </View>

      <Label>{tt('settings.appearance')}</Label>
      <Card style={styles.card}>
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: t.text }]}>{tt('settings.language')}</Text>
          <Segmented
            options={[
              { key: 'system', label: tt('settings.auto') },
              { key: 'fr', label: 'Français' },
              { key: 'en', label: 'English' },
            ]}
            value={st.language}
            onChange={(v) => st.set({ language: v })}
          />
        </View>
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: t.text }]}>{tt('settings.theme')}</Text>
          <Segmented
            options={[
              { key: 'system', label: tt('settings.auto') },
              { key: 'light', label: tt('settings.light'), icon: 'sun' },
              { key: 'dark', label: tt('settings.dark'), icon: 'moon' },
            ]}
            value={st.theme}
            onChange={(v) => st.set({ theme: v })}
          />
        </View>
      </Card>

      <Label>{tt('settings.export')}</Label>
      <Card style={styles.card}>
        <View style={styles.block}>
          <Text style={[styles.blockLabel, { color: t.text }]}>{tt('settings.defaultFormat')}</Text>
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
          <Text style={[styles.blockLabel, { color: t.text }]}>{tt('settings.defaultSize')}</Text>
          <Segmented
            options={[
              { key: 1, label: '1×' },
              { key: 2, label: '2×' },
              { key: 3, label: '3×' },
            ]}
            value={st.exportScale}
            onChange={(v) => st.set({ exportScale: v as 1 | 2 | 3 })}
          />
        </View>
      </Card>

      <Label>{tt('settings.editor')}</Label>
      <Card style={styles.card}>
        <Row icon="magnet" title={tt('settings.snapping')} subtitle={tt('settings.snappingSub')} right={<Toggle value={st.snapping} onChange={(v) => st.set({ snapping: v })} />} />
        <Row icon="sparkles" title={tt('settings.haptics')} right={<Toggle value={st.haptics} onChange={(v) => st.set({ haptics: v })} />} />
      </Card>

      <Label>{tt('settings.about')}</Label>
      <Card style={styles.card}>
        <Row icon="pages" title={tt('settings.projects')} subtitle={tt('settings.projectsCount', { count })} onPress={() => router.push('/projects')} />
        <Row icon="info" title="MShots" subtitle={`${tt('settings.version')} ${Constants.expoConfig?.version ?? '1.0.0'} · ${tt('settings.tagline')}`} />
      </Card>

      <Text onPress={() => Linking.openURL('https://mhd-almouchafaou.online')} style={[styles.credit, { color: t.textTertiary }]}>
        {tt('settings.credit')} <Text style={{ color: t.accent, fontFamily: FONT.semi }}>Mhd Almouchafaou</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 56, gap: 4 },
  title: { fontSize: 26, fontFamily: FONT.display, letterSpacing: -0.8 },
  card: { marginHorizontal: 16 },
  block: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  blockLabel: { fontSize: 15, fontFamily: FONT.medium },
  credit: { textAlign: 'center', marginTop: 34, fontSize: 13.5, fontFamily: FONT.medium, padding: 10 },
});
