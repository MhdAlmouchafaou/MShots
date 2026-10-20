import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSettings } from '../store/settings';
import { FONT, useTheme } from '../theme';
import { EASE_OUT, SPRING } from '../theme/motion';
import { Icon, type IconName } from './Icon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function tap(strength: 'light' | 'medium' | 'selection' = 'light') {
  if (!useSettings.getState().haptics) return;
  if (strength === 'selection') Haptics.selectionAsync().catch(() => {});
  else Haptics.impactAsync(strength === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function success() {
  if (!useSettings.getState().haptics) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Pressable that gently shrinks on touch. The style is on the pressable itself (layout-safe). */
export function PressScale({
  children,
  style,
  scaleTo = 0.965,
  haptic = true,
  onPress,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; haptic?: boolean; children?: React.ReactNode }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(e) => {
        s.value = withTiming(scaleTo, { duration: 110, easing: EASE_OUT });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, SPRING);
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) tap();
        onPress?.(e);
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function IconButton({ icon, onPress, size = 44, iconSize = 22, color, bg, disabled, style, label }: { icon: IconName; onPress?: () => void; size?: number; iconSize?: number; color?: string; bg?: string; disabled?: boolean; style?: StyleProp<ViewStyle>; label?: string }) {
  const t = useTheme();
  return (
    <PressScale
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={[{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: bg ?? 'transparent', opacity: disabled ? 0.35 : 1 }, style]}
    >
      <Icon name={icon} size={iconSize} color={color ?? t.icon} />
    </PressScale>
  );
}

export function Button({ label, icon, onPress, kind = 'primary', style, disabled, small }: { label: string; icon?: IconName; onPress?: () => void; kind?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'; style?: StyleProp<ViewStyle>; disabled?: boolean; small?: boolean }) {
  const t = useTheme();
  const bg = kind === 'primary' ? t.ink : kind === 'accent' ? t.accent : kind === 'secondary' ? t.chip : kind === 'danger' ? t.danger : 'transparent';
  const fg = kind === 'primary' ? t.onInk : kind === 'accent' || kind === 'danger' ? '#fff' : t.text;
  return (
    <PressScale onPress={disabled ? undefined : onPress} style={[styles.button, small && styles.buttonSmall, { backgroundColor: bg, opacity: disabled ? 0.4 : 1 }, style]}>
      {icon ? <Icon name={icon} size={small ? 17 : 20} color={fg} strokeWidth={2} /> : null}
      <Text numberOfLines={1} style={[styles.buttonText, small && styles.buttonTextSmall, { color: fg }]}>
        {label}
      </Text>
    </PressScale>
  );
}

export function Chip({ label, active, onPress, icon, style, swatch }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName; style?: StyleProp<ViewStyle>; swatch?: string }) {
  const t = useTheme();
  return (
    <PressScale onPress={onPress} scaleTo={0.94} style={[styles.chip, { backgroundColor: active ? t.chipActive : t.chip }, style]}>
      {swatch ? <View style={[styles.swatchDot, { backgroundColor: swatch }]} /> : null}
      {icon ? <Icon name={icon} size={16} color={active ? t.onInk : t.text} strokeWidth={2} /> : null}
      <Text numberOfLines={1} style={[styles.chipText, { color: active ? t.onInk : t.text }]}>
        {label}
      </Text>
    </PressScale>
  );
}

/** Horizontal chip row (fixed height: never stretches vertically). */
export function ChipRow({ children, style, contentStyle }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipRow, style]} contentContainerStyle={[styles.chipRowContent, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, style }: { options: { key: T; label: string; icon?: IconName }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[styles.seg, { backgroundColor: t.chip }, style]}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            onPress={() => {
              if (!on) tap('selection');
              onChange(o.key);
            }}
            style={[styles.segItem, on && { backgroundColor: t.surface, elevation: 1 }]}
          >
            {o.icon ? <Icon name={o.icon} size={16} color={on ? t.text : t.textSecondary} strokeWidth={2} /> : null}
            <Text numberOfLines={1} style={[styles.segText, { color: on ? t.text : t.textSecondary }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  const x = useSharedValue(value ? 1 : 0);
  React.useEffect(() => {
    x.value = withTiming(value ? 1 : 0, { duration: 200, easing: EASE_OUT });
  }, [value, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: 2 + x.value * 20 }] }));
  const on = useAnimatedStyle(() => ({ opacity: x.value }));
  return (
    <Pressable
      onPress={() => {
        tap('selection');
        onChange(!value);
      }}
      hitSlop={8}
      style={[styles.toggle, { backgroundColor: t.chip }]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 16, backgroundColor: t.accent }, on]} />
      <Animated.View style={[styles.knob, knob]} />
    </Pressable>
  );
}

export function Label({ children, style, right }: { children: React.ReactNode; style?: StyleProp<TextStyle>; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.label, { color: t.textSecondary }, style]}>{children}</Text>
      {right}
    </View>
  );
}

export function Row({ title, subtitle, icon, right, onPress, danger }: { title: string; subtitle?: string; icon?: IconName; right?: React.ReactNode; onPress?: () => void; danger?: boolean }) {
  const t = useTheme();
  const body = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: t.chip }]}>
          <Icon name={icon} size={19} color={danger ? t.danger : t.icon} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: danger ? t.danger : t.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSub, { color: t.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={18} color={t.textTertiary} /> : null)}
    </View>
  );
  return onPress ? (
    <Pressable onPress={onPress} android_ripple={{ color: t.divider }}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface }, style]}>{children}</View>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[styles.title, { color: t.text }, style]}>{children}</Text>;
}

export const styles = StyleSheet.create({
  button: { height: 54, borderRadius: 27, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonSmall: { height: 40, borderRadius: 20, paddingHorizontal: 16, gap: 7 },
  buttonText: { fontSize: 16, fontFamily: FONT.semi },
  buttonTextSmall: { fontSize: 14 },
  chip: { height: 36, borderRadius: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontSize: 13.5, fontFamily: FONT.semi },
  swatchDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' },
  chipRow: { flexGrow: 0, flexShrink: 0 },
  chipRowContent: { alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 48 },
  seg: { flexDirection: 'row', borderRadius: 14, padding: 3, height: 40 },
  segItem: { flex: 1, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segText: { fontSize: 13, fontFamily: FONT.semi },
  toggle: { width: 46, height: 28, borderRadius: 16, justifyContent: 'center', overflow: 'hidden' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 14, marginBottom: 6 },
  label: { fontSize: 12.5, fontFamily: FONT.semi, letterSpacing: 0.3, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, minHeight: 58, paddingVertical: 10 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15.5, fontFamily: FONT.medium },
  rowSub: { fontSize: 13, fontFamily: FONT.regular, marginTop: 2 },
  card: { borderRadius: 24, overflow: 'hidden' },
  title: { fontSize: 34, fontFamily: FONT.display, letterSpacing: -1.2 },
});
