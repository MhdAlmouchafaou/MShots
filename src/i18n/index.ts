import { getLocales } from 'expo-localization';
import { useCallback } from 'react';
import { useSettings, type LanguagePref } from '../store/settings';
import en from './en';
import fr from './fr';

export type Lang = 'fr' | 'en';
export type Params = Record<string, string | number | null | undefined> & { count?: number };
type Dict = Record<string, string>;

const DICTS: Record<Lang, Dict> = { fr: { ...fr }, en: { ...en } };

/** Other parts of the app (capture screens…) add their strings here. */
export function registerStrings(lang: Lang, dict: Dict) {
  Object.assign(DICTS[lang], dict);
}

let device: Lang | null = null;
function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode ?? 'fr';
    return code.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'fr';
  }
}

export function resolveLang(pref: LanguagePref | undefined): Lang {
  if (pref === 'fr' || pref === 'en') return pref;
  if (!device) device = deviceLang();
  return device;
}

export const currentLang = (): Lang => resolveLang(useSettings.getState().language);
export const locale = (lang: Lang = currentLang()) => (lang === 'fr' ? 'fr-FR' : 'en-US');

function lookup(lang: Lang, key: string, params?: Params): string {
  const d = DICTS[lang];
  let s: string | undefined;
  if (params && typeof params.count === 'number') {
    const one = lang === 'fr' ? Math.abs(params.count) < 2 : Math.abs(params.count) === 1;
    s = d[`${key}_${one ? 'one' : 'other'}`];
  }
  if (s === undefined) s = d[key];
  if (s === undefined) s = DICTS.fr[key] ?? key;
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (_m, k: string) => {
    const v = params[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

export const tr = (key: string, params?: Params) => lookup(currentLang(), key, params);

export function useLang(): Lang {
  return resolveLang(useSettings((s) => s.language));
}

export type TFn = (key: string, params?: Params) => string;

export function useT(): TFn {
  const lang = useLang();
  return useCallback((key: string, params?: Params) => lookup(lang, key, params), [lang]);
}
