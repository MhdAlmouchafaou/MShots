import { useColorScheme } from 'react-native';
import { useSettings } from '../store/settings';

export type Theme = {
  dark: boolean;
  bg: string;
  bgElevated: string;
  surface: string;
  surface2: string;
  chip: string;
  chipActive: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  divider: string;
  ink: string;
  onInk: string;
  accent: string;
  accentSoft: string;
  danger: string;
  success: string;
  scrim: string;
  canvas: string;
  icon: string;
};

export const ACCENT = '#FF5A1F';

const light: Theme = {
  dark: false,
  bg: '#F3F1EC',
  bgElevated: '#FAF9F6',
  surface: '#FFFFFF',
  surface2: '#F7F5F1',
  chip: '#EAE7E0',
  chipActive: '#0B0B0C',
  text: '#0B0B0C',
  textSecondary: '#5E5B55',
  textTertiary: '#9B978F',
  divider: 'rgba(11,11,12,0.08)',
  ink: '#0B0B0C',
  onInk: '#FFFFFF',
  accent: ACCENT,
  accentSoft: 'rgba(255,90,31,0.12)',
  danger: '#E5484D',
  success: '#22A06B',
  scrim: 'rgba(11,11,12,0.38)',
  canvas: '#E4E1DA',
  icon: '#2A2926',
};

const dark: Theme = {
  dark: true,
  bg: '#0B0B0C',
  bgElevated: '#141416',
  surface: '#1A1A1D',
  surface2: '#222226',
  chip: '#26262A',
  chipActive: '#F3F1EC',
  text: '#F3F1EC',
  textSecondary: '#A7A39B',
  textTertiary: '#6E6B66',
  divider: 'rgba(255,255,255,0.08)',
  ink: '#F3F1EC',
  onInk: '#0B0B0C',
  accent: ACCENT,
  accentSoft: 'rgba(255,90,31,0.18)',
  danger: '#FF6369',
  success: '#3DD68C',
  scrim: 'rgba(0,0,0,0.55)',
  canvas: '#050506',
  icon: '#E6E3DC',
};

export function useTheme(): Theme {
  const sys = useColorScheme();
  const pref = useSettings((s) => s.theme);
  const isDark = pref === 'dark' || (pref === 'system' && sys === 'dark');
  return isDark ? dark : light;
}

export const FONT = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};
