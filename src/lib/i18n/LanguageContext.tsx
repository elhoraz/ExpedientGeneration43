"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { flushSync } from "react-dom";
import { Locale, Direction, Dictionary, SUPPORTED_LOCALES, LanguageMeta } from "./types";
import { DICTIONARIES, getDictionary } from "./index";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  dir: Direction;
  isRTL: boolean;
  meta: LanguageMeta;
  t: Dictionary;
  translate: (path: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "expedient_locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage or cookie on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && (saved === "id" || saved === "en" || saved === "ar")) {
        setLocaleState(saved);
      } else {
        // Check navigator language if not set
        const browserLang = navigator.language?.toLowerCase() || "";
        if (browserLang.startsWith("ar")) {
          setLocaleState("ar");
        } else if (browserLang.startsWith("en")) {
          setLocaleState("en");
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Sync document attributes (lang, dir, class) whenever locale changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    const isArabic = locale === "ar";
    const dir: Direction = isArabic ? "rtl" : "ltr";

    document.documentElement.lang = locale;
    document.documentElement.dir = dir;

    if (isArabic) {
      document.documentElement.classList.add("rtl-mode");
      document.body.classList.add("font-arabic");
    } else {
      document.documentElement.classList.remove("rtl-mode");
      document.body.classList.remove("font-arabic");
    }

    try {
      localStorage.setItem(STORAGE_KEY, locale);
      document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    if (typeof document !== "undefined") {
      const doc = document as any;
      // 1. If View Transitions API is natively supported, use it for silky smooth cross-fade
      if (typeof doc.startViewTransition === "function") {
        doc.startViewTransition(() => {
          flushSync(() => {
            setLocaleState(newLocale);
          });
        });
        return;
      }

      // 2. Hardware-accelerated CSS dissolve transition fallback
      document.documentElement.classList.add("lang-switching");
      setTimeout(() => {
        setLocaleState(newLocale);
        requestAnimationFrame(() => {
          setTimeout(() => {
            document.documentElement.classList.remove("lang-switching");
          }, 60);
        });
      }, 120);
    } else {
      setLocaleState(newLocale);
    }
  };

  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const meta = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.id;
  const isRTL = meta.dir === "rtl";

  const translate = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let curr: any = dictionary;
    for (const k of keys) {
      if (curr && typeof curr === "object" && k in curr) {
        curr = curr[k];
      } else {
        return fallback || path;
      }
    }
    return typeof curr === "string" ? curr : (fallback || path);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      setLocale,
      dir: meta.dir,
      isRTL,
      meta,
      t: dictionary,
      translate,
    }),
    [locale, dictionary, meta, isRTL]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback if rendered outside provider during SSR/tests
    const defaultDict = DICTIONARIES.id;
    return {
      locale: "id",
      setLocale: () => {},
      dir: "ltr",
      isRTL: false,
      meta: SUPPORTED_LOCALES.id,
      t: defaultDict,
      translate: (path: string, fallback?: string) => fallback || path,
    };
  }
  return ctx;
}
