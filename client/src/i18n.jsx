import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import te from './locales/te.json';
import ta from './locales/ta.json';

// Supported languages. To add more: create src/locales/xx.json (same keys as en.json)
// and add it to LANGUAGES + dicts below. Missing keys automatically fall back to English.
export const LANGUAGES = [
  { code: 'en', native: 'English' },
  { code: 'hi', native: 'हिन्दी' },
  { code: 'te', native: 'తెలుగు' },
  { code: 'ta', native: 'தமிழ்' },
];

const dicts = { en, hi, te, ta };
const I18nCtx = createContext({ lang: 'en', t: (k) => k, setLang: () => {}, languages: LANGUAGES });

function lookup(dict, key) {
  const parts = key.split('.');
  let v = dict;
  for (const p of parts) {
    v = v?.[p];
    if (v === undefined) break;
  }
  return v;
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('cc_lang') || 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l) => {
    setLangState(dicts[l] ? l : 'en');
    localStorage.setItem('cc_lang', dicts[l] ? l : 'en');
  };

  const t = useMemo(() => {
    const d = dicts[lang] || en;
    return (key) => {
      const v = lookup(d, key);
      if (v !== undefined) return String(v);
      const fallback = lookup(en, key);
      return fallback !== undefined ? String(fallback) : key;
    };
  }, [lang]);

  return <I18nCtx.Provider value={{ lang, t, setLang, languages: LANGUAGES }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
