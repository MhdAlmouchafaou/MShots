import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Visual tokens shared by the capture screens (match the app's warm light style). */
export const C = {
  bg: '#F3F1EC',
  card: '#FFFFFF',
  ink: '#0B0B0C',
  text: '#16161A',
  sub: '#6E6C68',
  faint: '#A9A6A0',
  line: 'rgba(11,11,12,0.08)',
  chip: '#E9E6DF',
  accent: '#FF5A1F',
  accentSoft: '#FFE6DB',
  ok: '#1FA971',
  danger: '#E5484D',
};

export const F = {
  title: 'BricolageGrotesque_700Bold',
  body: 'Inter_400Regular',
  semi: 'Inter_600SemiBold',
};

export const tap = () => {
  Haptics.selectionAsync().catch(() => {});
};

type IconName = 'back' | 'globe' | 'phone' | 'tablet' | 'laptop' | 'monitor' | 'sliders' | 'camera' | 'check' | 'trash' | 'apps' | 'layers' | 'stop' | 'play' | 'shield' | 'refresh' | 'arrow';

const PATHS: Record<IconName, string> = {
  back: 'M15 5l-7 7 7 7',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z',
  phone: 'M8 2.5h8a2 2 0 012 2v15a2 2 0 01-2 2H8a2 2 0 01-2-2v-15a2 2 0 012-2zM10.5 5h3',
  tablet: 'M6 2.5h12a2 2 0 012 2v15a2 2 0 01-2 2H6a2 2 0 01-2-2v-15a2 2 0 012-2zM11 18.5h2',
  laptop: 'M5 5.5h14a1 1 0 011 1v9H4v-9a1 1 0 011-1zM2 18.5h20',
  monitor: 'M3.5 4h17a1 1 0 011 1v10.5a1 1 0 01-1 1h-17a1 1 0 01-1-1V5a1 1 0 011-1zM9 20.5h6M12 16.5v4',
  sliders: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4',
  camera: 'M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8zM12 9.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  trash: 'M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5',
  apps: 'M5 4h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM15 4h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5a1 1 0 011-1zM5 14h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4a1 1 0 011-1zM15 14h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4a1 1 0 011-1z',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  stop: 'M7 7h10v10H7z',
  play: 'M8 5.5v13l10.5-6.5L8 5.5z',
  shield: 'M12 3l7.5 3v6c0 4.4-3.2 8-7.5 9-4.3-1-7.5-4.6-7.5-9V6L12 3zM8.5 12l2.5 2.5 4.5-4.5',
  refresh: 'M20 11a8 8 0 10-2.3 5.7M20 4.5V11h-6.5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

export function Icon({ name, size = 22, color = C.ink, stroke = 1.9 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={PATHS[name]} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" fill={name === 'play' || name === 'stop' ? color : 'none'} />
    </Svg>
  );
}

export function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.round, pressed && { opacity: 0.6 }]}
      >
        <Icon name="back" size={22} />
      </Pressable>
      <Text numberOfLines={1} style={styles.headerTitle}>
        {title}
      </Text>
      <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Chip({ label, icon, on, onPress }: { label: string; icon?: IconName; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [styles.chip, { backgroundColor: on ? C.ink : C.card, borderColor: on ? C.ink : C.line }, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      {icon ? <Icon name={icon} size={17} color={on ? '#fff' : C.text} /> : null}
      <Text style={[styles.chipText, { color: on ? '#fff' : C.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Toggle({ title, sub, value, onChange }: { title: string; sub?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggle}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.toggleTitle}>{title}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.accent, false: '#D9D5CE' }} thumbColor="#fff" />
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'dark' | 'ghost' | 'danger';
  icon?: IconName;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = kind === 'primary' ? C.accent : kind === 'dark' ? C.ink : kind === 'danger' ? C.danger : C.chip;
  const fg = kind === 'ghost' ? C.ink : '#fff';
  return (
    <Pressable
      disabled={disabled || busy}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }, style]}
    >
      {busy ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={20} color={fg} stroke={2.1} /> : null}
      <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Section({ title }: { title: string }) {
  return <Text style={styles.section}>{title}</Text>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 8, gap: 10, backgroundColor: C.bg },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: F.title, fontSize: 22, color: C.ink, letterSpacing: -0.4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  chipText: { fontFamily: F.semi, fontSize: 14 },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  toggleTitle: { fontFamily: F.semi, fontSize: 15, color: C.text },
  toggleSub: { fontFamily: F.body, fontSize: 13, color: C.sub, marginTop: 2 },
  button: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18 },
  buttonText: { fontFamily: F.semi, fontSize: 16 },
  card: { backgroundColor: C.card, borderRadius: 22, padding: 16 },
  section: { fontFamily: F.semi, fontSize: 13, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 22, marginBottom: 10, marginHorizontal: 4 },
});
