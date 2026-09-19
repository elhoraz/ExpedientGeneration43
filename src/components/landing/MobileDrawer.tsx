"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
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
            aria-label="Tutup Menu"
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
            <span className="drawer-section-label">NAVIGASI LANDING PAGE</span>
            <div className="drawer-links-list">
              <a href="#beranda" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-house"></i>
                <span>Beranda Utama</span>
              </a>
              <a href="#sejarah" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-landmark"></i>
                <span>Sejarah Pondok 1982</span>
              </a>
              <a href="#nasehat" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-feather-pointed"></i>
                <span>Wejangan Asatidz</span>
              </a>
              <a href="#almamater" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-mosque"></i>
                <span>Almamater &amp; Video Profil</span>
              </a>
              <a href="#aplikasi" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-brands fa-android"></i>
                <span>Aplikasi Mobile (.APK)</span>
              </a>
              <a href="#ekosistem" className="drawer-nav-link" onClick={onClose}>
                <i className="fa-solid fa-cubes"></i>
                <span>Ekosistem Digital 43</span>
              </a>
            </div>
          </div>

          {/* Section 2: Fitur Islami & Utilitas Terbuka (Tanpa Perlu Login!) */}
          <div className="drawer-nav-section">
            <div className="drawer-section-badge">
              <i className="fa-solid fa-lock-open"></i>
              <span>BEBAS AKSES (TANPA PERLU LOGIN)</span>
            </div>

            <div className="drawer-features-grid">
              <Link href="/quran" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-emerald">
                  <i className="fa-solid fa-book-quran"></i>
                </div>
                <div>
                  <strong>Al-Qur&apos;an 30 Juz</strong>
                  <span>Mushaf Al-Hufaz 15 Baris &amp; Murottal 6 Qari</span>
                </div>
              </Link>

              <Link href="/matsurat" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-teal">
                  <i className="fa-solid fa-hands-praying"></i>
                </div>
                <div>
                  <strong>Al-Ma&apos;tsurat</strong>
                  <span>Dzikir Pagi &amp; Petang Sughro-Kubro</span>
                </div>
              </Link>

              <Link href="/asmaul-husna" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-gold">
                  <i className="fa-solid fa-certificate"></i>
                </div>
                <div>
                  <strong>99 Asmaul Husna</strong>
                  <span>Nama-nama Indah Allah SWT &amp; Khasiat</span>
                </div>
              </Link>

              <Link href="/mahfuzhat" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-blue">
                  <i className="fa-solid fa-feather"></i>
                </div>
                <div>
                  <strong>Mahfuzhat Santri</strong>
                  <span>Mutiara Kata Hikmah Gontory &amp; Terjemahan</span>
                </div>
              </Link>

              <Link href="/kiblat" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-amber">
                  <i className="fa-solid fa-compass"></i>
                </div>
                <div>
                  <strong>Kiblat &amp; Waktu Sholat</strong>
                  <span>Arah Kompas Akurat &amp; Jadwal Adzan</span>
                </div>
              </Link>

              <Link href="/tasbih" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-purple">
                  <i className="fa-solid fa-gem"></i>
                </div>
                <div>
                  <strong>Tasbih Digital</strong>
                  <span>Penghitung Dzikir Haptic Interaktif</span>
                </div>
              </Link>

              <Link href="/sirah" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-orange">
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <div>
                  <strong>Sirah Nabawiyah</strong>
                  <span>Napak Tilas Kehidupan Rasulullah SAW</span>
                </div>
              </Link>

              <Link href="/photobooth" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-rose">
                  <i className="fa-solid fa-camera-retro"></i>
                </div>
                <div>
                  <strong>Photobooth Santri</strong>
                  <span>Cetak Foto Strip Retro Arrisalah 43</span>
                </div>
              </Link>

              <Link href="/download" className="drawer-feature-card" onClick={onClose}>
                <div className="drawer-feat-icon icon-green">
                  <i className="fa-brands fa-android"></i>
                </div>
                <div>
                  <strong>Unduh App Android (.APK)</strong>
                  <span>Instalasi Ringan &amp; Akses Offline</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Section 3: Portal Anggota / Alumni */}
          <div className="drawer-nav-section">
            <span className="drawer-section-label">PORTAL ALUMNI EXPEDIENT 43</span>
            <div className="drawer-auth-buttons">
              <Link href="/login" className="drawer-btn-login" onClick={onClose}>
                <i className="fa-solid fa-circle-user"></i>
                <span>Masuk Akun Anggota</span>
              </Link>

              <Link href="/beranda" className="drawer-btn-museum" onClick={onClose}>
                <i className="fa-solid fa-landmark"></i>
                <span>Jelajahi Museum Digital</span>
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
