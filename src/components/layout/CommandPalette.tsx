"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Locale } from "@/lib/i18n/types";
import "./CommandPalette.css";

const COMMAND_DEFINITIONS = [
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

  const commands = COMMAND_DEFINITIONS.map(def => ({
    ...def,
    title: t.command_palette?.commands?.[def.key] || def.key,
  }));

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  const executeCommand = (cmd: (typeof commands)[0]) => {
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
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handlePaletteKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter" && filteredCommands.length > 0) {
        e.preventDefault();
        executeCommand(filteredCommands[selectedIndex]);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handlePaletteKeyDown);
    }
    return () => window.removeEventListener("keydown", handlePaletteKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, router]);

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
    <div className="cmd-palette-overlay" role="dialog" aria-label="Command Palette" aria-modal="true" onClick={(e) => {
      if (e.target === e.currentTarget) setIsOpen(false);
    }}>
      <div className="cmd-palette-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-search-bar">
          <i className="fa-solid fa-magnifying-glass cmd-search-icon"></i>
          <input 
            ref={inputRef}
            type="text" 
            className="cmd-input" 
            placeholder={t.command_palette?.search_placeholder || t.navbar.search_palette} 
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off" 
            spellCheck="false" 
          />
          <kbd className="cmd-esc-hint" onClick={() => setIsOpen(false)}>ESC</kbd>
        </div>
        
        <div className="cmd-results">
          {filteredCommands.length > 0 ? (
            <>
              <div className="cmd-section-label">
                {locale === "ar" ? "التنقل والميزات" : locale === "en" ? "Main Navigation" : "Navigasi Utama"}
              </div>
              {filteredCommands.map((cmd, index) => (
                <div 
                  key={cmd.id} 
                  className={`cmd-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <i className={`fa-solid ${cmd.icon} cmd-item-icon`}></i>
                  <span>{cmd.title}</span>
                  {index === selectedIndex && <kbd className="cmd-enter-hint">↵</kbd>}
                </div>
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
