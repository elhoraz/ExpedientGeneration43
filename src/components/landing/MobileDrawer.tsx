"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { t } = useLanguage();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-drawer-overlay" onClick={onClose}>
      <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-brand">
            <Image
              src="/images/logo-utuh.webp"
              alt="Logo Expedient 43"
              width={32}
              height={32}
              className="drawer-logo"
            />
            <div>
              <span className="drawer-title">EXPEDIENT 43</span>
              <span className="drawer-subtitle">ARRISALAH SLAHUNG</span>
            </div>
          </div>

          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label={t.drawer.close_aria}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Drawer Body Scroll */}
        <div className="drawer-body">
          {/* Quick Actions Row */}
          <div className="drawer-quick-actions">
            <LanguageSwitcher variant="pill" />
            <ThemeToggle />
          </div>

          {/* Section 1: Halaman Landing Anchor Links */}
          <div className="drawer-nav-section">
            <span className="drawer-section-label">{t.drawer.section_landing}</span>
            <div className="drawer-links-list">
              <a href="#beranda" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-house"></i>
                <span>{t.drawer.nav_home}</span>
              </a>
              <a href="#sejarah" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-landmark"></i>
                <span>{t.drawer.nav_sejarah}</span>
              </a>
              <a href="#nasehat" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-feather-pointed"></i>
                <span>{t.drawer.nav_nasehat}</span>
              </a>
              <a href="#almamater" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-mosque"></i>
                <span>{t.drawer.nav_almamater}</span>
              </a>
              <a href="#aplikasi" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-brands fa-android"></i>
                <span>{t.drawer.nav_apk}</span>
              </a>
              <a href="#ekosistem" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-cubes"></i>
                <span>{t.drawer.nav_ecosystem}</span>
              </a>
            </div>
          </div>

          {/* Section 2: Fitur Islami & Utilitas Terbuka (Tanpa Perlu Login!) */}
          <div className="drawer-nav-section">
            <div className="drawer-section-badge">
              <i className="fa-solid fa-lock-open"></i>
              <span>{t.drawer.section_free_badge}</span>
            </div>

            <div className="drawer-features-grid">
              <Link href="/quran" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-emerald">
                  <i className="fa-solid fa-book-quran"></i>
                </div>
                <div>
                  <strong>{t.drawer.quran_title}</strong>
                  <span>{t.drawer.quran_desc}</span>
                </div>
              </Link>

              <Link href="/matsurat" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-teal">
                  <i className="fa-solid fa-hands-praying"></i>
                </div>
                <div>
                  <strong>{t.drawer.matsurat_title}</strong>
                  <span>{t.drawer.matsurat_desc}</span>
                </div>
              </Link>

              <Link href="/asmaul-husna" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-gold">
                  <i className="fa-solid fa-certificate"></i>
                </div>
                <div>
                  <strong>{t.drawer.asmaul_title}</strong>
                  <span>{t.drawer.asmaul_desc}</span>
                </div>
              </Link>

              <Link href="/mahfuzhat" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-blue">
                  <i className="fa-solid fa-feather"></i>
                </div>
                <div>
                  <strong>{t.drawer.mahfuzhat_title}</strong>
                  <span>{t.drawer.mahfuzhat_desc}</span>
                </div>
              </Link>

              <Link href="/kiblat" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-amber">
                  <i className="fa-solid fa-compass"></i>
                </div>
                <div>
                  <strong>{t.drawer.kiblat_title}</strong>
                  <span>{t.drawer.kiblat_desc}</span>
                </div>
              </Link>

              <Link href="/tasbih" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-purple">
                  <i className="fa-solid fa-gem"></i>
                </div>
                <div>
                  <strong>{t.drawer.tasbih_title}</strong>
                  <span>{t.drawer.tasbih_desc}</span>
                </div>
              </Link>

              <Link href="/sirah" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-orange">
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <strong>{t.drawer.sirah_title}</strong>
                  <span>{t.drawer.sirah_desc}</span>
                </div>
              </Link>

              <Link href="/photobooth" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-rose">
                  <i className="fa-solid fa-camera-retro"></i>
                </div>
                <div>
                  <strong>{t.drawer.photobooth_title}</strong>
                  <span>{t.drawer.photobooth_desc}</span>
                </div>
              </Link>

              <Link href="/download" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-green">
                  <i className="fa-brands fa-android"></i>
                </div>
                <div>
                  <strong>{t.drawer.download_title}</strong>
                  <span>{t.drawer.download_desc}</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Section 3: Portal Anggota / Alumni */}
          <div className="drawer-nav-section">
            <span className="drawer-section-label">{t.drawer.section_portal}</span>
            <div className="drawer-auth-buttons">
              <Link href="/login" className="drawer-btn-login" onClick={onClose}>
                <i className="fa-solid fa-circle-user"></i>
                <span>{t.drawer.login_btn}</span>
              </Link>

              <Link href="/beranda" className="drawer-btn-museum" onClick={onClose}>
                <i className="fa-solid fa-landmark"></i>
                <span>{t.drawer.museum_btn}</span>
              </Link>

              <a
                href="https://www.instagram.com/expedientgeneration_/"
                target="_blank"
                rel="noopener noreferrer"
                className="drawer-btn-ig"
                onClick={onClose}
              >
                <i className="fa-brands fa-instagram"></i>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.82rem" }}>@expedientgeneration_</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.85, fontWeight: 500 }}>
                    The Successor of Islamic Glory
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <span>&copy; {new Date().getFullYear()} Expedient Generation 43</span>
          <span className="dot">•</span>
          <span>Arrisalah Slahung</span>
        </div>
      </div>
    </div>
  );
}
