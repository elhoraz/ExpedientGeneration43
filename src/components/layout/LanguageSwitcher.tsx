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
            aria-label={item.nativeLabel}
            aria-pressed={locale === item.code}
            style={{
              padding: "8px 14px",
              minHeight: "44px",
              borderRadius: "12px",
              border: locale === item.code ? "1px solid var(--gold-main, #d4af37)" : "1px solid var(--glass-border)",
              background: locale === item.code ? "rgba(212, 175, 55, 0.16)" : "var(--surface-raised, rgba(255, 255, 255, 0.04))",
              color: locale === item.code ? "var(--gold-main, #d4af37)" : "var(--text-secondary)",
              fontSize: "0.8rem",
              fontWeight: locale === item.code ? 700 : 500,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease",
            }}
          >
            <span aria-hidden="true">{item.flag}</span>
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
            aria-pressed={locale === item.code}
            className="cursor-bind"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 8px",
              minHeight: "64px",
              borderRadius: "14px",
              background: locale === item.code ? "rgba(212, 175, 55, 0.15)" : "var(--surface-raised, rgba(255, 255, 255, 0.03))",
              border: locale === item.code ? "1.5px solid var(--gold-main, #d4af37)" : "1px solid var(--glass-border)",
              color: locale === item.code ? "var(--gold-main, #d4af37)" : "var(--text-primary)",
              cursor: "pointer",
              transition: "background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease",
              textAlign: "center"
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "1.6rem", marginBottom: "4px" }}>{item.flag}</span>
            <span style={{ fontWeight: 700, fontSize: "0.82rem" }}>{item.nativeLabel}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>{item.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={`lang-sidebar-wrapper ${className}`}>
        <div className="lang-sidebar-label">
          <i className="fa-solid fa-language" aria-hidden="true"></i>
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
              aria-label={item.nativeLabel}
              aria-pressed={locale === item.code}
            >
              <span className="lang-flag" aria-hidden="true">{item.flag}</span>
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
      className={`lang-widget hover-trigger ${className}`}
      title={locale === "ar" ? "تغيير اللغة (ID / AR / EN)" : locale === "en" ? "Switch Language (ID / AR / EN)" : "Ganti Bahasa (ID / AR / EN)"}
      aria-label={locale === "ar" ? "تغيير اللغة" : locale === "en" ? "Switch Language" : "Ganti Bahasa"}
      onClick={cycleLanguage}
      suppressHydrationWarning
    >
      <div className="icon-orb">
        <i className="fa-solid fa-globe lang-icon" aria-hidden="true"></i>
      </div>
      <span className="widget-text">{locale.toUpperCase()}</span>
    </button>
  );
}

