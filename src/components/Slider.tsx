import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { FONT, useTheme } from '../theme';
import { tap } from './ui';

type Props = {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Bipolar slider: the fill starts from this value (e.g. 0 for -1..1). */
  origin?: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  onEnd?: (v: number) => void;
};

const THUMB = 22;

/**
 * Smooth gesture slider (UI thread), with a value readout. onChange is throttled to ~40 fps so
 * heavy canvases keep up; the final value is always delivered.
 */
export const Slider = memo(function Slider({ label, value, min = 0, max = 1, step, origin, format, onChange, onEnd }: Props) {
  const t = useTheme();
  const width = useSharedValue(0);
  const ratio = useSharedValue(0);
  const dragging = useSharedValue(false);
  const pressed = useSharedValue(0);
  const range = max - min || 1;
  const [live, setLive] = useState<number | null>(null);
  const last = useRef(0);
  const pending = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dragging.value) ratio.value = Math.min(1, Math.max(0, (value - min) / range));
  }, [value, min, range, dragging, ratio]);

  const snap = (r: number) => {
    'worklet';
    let v = min + r * range;
    if (step) v = Math.round(v / step) * step;
    return Math.min(max, Math.max(min, v));
  };

  const emit = (v: number) => {
    setLive(v);
    const now = Date.now();
    if (now - last.current >= 25) {
      last.current = now;
      pending.current = null;
      onChange(v);
    } else {
      pending.current = v;
      if (!timer.current)
        timer.current = setTimeout(() => {
          timer.current = null;
          if (pending.current !== null) {
            last.current = Date.now();
            onChange(pending.current);
            pending.current = null;
          }
        }, 28);
    }
  };
  const end = (v: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    setLive(null);
    onChange(v);
    onEnd?.(v);
  };
  const begin = () => tap('selection');

  const pan = Gesture.Pan()
    .hitSlop({ top: 14, bottom: 14 })
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onBegin((e) => {
      dragging.value = true;
      pressed.value = withTiming(1, { duration: 120 });
      scheduleOnRN(begin);
      if (width.value > 0) {
        const r = Math.min(1, Math.max(0, (e.x - THUMB / 2) / Math.max(1, width.value - THUMB)));
        ratio.value = (snap(r) - min) / range;
        scheduleOnRN(emit, snap(r));
      }
    })
    .onUpdate((e) => {
      if (width.value <= 0) return;
      const r = Math.min(1, Math.max(0, (e.x - THUMB / 2) / Math.max(1, width.value - THUMB)));
      ratio.value = (snap(r) - min) / range;
      scheduleOnRN(emit, snap(r));
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      pressed.value = withTiming(0, { duration: 160 });
      scheduleOnRN(end, snap(ratio.value));
    });

  const o = origin === undefined ? 0 : Math.min(1, Math.max(0, (origin - min) / range));
  const fill = useAnimatedStyle(() => {
    const w = Math.max(0, width.value - THUMB);
    const a = Math.min(o, ratio.value);
    const b = Math.max(o, ratio.value);
    return { transform: [{ translateX: THUMB / 2 + a * w }, { scaleX: Math.max(0.0001, (b - a) * w) }] };
  });
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: ratio.value * Math.max(0, width.value - THUMB) }, { scale: 1 + pressed.value * 0.18 }] }));

  const shown = live ?? value;
  return (
    <View style={styles.wrap}>
      {label ? (
        <View style={styles.head}>
          <Text style={[styles.label, { color: t.textSecondary }]}>{label}</Text>
          <Text style={[styles.value, { color: live !== null ? t.accent : t.text }]}>{format ? format(shown) : shown.toFixed(step && step >= 1 ? 0 : 2)}</Text>
        </View>
      ) : null}
      <GestureDetector gesture={pan}>
        <View style={styles.hit} onLayout={(e) => (width.value = e.nativeEvent.layout.width)}>
          <View style={[styles.track, { backgroundColor: t.chip }]} />
          <Animated.View style={[styles.fill, { backgroundColor: t.ink }, fill]} />
          <Animated.View pointerEvents="none" style={[styles.thumb, { backgroundColor: t.surface, borderColor: t.ink }, thumb]} />
        </View>
      </GestureDetector>
    </View>
  );
});

export const pct = (v: number) => `${Math.round(v * 100)} %`;
export const deg = (v: number) => `${Math.round(v)}°`;
export const px = (v: number) => `${Math.round(v)}`;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  label: { fontSize: 13.5, fontFamily: FONT.medium },
  value: { fontSize: 13, fontFamily: FONT.semi, fontVariant: ['tabular-nums'] },
  hit: { height: 34, justifyContent: 'center' },
  track: { position: 'absolute', left: THUMB / 2, right: THUMB / 2, height: 4, borderRadius: 2 },
  fill: { position: 'absolute', left: 0, width: 1, height: 4, transformOrigin: 'left' },
  thumb: { position: 'absolute', left: 0, width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2.5, elevation: 2 },
});
