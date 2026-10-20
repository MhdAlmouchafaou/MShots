import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Native } from '../../../modules/mshots-core';
import { useCaptureT } from '../../features/capture/strings';
import { attachCaptureEvents, newSessionId, openInEditor, useCaptures } from '../../features/capture/store';
import { Button, C, Card, F, Header, Icon } from '../../features/capture/ui';

type ApkInfo = { uri: string; pkg: string; label: string; version: string; icon: string | null; installed: boolean };

function Step({ n, title, sub, done, active, children }: { n: number; title: string; sub: string; done: boolean; active: boolean; children?: React.ReactNode }) {
  return (
    <Card style={[styles.step, !active && !done && { opacity: 0.55 }]}>
      <View style={styles.stepHead}>
        <View style={[styles.badge, { backgroundColor: done ? C.ok : active ? C.ink : C.chip }]}>
          {done ? <Icon name="check" size={16} color="#fff" stroke={2.6} /> : <Text style={[styles.badgeText, { color: active ? '#fff' : C.sub }]}>{n}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepSub}>{sub}</Text>
        </View>
      </View>
      {children ? <View style={{ marginTop: 14 }}>{children}</View> : null}
    </Card>
  );
}

export default function AppCaptureScreen() {
  const t = useCaptureT();
  const insets = useSafeAreaInsets();
  const [apk, setApk] = useState<ApkInfo | null>(null);
  const [skip, setSkip] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [overlay, setOverlay] = useState(() => !!Native?.canDrawOverlays());
  const [starting, setStarting] = useState(false);
  const running = useCaptures((s) => s.running);
  const all = useCaptures((s) => s.captures);
  const refresh = useCaptures((s) => s.refresh);
  const session = useRef<string>((useCaptures.getState().running && useCaptures.getState().session) || newSessionId());
  const shots = useMemo(() => all.filter((c) => c.session === session.current), [all]);

  useEffect(() => {
    attachCaptureEvents();
    refresh();
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      setOverlay(!!Native?.canDrawOverlays());
      refresh();
      setApk((a) => (a && Native ? { ...a, installed: Native.isInstalled(a.pkg) } : a));
    });
    const inst = Native?.addListener('onInstall', (e) => {
      setInstalling(false);
      setMessage(e.ok ? t('capture.app.installOk') : `${t('capture.app.installFail')}${e.message ? ` · ${e.message}` : ''}`);
      if (e.ok) setApk((a) => (a ? { ...a, installed: true } : a));
    });
    return () => {
      sub.remove();
      inst?.remove();
    };
  }, [refresh, t]);

  const pick = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['application/vnd.android.package-archive', 'application/octet-stream'], copyToCacheDirectory: true, multiple: false });
      if (r.canceled || !r.assets?.[0] || !Native) return;
      const uri = r.assets[0].uri;
      const info = await Native.apkInfo(uri);
      setMessage(null);
      if (!info) {
        setMessage(t('capture.app.installFail'));
        return;
      }
      setApk({ uri, ...info });
      setSkip(false);
    } catch {
      setMessage(t('capture.app.installFail'));
    }
  };

  const install = async () => {
    if (!apk || !Native) return;
    setMessage(null);
    try {
      const r = await Native.installApk(apk.uri);
      if (r === 'permission') setMessage(t('capture.app.allowInstall'));
      else setInstalling(true);
    } catch (e) {
      setMessage(`${t('capture.app.installFail')} · ${e instanceof Error ? e.message : ''}`);
    }
  };

  const start = useCallback(async () => {
    if (!Native) return;
    setMessage(null);
    if (Platform.OS === 'android' && (Platform.Version as number) >= 33) {
      try {
        await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as never);
      } catch {
        // optional
      }
    }
    setStarting(true);
    const ok = await Native.startBubble(session.current);
    setStarting(false);
    if (!ok) {
      setMessage(t('capture.app.refused'));
      return;
    }
    useCaptures.setState({ running: true, session: session.current });
    if (apk?.installed) setTimeout(() => Native?.launchApp(apk.pkg), 400);
  }, [apk, t]);

  const appReady = skip || !!apk?.installed;
  const step = !appReady ? 1 : !overlay ? 2 : 3;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header title={t('capture.app.title')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120, gap: 12 }}>
        <Text style={styles.sub}>{t('capture.app.sub')}</Text>

        <Step n={1} title={t('capture.app.step1')} sub={t('capture.app.step1Sub')} done={appReady} active={step === 1}>
          {apk ? (
            <View style={styles.apk}>
              {apk.icon ? <Image source={{ uri: apk.icon }} style={styles.apkIcon} /> : <View style={[styles.apkIcon, { backgroundColor: C.chip }]} />}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.apkName}>
                  {apk.label || t('capture.app.unknown')}
                </Text>
                <Text numberOfLines={1} style={styles.apkMeta}>
                  {apk.version ? t('capture.app.version', { v: apk.version }) : apk.pkg}
                </Text>
              </View>
              <Pressable onPress={pick} hitSlop={8}>
                <Text style={styles.link}>{t('capture.app.change')}</Text>
              </Pressable>
            </View>
          ) : null}
          {apk ? (
            apk.installed ? (
              <View style={styles.okRow}>
                <Icon name="check" size={18} color={C.ok} stroke={2.4} />
                <Text style={styles.okText}>{t('capture.app.installed')}</Text>
              </View>
            ) : (
              <Button label={installing ? t('capture.app.installing') : t('capture.app.install')} busy={installing} onPress={install} kind="dark" style={{ marginTop: 12 }} />
            )
          ) : (
            <>
              <Button label={t('capture.app.pick')} icon="apps" onPress={pick} kind="dark" />
              <Pressable onPress={() => setSkip(true)} style={styles.skip}>
                <Text style={styles.link}>{t('capture.app.skip')}</Text>
              </Pressable>
            </>
          )}
        </Step>

        <Step n={2} title={t('capture.app.step2')} sub={t('capture.app.step2Sub')} done={overlay} active={step === 2}>
          {!overlay ? <Button label={t('capture.app.allow')} icon="shield" onPress={() => Native?.openOverlaySettings()} kind={step === 2 ? 'dark' : 'ghost'} /> : null}
        </Step>

        <Step n={3} title={t('capture.app.step3')} sub={t('capture.app.step3Sub')} done={shots.length > 0 && !running} active={step === 3}>
          {running ? (
            <View style={{ gap: 10 }}>
              <View style={styles.live}>
                <View style={styles.dot} />
                <Text style={styles.liveText}>{t('capture.app.running')}</Text>
                <Text style={styles.liveCount}>{t('capture.app.count', { count: shots.length })}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {apk?.installed ? <Button label={t('capture.app.open')} icon="play" kind="dark" onPress={() => Native?.launchApp(apk.pkg)} style={{ flex: 1 }} /> : null}
                <Button label={t('capture.app.stop')} icon="stop" kind="ghost" onPress={() => Native?.stopBubble()} style={{ flex: 1 }} />
              </View>
            </View>
          ) : (
            <Button label={t('capture.app.start')} icon="camera" busy={starting} disabled={step !== 3} onPress={start} />
          )}
          {shots.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 14 }} contentContainerStyle={{ gap: 8 }}>
              {shots.map((c) => (
                <Image key={c.uri} source={{ uri: c.uri }} style={[styles.shot, { aspectRatio: c.width / Math.max(1, c.height) }]} contentFit="cover" />
              ))}
            </ScrollView>
          ) : step === 3 && !running ? (
            <Text style={styles.none}>{t('capture.app.none')}</Text>
          ) : null}
        </Step>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          label={shots.length ? `${t('capture.app.make')} · ${shots.length}` : t('capture.app.make')}
          icon="layers"
          disabled={!shots.length}
          onPress={() => {
            if (running) Native?.stopBubble();
            openInEditor(
              [...shots].reverse().map((c) => ({ uri: c.uri, w: c.width, h: c.height, label: apk?.label ?? null })),
              'app'
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  sub: { fontFamily: F.body, fontSize: 14.5, lineHeight: 21, color: C.sub, marginTop: 2, marginHorizontal: 4 },
  step: { padding: 16 },
  stepHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  badge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  badgeText: { fontFamily: F.semi, fontSize: 14 },
  stepTitle: { fontFamily: F.title, fontSize: 18, color: C.ink, letterSpacing: -0.3 },
  stepSub: { fontFamily: F.body, fontSize: 13.5, lineHeight: 19, color: C.sub, marginTop: 3 },
  apk: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.bg, borderRadius: 18, padding: 12 },
  apkIcon: { width: 48, height: 48, borderRadius: 14 },
  apkName: { fontFamily: F.semi, fontSize: 15.5, color: C.ink },
  apkMeta: { fontFamily: F.body, fontSize: 12.5, color: C.sub, marginTop: 2 },
  link: { fontFamily: F.semi, fontSize: 14, color: C.accent },
  skip: { alignItems: 'center', paddingVertical: 12 },
  okRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  okText: { fontFamily: F.semi, fontSize: 14, color: C.ok },
  live: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accentSoft, borderRadius: 16, paddingHorizontal: 14, height: 46 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.accent },
  liveText: { flex: 1, fontFamily: F.semi, fontSize: 14.5, color: C.ink },
  liveCount: { fontFamily: F.semi, fontSize: 14, color: C.accent },
  shot: { height: 150, borderRadius: 12, backgroundColor: C.chip },
  none: { fontFamily: F.body, fontSize: 13, color: C.faint, marginTop: 12, textAlign: 'center' },
  message: { fontFamily: F.semi, fontSize: 13.5, color: C.danger, textAlign: 'center', marginTop: 4 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: 'rgba(243,241,236,0.96)' },
});
