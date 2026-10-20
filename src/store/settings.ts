import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LanguagePref = 'system' | 'fr' | 'en';
export type ThemePref = 'system' | 'light' | 'dark';

type SettingsState = {
  language: LanguagePref;
  theme: ThemePref;
  exportScale: 1 | 2 | 3;
  exportFormat: 'png' | 'jpg' | 'webp';
  exportQuality: number;
  haptics: boolean;
  snapping: boolean;
  onboarded: boolean;
  hydrated: boolean;
  set: (p: Partial<Omit<SettingsState, 'set'>>) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'system',
      theme: 'system',
      exportScale: 2,
      exportFormat: 'png',
      exportQuality: 0.92,
      haptics: true,
      snapping: true,
      onboarded: false,
      hydrated: false,
      set: (p) => set(p),
    }),
    {
      name: 'mshots-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ set: _s, hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    }
  )
);
