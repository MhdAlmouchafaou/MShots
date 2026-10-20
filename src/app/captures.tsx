import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Capture } from '../../modules/mshots-core';
import { useCaptureT } from '../features/capture/strings';
import { attachCaptureEvents, openInEditor, useCaptures } from '../features/capture/store';
import { Button, C, F, Header, Icon, tap } from '../features/capture/ui';

type Row = { type: 'head'; key: string; title: string; items: Capture[] } | { type: 'row'; key: string; items: Capture[] };

function sessionDate(s: string | null | undefined, fallback: number) {
  const m = s?.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])) : new Date(fallback);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function CapturesScreen() {
  const t = useCaptureT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const captures = useCaptures((s) => s.captures);
  const loaded = useCaptures((s) => s.loaded);
  const refresh = useCaptures((s) => s.refresh);
  const remove = useCaptures((s) => s.remove);
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    attachCaptureEvents();
    refresh();
  }, [refresh]);

  const cols = width > 700 ? 5 : 3;
  const gap = 6;
  const size = Math.floor((width - 32 - gap * (cols - 1)) / cols);

  const rows = useMemo(() => {
    const groups = new Map<string, Capture[]>();
    for (const c of captures) {
      const k = c.session ?? 'default';
      const g = groups.get(k);
      if (g) g.push(c);
      else groups.set(k, [c]);
    }
    const out: Row[] = [];
    for (const [k, items] of groups) {
      out.push({ type: 'head', key: `h:${k}`, title: k === 'web' ? t('capture.gallery.web') : t('capture.gallery.session', { date: sessionDate(k, items[0].date) }), items });
      for (let i = 0; i < items.length; i += cols) out.push({ type: 'row', key: `r:${k}:${i}`, items: items.slice(i, i + cols) });
    }
    return out;
  }, [captures, cols, t]);

  const selected = useMemo(() => captures.filter((c) => picked[c.uri]), [captures, picked]);

  const toggle = useCallback((uri: string) => {
    tap();
    setPicked((p) => {
      const n = { ...p };
      if (n[uri]) delete n[uri];
      else n[uri] = true;
      return n;
    });
  }, []);

  const use = (list: Capture[]) => {
    const kind = list.every((c) => c.session === 'web') ? 'web' : 'app';
    openInEditor([...list].sort((a, b) => a.date - b.date).map((c) => ({ uri: c.uri, w: c.width, h: c.height })), kind);
  };

  const del = () => {
    if (!selected.length) return;
    Alert.alert(t('capture.gallery.deleteConfirm', { count: selected.length }), undefined, [
      { text: t('capture.gallery.cancel'), style: 'cancel' },
      {
        text: t('capture.gallery.delete'),
        style: 'destructive',
        onPress: async () => {
          await remove(selected.map((c) => c.uri));
          setPicked({});
          setSelecting(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title={t('capture.gallery.title')}
        right={
          captures.length ? (
            <Pressable
              hitSlop={10}
              onPress={() => {
                setSelecting((s) => !s);
                setPicked({});
              }}
            >
              <Text style={styles.headerAction}>{selecting ? t('capture.gallery.cancel') : t('capture.gallery.select')}</Text>
            </Pressable>
          ) : null
        }
      />
      {loaded && !captures.length ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Icon name="camera" size={34} color={C.ink} stroke={1.6} />
          </View>
          <Text style={styles.emptyText}>{t('capture.gallery.empty')}</Text>
          <View style={styles.emptyActions}>
            <Button label={t('capture.gallery.newWeb')} icon="globe" kind="dark" onPress={() => router.push('/capture/web' as never)} style={{ flex: 1 }} />
            <Button label={t('capture.gallery.newApp')} icon="apps" kind="ghost" onPress={() => router.push('/capture/app' as never)} style={{ flex: 1 }} />
          </View>
        </View>
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(r) => r.key}
          getItemType={(r) => r.type}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110 }}
          renderItem={({ item }) =>
            item.type === 'head' ? (
              <View style={styles.head}>
                <Text style={styles.headTitle}>{item.title}</Text>
                {selecting ? (
                  <Pressable
                    hitSlop={8}
                    onPress={() =>
                      setPicked((p) => {
                        const all = item.items.every((c) => p[c.uri]);
                        const n = { ...p };
                        for (const c of item.items) {
                          if (all) delete n[c.uri];
                          else n[c.uri] = true;
                        }
                        return n;
                      })
                    }
                  >
                    <Text style={styles.headAction}>{t('capture.gallery.all')}</Text>
                  </Pressable>
                ) : (
                  <Pressable hitSlop={8} onPress={() => use(item.items)}>
                    <Text style={styles.headAction}>{t('capture.gallery.use', { count: item.items.length })}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={[styles.row, { gap }]}>
                {item.items.map((c) => {
                  const on = !!picked[c.uri];
                  return (
                    <Pressable
                      key={c.uri}
                      onPress={() => (selecting ? toggle(c.uri) : use([c]))}
                      onLongPress={() => {
                        setSelecting(true);
                        toggle(c.uri);
                      }}
                      style={{ width: size, height: size * 1.6 }}
                    >
                      <Image source={{ uri: c.uri }} style={[styles.thumb, on && styles.thumbOn]} contentFit="cover" contentPosition="top" recyclingKey={c.uri} transition={120} />
                      {selecting ? (
                        <View style={[styles.check, on && styles.checkOn]}>{on ? <Icon name="check" size={14} color="#fff" stroke={3} /> : null}</View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )
          }
        />
      )}
      {selecting && selected.length ? (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
          <Button label={t('capture.gallery.delete')} icon="trash" kind="ghost" onPress={del} style={{ flex: 1 }} />
          <Button label={t('capture.gallery.use', { count: selected.length })} icon="layers" onPress={() => use(selected)} style={{ flex: 1.6 }} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerAction: { fontFamily: F.semi, fontSize: 15, color: C.accent },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
  headTitle: { fontFamily: F.title, fontSize: 17, color: C.ink, letterSpacing: -0.2 },
  headAction: { fontFamily: F.semi, fontSize: 13.5, color: C.accent },
  row: { flexDirection: 'row', marginBottom: 6 },
  thumb: { flex: 1, borderRadius: 12, backgroundColor: C.chip },
  thumbOn: { opacity: 0.75, borderWidth: 3, borderColor: C.accent },
  check: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff', backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.accent, borderColor: C.accent },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 16 },
  emptyIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.sub, textAlign: 'center' },
  emptyActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 6 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'rgba(243,241,236,0.96)' },
});
