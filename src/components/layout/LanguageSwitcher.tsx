"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Locale, SUPPORTED_LOCALES } from "@/lib/i18n/types";

interface LanguageSwitcherProps {
  variant?: "pill" | "minimal" | "sidebar";
  className?: string;
}

export default function LanguageSwitcher({ variant = "pill", className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, meta } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (code: Locale) => {
    setLocale(code);
    setIsOpen(false);
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
    <div className={`lang-switcher-container ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="lang-switcher-btn hover-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Ganti Bahasa / Change Language / تغيير اللغة"
      >
        <span className="lang-flag-current">{meta.flag}</span>
        <span className="lang-code-current">{locale.toUpperCase()}</span>
        <i className={`fa-solid fa-chevron-down lang-chevron ${isOpen ? "rotate" : ""}`}></i>
      </button>

      {isOpen && (
        <div className="lang-dropdown-menu" role="listbox">
          {localesList.map((item) => {
            const isSelected = locale === item.code;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`lang-dropdown-item ${isSelected ? "active" : ""}`}
                onClick={() => handleSelect(item.code)}
              >
                <span className="lang-item-flag">{item.flag}</span>
                <span className="lang-item-name">{item.nativeLabel}</span>
                {isSelected && <i className="fa-solid fa-check lang-check-icon"></i>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
