"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  tooltip: string;
  authOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();
  const supabase = createClient();
  const { t, locale } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("nama_panggilan, nama_lengkap")
          .eq("id", user.id)
          .maybeSingle();
        if (data) {
          setUserName(data.nama_panggilan || data.nama_lengkap || "Santri");
        }
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("nama_panggilan, nama_lengkap")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data) {
          setUserName(data.nama_panggilan || data.nama_lengkap || "Santri");
        }
      } else {
        setUserName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Load collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("expedient_sidebar_collapsed");
      if (saved === "true") {
        setIsCollapsed(true);
        document.body.classList.add("sidebar-collapsed");
      }
    } catch {}
  }, []);

  const toggleCollapse = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (next) {
      document.body.classList.add("sidebar-collapsed");
      try { localStorage.setItem("expedient_sidebar_collapsed", "true"); } catch {}
    } else {
      document.body.classList.remove("sidebar-collapsed");
      try { localStorage.setItem("expedient_sidebar_collapsed", "false"); } catch {}
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("expedient-sidebar-toggle", { detail: { isCollapsed: next } }));
    }
  };

  const navGroups: NavGroup[] = [
    {
      title: locale === "ar" ? "الرئيسية" : locale === "en" ? "MAIN" : "UTAMA",
      items: [
        { href: "/beranda", icon: "fa-house", label: t.sidebar?.museum || "Beranda", tooltip: "Museum Digital & Linimasa" },
        { href: "/direktori", icon: "fa-address-book", label: t.sidebar?.directory || "Direktori", tooltip: "Buku Kontak Alumni" },
        { href: "/galeri", icon: "fa-photo-film", label: t.sidebar?.gallery || "Galeri", tooltip: "Arsip Foto & Video" },
      ],
    },
    {
      title: locale === "ar" ? "الكنوز الروحية" : locale === "en" ? "HERITAGE" : "KHAZANAH",
      items: [
        { href: "/quran", icon: "fa-book-quran", label: "Al-Qur'an", tooltip: "Al-Qur'an Digital & Doa" },
        { href: "/tarbiyah", icon: "fa-graduation-cap", label: "Tarbiyah", tooltip: "Tarbiyah & Nilai Kepesantrenan" },
        { href: "/mahfuzhat", icon: "fa-feather-pointed", label: "Mahfuzhat", tooltip: "Kata Mutiara & Mahfuzhat" },
        { href: "/sirah", icon: "fa-landmark-dome", label: "Sirah", tooltip: "Sirah Nabawiyah & Peta Jejak" },
      ],
    },
    {
      title: locale === "ar" ? "الشبكة والخدمات" : locale === "en" ? "NETWORK" : "JARINGAN",
      items: [
        { href: "/radar", icon: "fa-map-location-dot", label: t.sidebar?.radar || "Radar", tooltip: "Peta Persebaran Alumni", authOnly: true },
        { href: "/syndicate", icon: "fa-briefcase", label: t.sidebar?.business || "Syndicate", tooltip: "Jaringan Bisnis Alumni", authOnly: true },
        { href: "/fitur", icon: "fa-cubes", label: t.sidebar?.features || "Semua Fitur", tooltip: "Ekosistem Fitur Terpadu" },
      ],
    },
    {
      title: locale === "ar" ? "المساعدة" : locale === "en" ? "SUPPORT" : "BANTUAN",
      items: [
        { href: "/panduan", icon: "fa-circle-question", label: t.sidebar?.guide || "Panduan", tooltip: "Panduan Penggunaan Portal" },
      ],
    },
  ];

  const mobileDockItems = [
    { href: "/beranda", icon: "fa-house", label: t.sidebar?.museum || "Beranda" },
    { href: "/direktori", icon: "fa-address-book", label: t.sidebar?.directory || "Direktori" },
    { href: "/galeri", icon: "fa-photo-film", label: t.sidebar?.gallery || "Galeri" },
    { href: "/fitur", icon: "fa-cubes", label: t.sidebar?.features || "Fitur" },
    {
      href: isLoggedIn ? "/profil" : "/login",
      icon: isLoggedIn ? "fa-circle-user" : "fa-door-open",
      label: isLoggedIn ? (t.sidebar?.profile || "Profil") : (t.sidebar?.login || "Masuk"),
    },
  ];

  const isItemActive = (href: string) => {
    if (href === "/beranda") return pathname === "/beranda";
    if (href === "/fitur") return pathname === "/fitur";
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar (>= 1025px) */}
      <aside className="sidebar desktop-only no-select" id="sidebarNav" aria-label="Navigasi Utama">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link href="/beranda" className="sidebar-brand-link">
            <Image
              src="/icon-48.png"
              alt="Expedient 43"
              width={34}
              height={34}
              className="sidebar-logo"
              priority
            />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">EXPEDIENT</span>
              <span className="sidebar-brand-sub">ANGKATAN 43</span>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapse}
            title={isCollapsed ? "Perluas Menu" : "Ciutkan Menu"}
            aria-label={isCollapsed ? "Perluas Menu" : "Ciutkan Menu"}
          >
            <i className={`fa-solid ${isCollapsed ? "fa-angles-right" : "fa-angles-left"}`}></i>
          </button>
        </div>

        {/* Scrollable Nav Area */}
        <div className="sidebar-nav-scroll">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="nav-section">
              <span className="nav-section-title">{group.title}</span>
              {group.items.map((item) => {
                if (item.authOnly && !isLoggedIn) return null;
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${active ? "active" : ""}`}
                    data-tooltip={item.tooltip}
                    onClick={() => {
                      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
                    }}
                  >
                    <span className="nav-icon">
                      <i className={`fa-solid ${item.icon}`}></i>
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer (Desktop User Card) */}
        <div className="sidebar-footer">
          {isLoggedIn ? (
            <Link href="/profil" className="sidebar-user-card" title="Buka Profil Saya">
              <div className="sidebar-user-avatar">
                <i className="fa-solid fa-user"></i>
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{userName || "Alumni"}</span>
                <span className="sidebar-user-role">Santri Terverifikasi</span>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="sidebar-user-card" title="Masuk ke Ruang Anggota">
              <div className="sidebar-user-avatar">
                <i className="fa-solid fa-door-open"></i>
              </div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">Masuk Akun</span>
                <span className="sidebar-user-role">Akses Penuh Portal</span>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Dock (<= 1024px) */}
      <nav className="mobile-bottom-dock mobile-only no-select" aria-label="Navigasi Cepat Mobile">
        {mobileDockItems.map((item) => {
          const active = isItemActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-dock-btn ${active ? "active" : ""}`}
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
              }}
            >
              <span className="mobile-dock-icon">
                <i className={`fa-solid ${item.icon}`}></i>
              </span>
              <span className="mobile-dock-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
