import { getLocales } from 'expo-localization';
import { useCallback, useEffect } from 'react';
import { Native } from '../../modules/mshare-core';
import { useSettings, type LanguagePref } from '../store/settings';
import en from './en';
import fr from './fr';
import sessionEn from './session.en';
import sessionFr from './session.fr';

export type Lang = 'fr' | 'en';
export type Params = Record<string, string | number | null | undefined> & { count?: number };
type Dict = Record<string, string>;

/** Extra dictionaries contributed by other parts of the app (merged on top of the base ones). */
const DICTS: Record<Lang, Dict> = { fr: { ...fr, ...(sessionFr as Dict) }, en: { ...en, ...(sessionEn as Dict) } };

export function registerStrings(lang: Lang, dict: Dict) {
  Object.assign(DICTS[lang], dict);
}

function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode ?? 'fr';
    return code.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'fr';
  }
}

let device: Lang | null = null;

export function resolveLang(pref: LanguagePref | undefined): Lang {
  if (pref === 'fr' || pref === 'en') return pref;
  if (!device) device = deviceLang();
  return device;
}

/** Current language, outside React. */
export function currentLang(): Lang {
  return resolveLang(useSettings.getState().language);
}

/** BCP-47 locale for Intl / toLocaleDateString. */
export function locale(lang: Lang = currentLang()) {
  return lang === 'fr' ? 'fr-FR' : 'en-US';
}

function lookup(lang: Lang, key: string, params?: Params): string {
  const d = DICTS[lang];
  let s: string | undefined;
  if (params && typeof params.count === 'number') {
    // French: 0 and 1 are singular.
    const one = lang === 'fr' ? Math.abs(params.count) < 2 : Math.abs(params.count) === 1;
    s = d[`${key}_${one ? 'one' : 'other'}`];
  }
  if (s === undefined) s = d[key];
  if (s === undefined) s = DICTS.fr[key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => {
    const v = params[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

/** Translate outside React (toasts, actions, stores). */
export function tr(key: string, params?: Params): string {
  return lookup(currentLang(), key, params);
}

export function useLang(): Lang {
  const pref = useSettings((s) => s.language);
  return resolveLang(pref);
}

export type TFn = (key: string, params?: Params) => string;

/** Translate in components: re-renders when the language changes. */
export function useT(): TFn {
  const lang = useLang();
  return useCallback((key: string, params?: Params) => lookup(lang, key, params), [lang]);
}

export function setLanguage(l: LanguagePref) {
  useSettings.getState().set({ language: l });
}

/** Keeps the native side (notification texts) in the current language. Mount once. */
export function useNativeLanguage() {
  const lang = useLang();
  useEffect(() => {
    try {
      Native?.setLanguage(lang);
    } catch {}
  }, [lang]);
}

/** Mount once: keeps native texts in the current language. */
export function LanguageSync() {
  useNativeLanguage();
  return null;
}
