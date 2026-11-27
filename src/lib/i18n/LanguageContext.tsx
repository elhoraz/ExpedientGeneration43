"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { flushSync } from "react-dom";
import { Locale, Direction, Dictionary, SUPPORTED_LOCALES, LanguageMeta } from "./types";
import { idDictionary } from "./dictionaries/id";
import { getDictionary, loadDictionary } from "./index";

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
  const [dictionary, setDictionary] = useState<Dictionary>(() => idDictionary);

  // Initialize from localStorage on mount cleanly (single fetch, atomic swap after dict resolves)
  useEffect(() => {
    let active = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "ar") {
        loadDictionary(saved)
          .then((dict) => {
            if (!active) return;
            setDictionary(dict);
            setLocaleState(saved);
          })
          .catch(() => {
            if (!active) return;
            setDictionary(idDictionary);
            setLocaleState("id");
          });
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
    return () => {
      active = false;
    };
  }, []);

  // Ensure dictionary stays aligned if locale state changes by any means
  useEffect(() => {
    let active = true;
    if (locale === "id") {
      setDictionary(idDictionary);
      return;
    }
    const cached = getDictionary(locale);
    if (cached !== idDictionary) {
      setDictionary(cached);
      return;
    }
    loadDictionary(locale)
      .then((dict) => {
        if (active) setDictionary(dict);
      })
      .catch(() => {
        if (active) {
          setDictionary(idDictionary);
          setLocaleState("id");
        }
      });
    return () => {
      active = false;
    };
  }, [locale]);

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

  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === locale) return;

    const applySwitch = (targetDict: Dictionary) => {
      if (typeof document !== "undefined") {
        const doc = document as any;
        if (typeof doc.startViewTransition === "function") {
          doc.startViewTransition(() => {
            flushSync(() => {
              setDictionary(targetDict);
              setLocaleState(newLocale);
            });
          });
          return;
        }

        document.documentElement.classList.add("lang-switching");
        setTimeout(() => {
          setDictionary(targetDict);
          setLocaleState(newLocale);
          requestAnimationFrame(() => {
            setTimeout(() => {
              document.documentElement.classList.remove("lang-switching");
            }, 60);
          });
        }, 120);
      } else {
        setDictionary(targetDict);
        setLocaleState(newLocale);
      }
    };

    if (newLocale === "id") {
      applySwitch(idDictionary);
      return;
    }

    const cached = getDictionary(newLocale);
    if (cached !== idDictionary) {
      applySwitch(cached);
      return;
    }

    loadDictionary(newLocale)
      .then((dict) => applySwitch(dict))
      .catch(() => {
        // Keep current locale if chunk failed to load offline
      });
  }, [locale]);

  const meta = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES.id;
  const isRTL = meta.dir === "rtl";

  const translate = useCallback((path: string, fallback?: string): string => {
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
  }, [dictionary]);

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
    [locale, setLocale, dictionary, meta, isRTL, translate]
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
    const defaultDict = idDictionary;
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
