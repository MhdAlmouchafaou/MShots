import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { Logo } from '../components/brand/Logo';
import { Icon, type IconName } from '../components/Icon';
import { ProjectThumb, TemplateThumb } from '../components/Thumbs';
import { IconButton, PressScale } from '../components/ui';
import { TEMPLATES } from '../engine/templates';
import { useT } from '../i18n';
import { importAndOpen, openTemplate } from '../lib/start';
import { useProjects } from '../store/projects';
import { FONT, useTheme } from '../theme';
import { enterDown, enterUp } from '../theme/motion';

function Action({ title, sub, icon, bg, fg, onPress, delay, wide }: { title: string; sub: string; icon: IconName; bg: string; fg: string; onPress: () => void; delay: number; wide?: boolean }) {
  return (
    <Animated.View entering={enterUp(delay)} style={wide ? styles.actionWide : styles.actionCell}>
      <PressScale onPress={onPress} style={[styles.action, { backgroundColor: bg }]}>
        <View style={[styles.actionIcon, { backgroundColor: fg === '#FFFFFF' ? 'rgba(255,255,255,0.16)' : 'rgba(11,11,12,0.06)' }]}>
          <Icon name={icon} size={24} color={fg} strokeWidth={2} />
        </View>
        <View>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.actionTitle, { color: fg }]}>
            {title}
          </Text>
          <Text numberOfLines={2} style={[styles.actionSub, { color: fg, opacity: 0.68 }]}>
            {sub}
          </Text>
        </View>
      </PressScale>
    </Animated.View>
  );
}

export default function Home() {
  const t = useTheme();
  const tt = useT();
  const insets = useSafeAreaInsets();
  const recent = useProjects(useShallow((s) => s.order.slice(0, 12).map((id) => s.projects[id]).filter(Boolean)));
  const featured = useMemo(() => {
    const f = TEMPLATES.filter((x) => x.featured);
    return (f.length ? f : TEMPLATES).slice(0, 14);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Logo size={34} />
          <Text style={[styles.wordmark, { color: t.text }]}>MShots</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="pages" onPress={() => router.push('/projects')} label={tt('home.projects')} />
          <IconButton icon="settings" onPress={() => router.push('/settings')} label={tt('settings.title')} />
        </View>
      </View>

      <Animated.Text entering={enterDown(40)} style={[styles.hero, { color: t.text }]}>
        {tt('home.hero')}
      </Animated.Text>
      <Animated.Text entering={enterDown(100)} style={[styles.heroSub, { color: t.textSecondary }]}>
        {tt('home.heroSub')}
      </Animated.Text>

      <View style={styles.grid}>
        <Action wide title={tt('home.web')} sub={tt('home.webSub')} icon="globe" bg={t.accent} fg="#FFFFFF" delay={120} onPress={() => router.push('/capture/web')} />
        <Action title={tt('home.app')} sub={tt('home.appSub')} icon="capture" bg="#0B0B0C" fg="#FFFFFF" delay={170} onPress={() => router.push('/capture/app')} />
        <Action title={tt('home.import')} sub={tt('home.importSub')} icon="images" bg={t.surface} fg={t.text} delay={210} onPress={importAndOpen} />
      </View>

      {recent.length ? (
        <View>
          <View style={styles.sectionHead}>
            <Text style={[styles.section, { color: t.text }]}>{tt('home.recent')}</Text>
            <Text onPress={() => router.push('/projects')} style={[styles.more, { color: t.accent }]}>
              {tt('common.seeAll')}
            </Text>
          </View>
          <FlatList
            horizontal
            data={recent}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            style={styles.strip}
            contentContainerStyle={styles.stripContent}
            renderItem={({ item }) => (
              <PressScale onPress={() => router.push({ pathname: '/editor', params: { project: item.id } })} style={styles.card}>
                <ProjectThumb project={item} style={styles.cardThumb} />
                <Text numberOfLines={1} style={[styles.cardName, { color: t.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.cardMeta, { color: t.textTertiary }]}>{tt('home.pages', { count: item.pages.length })}</Text>
              </PressScale>
            )}
          />
        </View>
      ) : null}

      <View style={styles.sectionHead}>
        <Text style={[styles.section, { color: t.text }]}>{tt('home.templates')}</Text>
        <Text onPress={() => router.push('/templates')} style={[styles.more, { color: t.accent }]}>
          {tt('home.allTemplates', { count: TEMPLATES.length })}
        </Text>
      </View>
      <FlatList
        horizontal
        data={featured}
        keyExtractor={(x) => x.id}
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.stripContent}
        renderItem={({ item }) => (
          <PressScale onPress={() => openTemplate(item)} style={styles.card}>
            <TemplateThumb template={item} style={styles.cardThumb} width={360} />
            <Text numberOfLines={1} style={[styles.cardName, { color: t.text }]}>
              {item.name}
            </Text>
          </PressScale>
        )}
      />

      <PressScale onPress={() => router.push('/templates')} style={[styles.browse, { backgroundColor: t.ink }]}>
        <Icon name="grid" size={20} color={t.onInk} strokeWidth={2} />
        <Text style={[styles.browseText, { color: t.onInk }]}>{tt('home.browse')}</Text>
      </PressScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 24, fontFamily: FONT.display, letterSpacing: -0.8 },
  hero: { fontSize: 42, lineHeight: 44, fontFamily: FONT.display, letterSpacing: -1.8, paddingHorizontal: 20, marginTop: 22 },
  heroSub: { fontSize: 15.5, lineHeight: 22, fontFamily: FONT.regular, paddingHorizontal: 20, marginTop: 10, maxWidth: 380 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 22 },
  actionWide: { width: '100%', padding: 4 },
  actionCell: { width: '50%', padding: 4 },
  action: { height: 158, borderRadius: 28, padding: 18, justifyContent: 'space-between' },
  actionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 19, fontFamily: FONT.displayBold, letterSpacing: -0.4 },
  actionSub: { fontSize: 13, fontFamily: FONT.regular, marginTop: 3, lineHeight: 17 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 30, marginBottom: 12 },
  section: { fontSize: 21, fontFamily: FONT.displayBold, letterSpacing: -0.5 },
  more: { fontSize: 14, fontFamily: FONT.semi },
  strip: { flexGrow: 0 },
  stripContent: { paddingHorizontal: 16, gap: 12 },
  card: { width: 150 },
  cardThumb: { width: 150, height: 188, borderRadius: 22 },
  cardName: { fontSize: 13.5, fontFamily: FONT.semi, marginTop: 8 },
  cardMeta: { fontSize: 12, fontFamily: FONT.regular, marginTop: 1 },
  browse: { marginHorizontal: 16, marginTop: 26, height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  browseText: { fontSize: 16, fontFamily: FONT.semi },
});
