import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { adminLocales } from './locales/adminLocales';

const AdminLanguageContext = createContext(null);

const STORAGE_KEY = 'adminLang';

function interpolate(str, vars) {
  if (!str || !vars) return str || '';
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

function pickString(lang, path) {
  const parts = path.split('.');
  let o = adminLocales[lang];
  for (const p of parts) {
    if (o == null) return undefined;
    o = o[p];
  }
  return typeof o === 'string' ? o : undefined;
}

export function AdminLanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === 'en' || s === 'fr') return s;
    } catch {
      /* ignore */
    }
    return 'fr';
  });

  const setLang = useCallback((next) => {
    const v = next === 'en' || next === 'fr' ? next : 'fr';
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* ignore */
    }
    setLangState(v);
  }, []);

  const t = useCallback(
    (path, vars) => {
      const raw = pickString(lang, path) ?? pickString('en', path) ?? path;
      return vars ? interpolate(raw, vars) : raw;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <AdminLanguageContext.Provider value={value}>{children}</AdminLanguageContext.Provider>;
}

/* Fast refresh: hook co-located with provider for this small admin app */
// eslint-disable-next-line react-refresh/only-export-components -- hook must live with provider
export function useAdminLanguage() {
  const ctx = useContext(AdminLanguageContext);
  if (!ctx) {
    throw new Error('useAdminLanguage must be used within AdminLanguageProvider');
  }
  return ctx;
}
