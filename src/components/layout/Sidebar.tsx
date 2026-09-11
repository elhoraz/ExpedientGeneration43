"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      setIsLoggedIn(event !== "SIGNED_OUT");
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const toggleSidebar = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    
    // Toggle state
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Sync with body class (CSS uses body.sidebar-closed)
    if (newState) {
      document.body.classList.remove("sidebar-closed");
      localStorage.setItem("expedient_sidebar", "open");
    } else {
      document.body.classList.add("sidebar-closed");
      localStorage.setItem("expedient_sidebar", "closed");
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("expedient-sidebar-toggle", { detail: { isOpen: newState } }));
    }
  };

  // Initialize sidebar state on mount
  useEffect(() => {
    const savedState = localStorage.getItem("expedient_sidebar");
    // Default to open if not set
    if (savedState === "closed") {
      setIsOpen(false);
      document.body.classList.add("sidebar-closed");
    } else {
      setIsOpen(true);
      document.body.classList.remove("sidebar-closed");
    }
  }, []);

  const { t } = useLanguage();

  // Public pages: accessible without login
  const publicNavItems = [
    { href: "/", icon: "fa-house", label: t.sidebar.home, tooltip: "Halaman Utama & Profil Pondok" },
    { href: "/beranda", icon: "fa-landmark", label: t.sidebar.museum, tooltip: "Museum Digital & Linimasa" },
    { href: "/direktori", icon: "fa-address-book", label: t.sidebar.directory, tooltip: "Buku Kontak Alumni" },
    { href: "/galeri", icon: "fa-film", label: t.sidebar.gallery, tooltip: "Arsip Foto & Video" },
  ];

  // Auth-only pages
  const authNavItems = [
    { href: "/radar", icon: "fa-map-location-dot", label: t.sidebar.radar, tooltip: "Peta Persebaran Alumni" },
    { href: "/syndicate", icon: "fa-briefcase", label: t.sidebar.business, tooltip: "Katalog Usaha Alumni" },
    { href: "/fitur", icon: "fa-cubes", label: t.sidebar.features, tooltip: "Menu & Layanan Alumni" },
    { href: "/panduan", icon: "fa-book-bookmark", label: t.sidebar.guide, tooltip: "Pusat Panduan & Bantuan", extraClass: "nav-item-panduan" },
  ];

  // Fitur sub-pages for active state detection
  const fiturPages = ["/fitur", "/photobooth", "/oracle", "/enigma", "/genesis", "/celestial", "/majlis", "/tarbiyah", "/baitul-maal", "/wasiat", "/multazam", "/kontemplasi", "/divine", "/nexus"];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/fitur") {
      return fiturPages.some(p => pathname?.startsWith(p));
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <button className={`menu-toggle hover-trigger ${isOpen ? 'active' : ''}`} id="btnMenuOpen" title="Panggil Panel" onClick={toggleSidebar}>
        <span className="line"></span>
        <span className="line short"></span>
      </button>

      <nav className={`sidebar no-select ${isOpen ? 'active' : ''}`} id="sidebarNav">
        <a href="#" className="nav-item hover-trigger" id="btnMenuClose" onClick={(e) => { e.preventDefault(); toggleSidebar(); }} data-tooltip="Sembunyikan Panel">
          <i className="fa-solid fa-compress"></i>
          <span className="nav-label">{t.sidebar.close}</span>
        </a>
        
        {/* Public navigation items */}
        {publicNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-item hover-trigger ${isActive(item.href) ? 'active' : ''}`} data-tooltip={item.tooltip} onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}>
            <i className={`fa-solid ${item.icon}`}></i>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}

        {/* Auth-only navigation items */}
        {isLoggedIn && authNavItems.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-item hover-trigger ${isActive(item.href) ? 'active' : ''} ${item.extraClass || ''}`} data-tooltip={item.tooltip} onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}>
            <i className={`fa-solid ${item.icon}`}></i>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
        
        <div style={{ flexGrow: 1 }} className="nav-spacer"></div>

        {/* Bottom: Profil (logged in) or Masuk (guest) */}
        {isLoggedIn ? (
          <Link href="/profil" className={`nav-item hover-trigger ${pathname?.startsWith("/profil") ? 'active' : ''}`} data-tooltip={t.sidebar.profile} onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}>
            <i className="fa-solid fa-circle-user"></i>
            <span className="nav-label">{t.sidebar.profile}</span>
          </Link>
        ) : isLoggedIn === false ? (
          <Link href="/login" className="nav-item hover-trigger" data-tooltip={t.sidebar.login} onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}>
            <i className="fa-solid fa-door-open"></i>
            <span className="nav-label">{t.sidebar.login}</span>
          </Link>
        ) : null}
      </nav>
    </>
  );
}
