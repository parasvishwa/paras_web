'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'hi' | 'mr' | 'gu';

const STORAGE_KEY = 'gaubook_locale';
const DEFAULT_LOCALE: Locale = 'en';

export const LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English',  nativeLabel: 'English'    },
  { code: 'hi', label: 'Hindi',    nativeLabel: 'हिंदी'       },
  { code: 'mr', label: 'Marathi',  nativeLabel: 'मराठी'       },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી'     },
];

type Messages = Record<string, string>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    const mod = await import(`./messages/${locale}.json`);
    return mod.default as Messages;
  } catch {
    if (locale !== DEFAULT_LOCALE) {
      const fallback = await import(`./messages/${DEFAULT_LOCALE}.json`);
      return fallback.default as Messages;
    }
    return {};
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY)
      : null) as Locale | null;
    const initial = saved && LOCALES.some(l => l.code === saved) ? saved : DEFAULT_LOCALE;
    setLocaleState(initial);
    loadMessages(initial).then(setMessages);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, l);
    loadMessages(l).then(setMessages);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let msg = messages[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          msg = msg.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        });
      }
      return msg;
    },
    [messages],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
