import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { useUI } from '../store/ui';
import { FONT, useTheme } from '../theme';
import { EASE_OUT } from '../theme/motion';
import { Icon, type IconName } from './Icon';
import { Button } from './ui';

function Backdrop({ onPress }: { onPress?: () => void }) {
  const t = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={[StyleSheet.absoluteFill, { backgroundColor: t.scrim }]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} />
    </Animated.View>
  );
}

function Sheet() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const sheet = useUI((s) => s.sheet);
  if (!sheet) return null;
  const close = () => useUI.setState({ sheet: null });
  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <Backdrop onPress={close} />
      <Animated.View entering={SlideInDown.duration(260).easing(EASE_OUT)} exiting={SlideOutDown.duration(200)} style={[styles.sheet, { backgroundColor: t.surface, paddingBottom: insets.bottom + 12 }]}>
        <View style={[styles.grabber, { backgroundColor: t.divider }]} />
        {sheet.title ? <Text style={[styles.sheetTitle, { color: t.text }]}>{sheet.title}</Text> : null}
        {sheet.subtitle ? <Text style={[styles.sheetSub, { color: t.textSecondary }]}>{sheet.subtitle}</Text> : null}
        {sheet.actions.map((a) => (
          <Pressable
            key={a.label}
            android_ripple={{ color: t.divider }}
            onPress={() => {
              close();
              setTimeout(a.onPress, 50);
            }}
            style={styles.action}
          >
            {a.icon ? <Icon name={a.icon as IconName} size={21} color={a.destructive ? t.danger : t.icon} /> : null}
            <Text style={[styles.actionText, { color: a.destructive ? t.danger : t.text }]}>{a.label}</Text>
          </Pressable>
        ))}
      </Animated.View>
    </Modal>
  );
}

function Confirm() {
  const t = useTheme();
  const tt = useT();
  const c = useUI((s) => s.confirm);
  if (!c) return null;
  const close = () => useUI.setState({ confirm: null });
  return (
    <Modal transparent visible animationType="none" onRequestClose={() => { close(); c.onCancel?.(); }} statusBarTranslucent>
      <Backdrop onPress={() => { close(); c.onCancel?.(); }} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View entering={FadeIn.duration(200)} style={[styles.dialog, { backgroundColor: t.surface }]}>
          <Text style={[styles.dialogTitle, { color: t.text }]}>{c.title}</Text>
          {c.message ? <Text style={[styles.dialogMsg, { color: t.textSecondary }]}>{c.message}</Text> : null}
          <View style={styles.dialogRow}>
            <Button small kind="secondary" label={tt('common.cancel')} onPress={() => { close(); c.onCancel?.(); }} style={{ flex: 1 }} />
            <Button small kind={c.destructive ? 'danger' : 'primary'} label={c.confirmLabel} onPress={() => { close(); c.onConfirm(); }} style={{ flex: 1 }} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Prompt() {
  const t = useTheme();
  const tt = useT();
  const p = useUI((s) => s.prompt);
  const [v, setV] = useState('');
  useEffect(() => setV(p?.initial ?? ''), [p]);
  if (!p) return null;
  const close = () => useUI.setState({ prompt: null });
  const submit = () => {
    close();
    p.onSubmit(v);
  };
  return (
    <Modal transparent visible animationType="none" onRequestClose={close} statusBarTranslucent>
      <Backdrop onPress={close} />
      <KeyboardAvoidingView behavior="padding" style={styles.center} pointerEvents="box-none">
        <Animated.View entering={FadeIn.duration(200)} style={[styles.dialog, { backgroundColor: t.surface }]}>
          <Text style={[styles.dialogTitle, { color: t.text }]}>{p.title}</Text>
          {p.message ? <Text style={[styles.dialogMsg, { color: t.textSecondary }]}>{p.message}</Text> : null}
          <TextInput
            autoFocus
            value={v}
            onChangeText={setV}
            placeholder={p.placeholder}
            placeholderTextColor={t.textTertiary}
            multiline={p.multiline}
            onSubmitEditing={p.multiline ? undefined : submit}
            style={[styles.input, { color: t.text, backgroundColor: t.chip, minHeight: p.multiline ? 96 : 48 }]}
          />
          <View style={styles.dialogRow}>
            <Button small kind="secondary" label={tt('common.cancel')} onPress={close} style={{ flex: 1 }} />
            <Button small label={p.confirmLabel ?? tt('common.ok')} onPress={submit} style={{ flex: 1 }} />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Toast() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useUI((s) => s.toast);
  const [shown, setShown] = useState(toast);
  useEffect(() => {
    if (!toast) return;
    setShown(toast);
    const id = setTimeout(() => setShown(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);
  if (!shown) return null;
  return (
    <Animated.View key={shown.id} pointerEvents="none" entering={FadeIn.duration(180)} exiting={FadeOut.duration(220)} style={[styles.toastWrap, { bottom: insets.bottom + 96 }]}>
      <View style={[styles.toast, { backgroundColor: t.dark ? '#F3F1EC' : '#0B0B0C' }]}>
        {shown.tone ? <Icon name={shown.tone === 'ok' ? 'check' : 'info'} size={18} color={shown.tone === 'ok' ? '#3DD68C' : '#FF6369'} strokeWidth={2.4} /> : null}
        <Text style={[styles.toastText, { color: t.dark ? '#0B0B0C' : '#F3F1EC' }]}>{shown.text}</Text>
      </View>
    </Animated.View>
  );
}

function Busy() {
  const t = useTheme();
  const busy = useUI((s) => s.busy);
  if (!busy) return null;
  const p = busy.progress;
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Backdrop />
      <View style={styles.center} pointerEvents="none">
        <Animated.View entering={FadeIn.duration(160)} style={[styles.busy, { backgroundColor: t.surface }]}>
          <Text style={[styles.dialogTitle, { color: t.text, textAlign: 'center' }]}>{busy.text}</Text>
          <View style={[styles.busyTrack, { backgroundColor: t.chip }]}>
            <View style={[styles.busyFill, { backgroundColor: t.accent, transform: [{ scaleX: p ?? 0.35 }] }]} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function Overlays() {
  return (
    <>
      <Sheet />
      <Confirm />
      <Prompt />
      <Busy />
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 8 },
  grabber: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 10 },
  sheetTitle: { fontSize: 19, fontFamily: FONT.displayBold, paddingHorizontal: 22, paddingTop: 6 },
  sheetSub: { fontSize: 13.5, fontFamily: FONT.regular, paddingHorizontal: 22, marginTop: 3, marginBottom: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, height: 54 },
  actionText: { fontSize: 16, fontFamily: FONT.medium },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 28, padding: 22 },
  dialogTitle: { fontSize: 19, fontFamily: FONT.displayBold },
  dialogMsg: { fontSize: 14.5, fontFamily: FONT.regular, marginTop: 8, lineHeight: 20 },
  dialogRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  input: { borderRadius: 14, paddingHorizontal: 14, marginTop: 14, fontSize: 16, fontFamily: FONT.medium, textAlignVertical: 'top', paddingTop: 12 },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, height: 46, borderRadius: 23, maxWidth: '88%' },
  toastText: { fontSize: 14.5, fontFamily: FONT.semi },
  busy: { width: 260, borderRadius: 26, padding: 22 },
  busyTrack: { height: 5, borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  busyFill: { height: 5, width: '100%', transformOrigin: 'left' },
});
