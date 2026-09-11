"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n/types";

interface LanguageSwitcherProps {
  variant?: "pill" | "minimal" | "sidebar";
  className?: string;
}

export default function LanguageSwitcher({ variant = "pill", className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const cycleLanguage = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    const next: Locale = locale === "id" ? "ar" : locale === "ar" ? "en" : "id";
    setLocale(next);
  };

  const localesList = Object.values(SUPPORTED_LOCALES);

  if (variant === "sidebar") {
    return (
      <div className={`lang-sidebar-wrapper ${className}`}>
        <div className="lang-sidebar-label">
          <i className="fa-solid fa-language"></i>
          <span>Bahasa / اللغة</span>
        </div>
        <div className="lang-sidebar-pills">
          {localesList.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`lang-sidebar-pill ${locale === item.code ? "active" : ""}`}
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) {
                  navigator.vibrate(10);
                }
                setLocale(item.code);
              }}
              title={item.nativeLabel}
            >
              <span className="lang-flag">{item.flag}</span>
              <span className="lang-code">{item.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`theme-widget lang-widget hover-trigger ${className}`}
      id="btnLang"
      title="Ganti Bahasa / Switch Language (ID → AR → EN)"
      onClick={cycleLanguage}
      suppressHydrationWarning
    >
      <div className="icon-orb">
        <i className="fa-solid fa-globe" id="langIcon"></i>
      </div>
      <span className="widget-text" id="langText">{locale.toUpperCase()}</span>
    </button>
  );
}
