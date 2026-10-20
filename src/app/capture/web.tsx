import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Native } from '../../../modules/mshots-core';
import { useCaptureT } from '../../features/capture/strings';
import { openInEditor, useCaptures, type EditorCapture } from '../../features/capture/store';
import { Button, C, Card, Chip, F, Header, Icon, Section, Toggle } from '../../features/capture/ui';

type Preset = { id: 'phone' | 'tablet' | 'desktop' | 'large' | 'custom'; w: number; h: number; scale: number; mobile: boolean; icon: 'phone' | 'tablet' | 'laptop' | 'monitor' | 'sliders' };

const PRESETS: Preset[] = [
  { id: 'phone', w: 390, h: 844, scale: 3, mobile: true, icon: 'phone' },
  { id: 'tablet', w: 820, h: 1180, scale: 2, mobile: true, icon: 'tablet' },
  { id: 'desktop', w: 1440, h: 900, scale: 2, mobile: false, icon: 'laptop' },
  { id: 'large', w: 1920, h: 1080, scale: 1.5, mobile: false, icon: 'monitor' },
  { id: 'custom', w: 1280, h: 800, scale: 2, mobile: false, icon: 'sliders' },
];

const DELAYS = [0, 1000, 3000, 5000];
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function normalize(u: string) {
  const s = u.trim();
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function domain(u: string) {
  try {
    return u.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].replace(/^www\./, '');
  } catch {
    return u;
  }
}

export default function WebCaptureScreen() {
  const t = useCaptureT();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [input, setInput] = useState('');
  const [url, setUrl] = useState('');
  const [current, setCurrent] = useState('');
  const [preset, setPreset] = useState<Preset>(PRESETS[0]);
  const [customW, setCustomW] = useState('1280');
  const [customH, setCustomH] = useState('800');
  const [fullPage, setFullPage] = useState(true);
  const [dark, setDark] = useState(false);
  const [delay, setDelay] = useState(1000);
  const [quality, setQuality] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const web = useRef<WebView>(null);
  const captures = useCaptures((s) => s.captures);
  const refresh = useCaptures((s) => s.refresh);
  const recent = useMemo(() => captures.filter((c) => c.session === 'web').slice(0, 10), [captures]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const label = (p: Preset['id']) => t(`capture.web.${p}`);
  const size = (p: Preset) => (p.id === 'custom' ? { w: Math.max(240, Number(customW) || 1280), h: Math.max(240, Number(customH) || 800) } : { w: p.w, h: p.h });

  const open = () => {
    const u = normalize(input);
    if (!u) return;
    setError(null);
    setUrl(u);
    setCurrent(u);
  };

  const shoot = async (list: Preset[]) => {
    const target = normalize(current || input);
    if (!Native || !target) return;
    setError(null);
    const out: EditorCapture[] = [];
    try {
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        const { w, h } = size(p);
        setBusy(list.length > 1 ? t('capture.web.step', { n: i + 1, total: list.length, name: label(p.id) }) : t('capture.web.capturing'));
        const scale = quality === 0 ? p.scale : quality;
        const r = await Native.captureWeb({ url: target, width: w, height: h, scale, fullPage, delay, maxHeight: 16000, dark, mobile: p.mobile });
        out.push({ uri: r.uri, w: r.width, h: r.height, label: domain(target), preset: p.id });
      }
      refresh();
      setBusy(null);
      openInEditor(out, 'web');
    } catch (e) {
      setBusy(null);
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes('timeout') ? t('capture.web.timeout') : t('capture.web.error', { reason: msg }));
      if (out.length) openInEditor(out, 'web');
    }
  };

  const previewH = Math.max(260, Math.min(520, winH * 0.42));

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title={t('capture.web.title')} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.sub}>{t('capture.web.sub')}</Text>

          <View style={styles.urlRow}>
            <Icon name="globe" size={20} color={C.sub} />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('capture.web.placeholder')}
              placeholderTextColor={C.faint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="go"
              onSubmitEditing={open}
              style={styles.url}
            />
            <Pressable onPress={open} style={({ pressed }) => [styles.go, pressed && { opacity: 0.8 }]}>
              <Text style={styles.goText}>{t('capture.web.go')}</Text>
            </Pressable>
          </View>

          <Section title={t('capture.web.preview')} />
          <View style={[styles.preview, { height: previewH }]}>
            {url ? (
              <WebView
                ref={web}
                source={{ uri: url }}
                style={{ flex: 1, backgroundColor: '#fff' }}
                userAgent={preset.mobile ? undefined : DESKTOP_UA}
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                domStorageEnabled
                setSupportMultipleWindows={false}
                onNavigationStateChange={(s) => {
                  if (s.url && /^https?:/i.test(s.url)) setCurrent(s.url);
                }}
              />
            ) : (
              <View style={styles.previewEmpty}>
                <Icon name="globe" size={36} color={C.faint} stroke={1.4} />
                <Text style={styles.previewEmptyText}>{t('capture.web.empty')}</Text>
              </View>
            )}
          </View>
          {url ? (
            <View style={styles.previewBar}>
              <Text numberOfLines={1} style={styles.previewUrl}>
                {domain(current)}
              </Text>
              <Pressable hitSlop={10} onPress={() => web.current?.reload()}>
                <Icon name="refresh" size={18} color={C.sub} />
              </Pressable>
            </View>
          ) : null}
          {url ? <Text style={styles.hint}>{t('capture.web.previewHint')}</Text> : null}

          <Section title={t('capture.web.device')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips}>
            {PRESETS.map((p) => (
              <Chip key={p.id} label={label(p.id)} icon={p.icon} on={preset.id === p.id} onPress={() => setPreset(p)} />
            ))}
          </ScrollView>
          <Text style={styles.dims}>
            {preset.id === 'custom' ? '' : `${preset.w} × ${preset.h}`}
          </Text>
          {preset.id === 'custom' ? (
            <View style={styles.customRow}>
              <View style={styles.dimBox}>
                <Text style={styles.dimLabel}>{t('capture.web.width')}</Text>
                <TextInput value={customW} onChangeText={setCustomW} keyboardType="number-pad" style={styles.dimInput} maxLength={4} />
              </View>
              <Text style={styles.times}>×</Text>
              <View style={styles.dimBox}>
                <Text style={styles.dimLabel}>{t('capture.web.height')}</Text>
                <TextInput value={customH} onChangeText={setCustomH} keyboardType="number-pad" style={styles.dimInput} maxLength={4} />
              </View>
            </View>
          ) : null}

          <Section title={t('capture.web.options')} />
          <Card style={{ paddingVertical: 4 }}>
            <Toggle title={t('capture.web.fullPage')} sub={t('capture.web.fullPageSub')} value={fullPage} onChange={setFullPage} />
            <View style={styles.sep} />
            <Toggle title={t('capture.web.dark')} sub={t('capture.web.darkSub')} value={dark} onChange={setDark} />
            <View style={styles.sep} />
            <Text style={styles.optTitle}>{t('capture.web.delay')}</Text>
            <View style={styles.seg}>
              {DELAYS.map((d) => (
                <Pressable key={d} onPress={() => setDelay(d)} style={[styles.segItem, delay === d && styles.segOn]}>
                  <Text style={[styles.segText, delay === d && styles.segTextOn]}>{d / 1000} s</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.optTitle}>{t('capture.web.quality')}</Text>
            <View style={[styles.seg, { marginBottom: 12 }]}>
              {[0, 1, 2, 3].map((q) => (
                <Pressable key={q} onPress={() => setQuality(q)} style={[styles.segItem, quality === q && styles.segOn]}>
                  <Text style={[styles.segText, quality === q && styles.segTextOn]}>{q === 0 ? 'Auto' : `${q}×`}</Text>
                </Pressable>
              ))}
            </View>
          </Card>

          <Pressable onPress={() => shoot([PRESETS[0], PRESETS[1], PRESETS[2]])} disabled={!!busy || !(current || input)} style={({ pressed }) => [styles.all, pressed && { opacity: 0.85 }, !(current || input) && { opacity: 0.5 }]}>
            <View style={styles.allIcons}>
              <Icon name="phone" size={18} />
              <Icon name="tablet" size={18} />
              <Icon name="laptop" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.allTitle}>{t('capture.web.allSizes')}</Text>
              <Text style={styles.allSub}>{t('capture.web.allSizesSub')}</Text>
            </View>
            <Icon name="arrow" size={20} color={C.sub} />
          </Pressable>

          {recent.length ? (
            <>
              <Section title={t('capture.web.recent')} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10 }}>
                {recent.map((c) => (
                  <Pressable key={c.uri} onPress={() => openInEditor([{ uri: c.uri, w: c.width, h: c.height }], 'web')}>
                    <Image source={{ uri: c.uri }} style={[styles.thumb, { aspectRatio: Math.max(0.35, Math.min(1.8, c.width / Math.max(1, Math.min(c.height, c.width * 2.2)))) }]} contentFit="cover" contentPosition="top" />
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={busy ?? t('capture.web.capture')} icon="camera" busy={!!busy} disabled={!(current || input)} onPress={() => shoot([preset])} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  sub: { fontFamily: F.body, fontSize: 14.5, lineHeight: 21, color: C.sub, marginTop: 2, marginBottom: 14, marginHorizontal: 4 },
  urlRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 20, paddingLeft: 14, paddingRight: 6, height: 58, gap: 10 },
  url: { flex: 1, fontFamily: F.semi, fontSize: 16, color: C.ink, paddingVertical: 0 },
  go: { height: 46, paddingHorizontal: 16, borderRadius: 15, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  goText: { color: '#fff', fontFamily: F.semi, fontSize: 14.5 },
  preview: { borderRadius: 22, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  previewEmptyText: { fontFamily: F.body, fontSize: 14, color: C.sub, textAlign: 'center' },
  previewBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingHorizontal: 6 },
  previewUrl: { flex: 1, fontFamily: F.semi, fontSize: 13, color: C.sub },
  hint: { fontFamily: F.body, fontSize: 12.5, color: C.faint, marginTop: 4, marginHorizontal: 6 },
  chips: { gap: 8, paddingRight: 8, alignItems: 'center' },
  dims: { fontFamily: F.semi, fontSize: 12.5, color: C.faint, marginTop: 8, marginHorizontal: 6 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  dimBox: { flex: 1, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  dimLabel: { fontFamily: F.body, fontSize: 12, color: C.sub },
  dimInput: { fontFamily: F.semi, fontSize: 18, color: C.ink, paddingVertical: 2 },
  times: { fontFamily: F.semi, fontSize: 18, color: C.sub },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: C.line },
  optTitle: { fontFamily: F.semi, fontSize: 15, color: C.text, marginTop: 14, marginBottom: 10 },
  seg: { flexDirection: 'row', backgroundColor: C.chip, borderRadius: 14, padding: 3 },
  segItem: { flex: 1, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.card },
  segText: { fontFamily: F.semi, fontSize: 14, color: C.sub },
  segTextOn: { color: C.ink },
  all: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 22, padding: 16, marginTop: 14 },
  allIcons: { flexDirection: 'row', gap: 2, backgroundColor: C.accentSoft, borderRadius: 14, padding: 9 },
  allTitle: { fontFamily: F.semi, fontSize: 15.5, color: C.ink },
  allSub: { fontFamily: F.body, fontSize: 13, color: C.sub, marginTop: 2 },
  thumb: { height: 150, borderRadius: 14, backgroundColor: C.chip },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'rgba(243,241,236,0.96)' },
  error: { fontFamily: F.semi, fontSize: 13.5, color: C.danger, marginBottom: 8, textAlign: 'center' },
});
