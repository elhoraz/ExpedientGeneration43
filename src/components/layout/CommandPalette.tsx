"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./CommandPalette.css";

const COMMANDS = [
  { id: "home", title: "Beranda Utama", url: "/beranda", icon: "fa-landmark" },
  { id: "dir", title: "Direktori Alumni", url: "/direktori", icon: "fa-address-book" },
  { id: "galeri", title: "Galeri & Arsip Kenangan", url: "/galeri", icon: "fa-film" },
  { id: "chat", title: "Kotak Pesan", url: "/chat", icon: "fa-envelope" },
  { id: "lounge", title: "Ruang Obrolan Angkatan", url: "/chat/lounge", icon: "fa-comments" },
  { id: "sovereign", title: "Kartu Alumni 3D (KTA)", url: "/sovereign", icon: "fa-id-card" },
  { id: "oracle", title: "Kamera Aura Positif", url: "/oracle", icon: "fa-camera-retro" },
  { id: "enigma", title: "Catatan Kenangan Pribadi", url: "/enigma", icon: "fa-book-bookmark" },
  { id: "radar", title: "Peta Persebaran Alumni", url: "/radar", icon: "fa-map-location-dot" },
  { id: "syndicate", title: "Katalog Bisnis & Usaha Alumni", url: "/syndicate", icon: "fa-briefcase" },
  { id: "majlis", title: "Majlis Kajian & Suara", url: "/majlis", icon: "fa-gavel" },
  { id: "baitul", title: "Kas & Donasi (Baitul Maal)", url: "/baitul-maal", icon: "fa-hand-holding-dollar" },
  { id: "tarbiyah", title: "Jejaring Karir & Mentoring", url: "/tarbiyah", icon: "fa-user-graduate" },
  { id: "multazam", title: "Agenda Acara & Dinding Doa", url: "/multazam", icon: "fa-kaaba" },
  { id: "wasiat", title: "Kotak Pesan & Wasiat", url: "/wasiat", icon: "fa-scroll" },
  { id: "kontemplasi", title: "Ruang Dzikir & Ketenangan", url: "/kontemplasi", icon: "fa-brain" },
  { id: "celestial", title: "Mutiara Hikmah & Nasihat", url: "/celestial", icon: "fa-star" },
  { id: "genesis", title: "Sejarah & Filosofi Angkatan", url: "/genesis", icon: "fa-monument" },
  { id: "nexus", title: "Pencocok Minat & Domisili", url: "/nexus", icon: "fa-network-wired" },
  { id: "panduan", title: "Pusat Panduan & Bantuan Alumni", url: "/panduan", icon: "fa-book-bookmark" },
  { id: "profile", title: "Profil Saya", url: "/profil", icon: "fa-circle-user" },
  { id: "admin", title: "Panel Admin Angkatan", url: "/admin", icon: "fa-shield-halved" },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Cukup set true, jangan di-toggle untuk menghindari double trigger
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
        router.push(filteredCommands[selectedIndex].url);
        setIsOpen(false);
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
            placeholder="Cari halaman, fitur..." 
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
              <div className="cmd-section-label">Navigasi Utama</div>
              {filteredCommands.map((cmd, index) => (
                <div 
                  key={cmd.id} 
                  className={`cmd-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => {
                    router.push(cmd.url);
                    setIsOpen(false);
                  }}
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
              Tidak ditemukan hasil untuk "{query}"
            </div>
          )}
        </div>
        
        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> Navigasi</span>
          <span><kbd>↵</kbd> Buka</span>
          <span><kbd>ESC</kbd> Tutup</span>
        </div>
      </div>
    </div>
  );
}
