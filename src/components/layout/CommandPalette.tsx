"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Locale } from "@/lib/i18n/types";
import "./CommandPalette.css";

const COMMAND_DEFINITIONS = [
  { id: "fitur", key: "fitur", url: "/fitur", icon: "fa-cubes" },
  { id: "beranda", key: "beranda", url: "/beranda", icon: "fa-landmark" },
  { id: "direktori", key: "direktori", url: "/direktori", icon: "fa-address-book" },
  { id: "galeri", key: "galeri", url: "/galeri", icon: "fa-photo-film" },
  { id: "sovereign", key: "sovereign", url: "/sovereign", icon: "fa-id-card" },
  { id: "oracle", key: "oracle", url: "/oracle", icon: "fa-camera-retro" },
  { id: "enigma", key: "enigma", url: "/enigma", icon: "fa-book-bookmark" },
  { id: "radar", key: "radar", url: "/radar", icon: "fa-map-location-dot" },
  { id: "syndicate", key: "syndicate", url: "/syndicate", icon: "fa-briefcase" },
  { id: "majlis", key: "majlis", url: "/majlis", icon: "fa-gavel" },
  { id: "baitul", key: "baitul", url: "/baitul-maal", icon: "fa-hand-holding-dollar" },
  { id: "tarbiyah", key: "tarbiyah", url: "/tarbiyah", icon: "fa-user-graduate" },
  { id: "multazam", key: "multazam", url: "/multazam", icon: "fa-kaaba" },
  { id: "wasiat", key: "wasiat", url: "/wasiat", icon: "fa-scroll" },
  { id: "kontemplasi", key: "kontemplasi", url: "/kontemplasi", icon: "fa-brain" },
  { id: "celestial", key: "celestial", url: "/celestial", icon: "fa-star" },
  { id: "genesis", key: "genesis", url: "/genesis", icon: "fa-monument" },
  { id: "nexus", key: "nexus", url: "/nexus", icon: "fa-network-wired" },
  { id: "asmaul-husna", key: "asmaul_husna", url: "/asmaul-husna", icon: "fa-certificate" },
  { id: "matsurat", key: "matsurat", url: "/matsurat", icon: "fa-hands-praying" },
  { id: "mahfuzhat", key: "mahfuzhat", url: "/mahfuzhat", icon: "fa-feather-pointed" },
  { id: "sirah", key: "sirah", url: "/sirah", icon: "fa-map-location-dot" },
  { id: "panduan", key: "panduan", url: "/panduan", icon: "fa-book-bookmark" },
  { id: "help-guide", key: "help_guide", url: "action:open-guide", icon: "fa-circle-question" },
  { id: "profile", key: "profile", url: "/profil", icon: "fa-circle-user" },
  { id: "admin", key: "admin", url: "/admin", icon: "fa-shield-halved" },
  { id: "lang-id", key: "lang_id", url: "lang:id", icon: "fa-globe" },
  { id: "lang-ar", key: "lang_ar", url: "lang:ar", icon: "fa-globe" },
  { id: "lang-en", key: "lang_en", url: "lang:en", icon: "fa-globe" },
];

export default function CommandPalette() {
  const { t, locale, setLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(
    () =>
      COMMAND_DEFINITIONS.map((def) => ({
        ...def,
        title: t.command_palette?.commands?.[def.key] || def.key,
      })),
    [t]
  );

  const filteredCommands = useMemo(
    () =>
      commands.filter((cmd) =>
        cmd.title.toLowerCase().includes(query.toLowerCase())
      ),
    [commands, query]
  );

  const executeCommand = useCallback(
    (cmd: (typeof commands)[0]) => {
      if (cmd.url === "action:open-guide") {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent("expedient-open-guide"));
        return;
      }
      if (cmd.url.startsWith("lang:")) {
        const targetLang = cmd.url.slice(5) as Locale;
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(15);
        }
        setLocale(targetLang);
      } else {
        router.push(cmd.url);
      }
      setIsOpen(false);
    },
    [router, setLocale]
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    const handleOpenEvent = () => setIsOpen(true);

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("expedient-open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("expedient-open-command-palette", handleOpenEvent);
    };
  }, []);

  useEffect(() => {
    const handlePaletteKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown" && filteredCommands.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp" && filteredCommands.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter" && filteredCommands.length > 0) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex] || filteredCommands[0]);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handlePaletteKeyDown);
    }
    return () => window.removeEventListener("keydown", handlePaletteKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, executeCommand]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="cmd-palette-overlay"
      role="dialog"
      aria-label={t.navbar.search_palette}
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="cmd-palette-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-search-bar">
          <i className="fa-solid fa-magnifying-glass cmd-search-icon" aria-hidden="true"></i>
          <input
            ref={inputRef}
            type="text"
            className="cmd-input"
            placeholder={t.command_palette?.search_placeholder || t.navbar.search_palette}
            aria-label={t.command_palette?.search_placeholder || t.navbar.search_palette}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            className="cmd-esc-hint"
            onClick={() => setIsOpen(false)}
            aria-label={t.common.close}
          >
            ESC
          </button>
        </div>

        <div className="cmd-quick-strip">
          <div className="cmd-quick-langs" role="group" aria-label={locale === "ar" ? "اللغة" : locale === "en" ? "Language" : "Bahasa"}>
            {(["id", "en", "ar"] as Locale[]).map((langCode) => (
              <button
                key={langCode}
                type="button"
                className={`cmd-quick-pill ${locale === langCode ? "active" : ""}`}
                aria-pressed={locale === langCode}
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
                  setLocale(langCode);
                }}
              >
                {langCode.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="cmd-quick-help"
            onClick={() => {
              setIsOpen(false);
              window.dispatchEvent(new CustomEvent("expedient-open-guide"));
            }}
          >
            <i className="fa-solid fa-circle-question" aria-hidden="true"></i>
            <span>{locale === "ar" ? "مساعدة الصفحة" : locale === "en" ? "Page Guide" : "Bantuan"}</span>
          </button>
        </div>

        <div className="cmd-results">
          {filteredCommands.length > 0 ? (
            <>
              <div className="cmd-section-label">
                {locale === "ar" ? "التنقل والميزات" : locale === "en" ? "Main Navigation" : "Navigasi Utama"}
              </div>
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  type="button"
                  className={`cmd-item ${index === selectedIndex ? "selected" : ""}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <i className={`fa-solid ${cmd.icon} cmd-item-icon`} aria-hidden="true"></i>
                  <span>{cmd.title}</span>
                  {index === selectedIndex && <kbd className="cmd-enter-hint" aria-hidden="true">↵</kbd>}
                </button>
              ))}
            </>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              {t.command_palette?.no_results || `Tidak ditemukan hasil untuk "${query}"`}
            </div>
          )}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> {locale === "ar" ? "تنقل" : locale === "en" ? "Navigate" : "Navigasi"}</span>
          <span><kbd>↵</kbd> {locale === "ar" ? "فتح" : locale === "en" ? "Open" : "Buka"}</span>
          <span><kbd>ESC</kbd> {locale === "ar" ? "إغلاق" : locale === "en" ? "Close" : "Tutup"}</span>
        </div>
      </div>
    </div>
  );
}
