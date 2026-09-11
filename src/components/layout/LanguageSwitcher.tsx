"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n/types";

interface LanguageSwitcherProps {
  variant?: "pill" | "minimal" | "sidebar" | "compact" | "cards";
  className?: string;
}

export default function LanguageSwitcher({ variant = "pill", className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const handleSelect = (code: Locale) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
    setLocale(code);
  };

  const cycleLanguage = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
    const next: Locale = locale === "id" ? "ar" : locale === "ar" ? "en" : "id";
    setLocale(next);
  };

  const localesList = Object.values(SUPPORTED_LOCALES);

  if (variant === "compact") {
    return (
      <div className={`lang-compact-group ${className}`} style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
        {localesList.map((item) => (
          <button
            key={item.code}
            type="button"
            className={`lang-pill-btn ${locale === item.code ? "active" : ""}`}
            onClick={() => handleSelect(item.code)}
            title={item.nativeLabel}
            style={{
              padding: "5px 12px",
              borderRadius: "20px",
              border: locale === item.code ? "1px solid var(--gold-premium, #d4af37)" : "1px solid var(--glass-border)",
              background: locale === item.code ? "rgba(212, 175, 55, 0.22)" : "rgba(255, 255, 255, 0.04)",
              color: locale === item.code ? "var(--gold-premium, #d4af37)" : "var(--text-secondary)",
              fontSize: "0.78rem",
              fontWeight: locale === item.code ? 700 : 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.2s ease",
              boxShadow: locale === item.code ? "0 0 12px rgba(212, 175, 55, 0.25)" : "none"
            }}
          >
            <span>{item.flag}</span>
            <span>{item.nativeLabel}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={`lang-cards-grid ${className}`} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {localesList.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => handleSelect(item.code)}
            className="cursor-bind"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 8px",
              borderRadius: "14px",
              background: locale === item.code ? "rgba(212, 175, 55, 0.15)" : "rgba(255, 255, 255, 0.03)",
              border: locale === item.code ? "1.5px solid var(--gold-premium, #d4af37)" : "1px solid var(--glass-border)",
              color: locale === item.code ? "var(--gold-premium, #d4af37)" : "var(--text-primary)",
              cursor: "pointer",
              transition: "all 0.25s ease",
              textAlign: "center"
            }}
          >
            <span style={{ fontSize: "1.6rem", marginBottom: "4px" }}>{item.flag}</span>
            <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{item.nativeLabel}</span>
            <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

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
              onClick={() => handleSelect(item.code)}
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

