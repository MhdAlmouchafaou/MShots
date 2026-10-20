import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT, useTheme } from '../../../theme';
import { ColorPicker } from '../../ColorPicker';
import { Icon } from '../../Icon';
import { tap } from '../../ui';

export function Section({ title, children, right }: { title: string; children?: React.ReactNode; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: t.textSecondary }]}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

/** A colour row that expands into the full picker. */
export function ColorRow({ label, value, onChange, alpha }: { label: string; value: string; onChange: (c: string) => void; alpha?: boolean }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => {
          tap('selection');
          setOpen((o) => !o);
        }}
        style={styles.colorRow}
      >
        <Text style={[styles.colorLabel, { color: t.text }]}>{label}</Text>
        <View style={[styles.colorDot, { backgroundColor: value, borderColor: t.divider }]} />
        <Text style={[styles.colorHex, { color: t.textSecondary }]}>{value.slice(0, 7).toUpperCase()}</Text>
        <Icon name={open ? 'up' : 'down'} size={16} color={t.textTertiary} />
      </Pressable>
      {open ? (
        <View style={{ paddingBottom: 8 }}>
          <ColorPicker value={value} onChange={onChange} allowAlpha={alpha} />
        </View>
      ) : null}
    </View>
  );
}

/** Grid of big square options (presets). */
export function OptionGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

export function Option({ label, active, onPress, children }: { label: string; active?: boolean; onPress: () => void; children?: React.ReactNode }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap('selection');
        onPress();
      }}
      style={styles.option}
    >
      <View style={[styles.optionBox, { backgroundColor: t.chip, borderColor: active ? t.accent : 'transparent' }]}>{children}</View>
      <Text numberOfLines={1} style={[styles.optionLabel, { color: active ? t.text : t.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  section: { paddingTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6, minHeight: 22 },
  title: { fontSize: 12, fontFamily: FONT.semi, letterSpacing: 0.4, textTransform: 'uppercase' },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: 46 },
  colorLabel: { flex: 1, fontSize: 14, fontFamily: FONT.medium },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1 },
  colorHex: { fontSize: 12.5, fontFamily: FONT.semi, width: 66 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10 },
  option: { width: '25%', padding: 6, alignItems: 'center' },
  optionBox: { width: '100%', aspectRatio: 1, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  optionLabel: { fontSize: 11.5, fontFamily: FONT.semi, marginTop: 5 },
});
