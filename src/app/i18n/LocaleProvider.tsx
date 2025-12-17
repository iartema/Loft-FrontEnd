"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./locales/en";
import uk from "./locales/uk";

export type Locale = "en" | "uk";
type Translations = typeof en;

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
};

const translations: Record<Locale, Translations> = { en, uk };

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const STORAGE_KEY = "loft-lang";

const getNested = (obj: any, path: string[]) =>
  path.reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);

const detectInitialLocale = (): Locale => {
  if (typeof window === "undefined") return "uk";
  try {
    const cookieLang = document.cookie.match(/(?:^|; )lang=([^;]+)/)?.[1] as Locale | undefined;
    if (cookieLang === "en" || cookieLang === "uk") return cookieLang;
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "uk") return stored;
    const browser = navigator.language?.toLowerCase?.() ?? "uk";
    if (browser.startsWith("uk")) return "uk";
  } catch {
    // ignore
  }
  return "uk";
};

type LocaleProviderProps = { children: React.ReactNode; initialLocale?: Locale };

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? detectInitialLocale());

  useEffect(() => {
    try {
      document.documentElement.setAttribute("lang", locale);
    } catch {
      // ignore
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
      document.cookie = `lang=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.setAttribute("lang", next);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const value = getNested(translations[locale], key.split("."));
      if (typeof value === "string") return value;
      return fallback ?? key;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
