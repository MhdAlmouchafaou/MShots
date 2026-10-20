import { useFonts as useSkiaFonts, type SkTypefaceFontProvider } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { create } from 'zustand';

/** Fonts available to text layers (family names match engine FONT_FAMILY). */
const SOURCES = {
  'Bricolage Grotesque': [
    require('@expo-google-fonts/bricolage-grotesque/400Regular/BricolageGrotesque_400Regular.ttf'),
    require('@expo-google-fonts/bricolage-grotesque/500Medium/BricolageGrotesque_500Medium.ttf'),
    require('@expo-google-fonts/bricolage-grotesque/600SemiBold/BricolageGrotesque_600SemiBold.ttf'),
    require('@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf'),
    require('@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf'),
  ],
  Inter: [
    require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
    require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
    require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
    require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
    require('@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf'),
  ],
};

const useFontStore = create<{ provider: SkTypefaceFontProvider | null }>(() => ({ provider: null }));

/** Font provider for offscreen renders (export, thumbnails) once loaded. */
export const fontProvider = () => useFontStore.getState().provider;

/** The shared provider in components (null until loaded). */
export const useFontProvider = () => useFontStore((s) => s.provider);

/** Loads the Skia fonts once: mount <CanvasFontsLoader /> in the root layout. */
export function CanvasFontsLoader() {
  const p = useSkiaFonts(SOURCES);
  useEffect(() => {
    if (p) useFontStore.setState({ provider: p });
  }, [p]);
  return null;
}
