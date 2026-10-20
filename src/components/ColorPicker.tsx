import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { hsl, parseHex, toHex } from '../engine/color';
import { FONT, useTheme } from '../theme';
import { tap } from './ui';

export const PALETTE = [
  '#FFFFFF', '#F3F1EC', '#E9E3D8', '#D6CFC3', '#9B978F', '#5E5B55', '#2A2926', '#0B0B0C',
  '#FF5A1F', '#E2410D', '#F2A93B', '#F7D774', '#E8F58A', '#B8D86B', '#3DD68C', '#1F8A5B',
  '#9AD6FF', '#4F8BFF', '#2F4058', '#1B1D24', '#C5B5FF', '#8B6CFF', '#F6A6C1', '#E5484D',
  '#B8A43A', '#8A5B3A', '#C4AA8E', '#E2BFB2', '#B9CBDC', '#9CC7C4', '#B9C3A7', '#6E7FD8',
];

export function toHsl(hex: string): [number, number, number] {
  const [r0, g0, b0] = parseHex(hex);
  const r = r0 / 255;
  const g = g0 / 255;
  const b = b0 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

const Bar = memo(function Bar({ stops, value, onChange, id }: { stops: string[]; value: number; onChange: (v: number) => void; id: string }) {
  const w = useSharedValue(0);
  const r = useSharedValue(value);
  useEffect(() => {
    r.value = value;
  }, [value, r]);
  // Coalesce gesture events to one change per frame.
  const pending = useRef<number | null>(null);
  const set = (v: number) => {
    const first = pending.current === null;
    pending.current = v;
    if (first)
      requestAnimationFrame(() => {
        const x = pending.current;
        pending.current = null;
        if (x !== null) onChange(x);
      });
  };
  const pan = Gesture.Pan()
    .minDistance(0)
    .hitSlop({ top: 10, bottom: 10 })
    .onBegin((e) => {
      const v = Math.min(1, Math.max(0, e.x / Math.max(1, w.value)));
      r.value = v;
      scheduleOnRN(set, v);
    })
    .onUpdate((e) => {
      const v = Math.min(1, Math.max(0, e.x / Math.max(1, w.value)));
      r.value = v;
      scheduleOnRN(set, v);
    });
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: r.value * w.value - 11 }] }));
  return (
    <GestureDetector gesture={pan}>
      <View style={styles.bar} onLayout={(e) => (w.value = e.nativeEvent.layout.width)}>
        <Svg width="100%" height={18} style={styles.barSvg}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
              {stops.map((c, i) => (
                <Stop key={i} offset={i / Math.max(1, stops.length - 1)} stopColor={c} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height={18} rx={9} fill={`url(#${id})`} />
        </Svg>
        <Animated.View pointerEvents="none" style={[styles.knob, knob]} />
      </View>
    </GestureDetector>
  );
});

/** Palette + HSL bars + hex field. Calls onChange continuously (throttled by the caller's edit key). */
export const ColorPicker = memo(function ColorPicker({ value, onChange, allowAlpha }: { value: string; onChange: (c: string) => void; allowAlpha?: boolean }) {
  const t = useTheme();
  const [h, s, l] = useMemo(() => toHsl(value), [value]);
  const [hex, setHex] = useState(value.toUpperCase());
  const local = useRef({ h, s, l });
  useEffect(() => {
    setHex(value.toUpperCase());
    local.current = { h, s, l };
  }, [value, h, s, l]);
  const alpha = parseHex(value)[3];
  const emit = (nh: number, ns: number, nl: number) => {
    local.current = { h: nh, s: ns, l: nl };
    const c = hsl(nh, ns, nl);
    const [r, g, b] = parseHex(c);
    onChange(toHex(r, g, b, alpha));
  };
  const hueStops = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'];
  return (
    <View>
      <View style={styles.palette}>
        {PALETTE.map((c) => (
          <Pressable
            key={c}
            onPress={() => {
              tap('selection');
              onChange(c);
            }}
            style={[styles.sw, { backgroundColor: c, borderColor: c.toUpperCase() === value.slice(0, 7).toUpperCase() ? t.accent : t.divider, borderWidth: c.toUpperCase() === value.slice(0, 7).toUpperCase() ? 2.5 : 1 }]}
          />
        ))}
      </View>
      <View style={styles.bars}>
        <Bar id="hue" stops={hueStops} value={h / 360} onChange={(v) => emit(v * 360, local.current.s, local.current.l)} />
        <Bar id="sat" stops={[hsl(h, 0, l), hsl(h, 100, l)]} value={s / 100} onChange={(v) => emit(local.current.h, v * 100, local.current.l)} />
        <Bar id="lum" stops={['#000000', hsl(h, s, 50), '#FFFFFF']} value={l / 100} onChange={(v) => emit(local.current.h, local.current.s, v * 100)} />
        {allowAlpha ? (
          <Bar
            id="alpha"
            stops={[`${value.slice(0, 7)}00`, value.slice(0, 7)]}
            value={alpha}
            onChange={(v) => {
              const [r, g, b] = parseHex(value);
              onChange(toHex(r, g, b, v));
            }}
          />
        ) : null}
      </View>
      <View style={styles.hexRow}>
        <View style={[styles.preview, { backgroundColor: value }]} />
        <TextInput
          value={hex}
          onChangeText={setHex}
          onEndEditing={() => {
            const v = hex.trim().startsWith('#') ? hex.trim() : `#${hex.trim()}`;
            if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) onChange(v);
            else setHex(value.toUpperCase());
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={9}
          style={[styles.hex, { color: t.text, backgroundColor: t.chip }]}
        />
        <Text style={[styles.hint, { color: t.textTertiary }]}>HEX</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 16, paddingTop: 6 },
  sw: { width: 32, height: 32, borderRadius: 16 },
  bars: { paddingHorizontal: 16, gap: 14, marginTop: 16 },
  bar: { height: 24, justifyContent: 'center' },
  barSvg: { position: 'absolute', left: 0, right: 0 },
  knob: { position: 'absolute', left: 0, width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#fff', backgroundColor: 'transparent', elevation: 3 },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginTop: 16 },
  preview: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  hex: { flex: 1, height: 42, borderRadius: 12, paddingHorizontal: 14, fontFamily: FONT.semi, fontSize: 15, letterSpacing: 1 },
  hint: { fontSize: 12, fontFamily: FONT.semi },
});
