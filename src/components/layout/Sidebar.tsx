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

  const { t, locale } = useLanguage();

  // Public pages: accessible without login
  // On mobile 5-tab bar: Beranda · Direktori · Galeri · Fitur · Profil
  const publicNavItems: Array<{ href: string; icon: string; label: string; tooltip: string; extraClass?: string }> = [
    { href: "/", icon: "fa-house", label: t.sidebar.home, tooltip: t.sidebar.tooltip_home, extraClass: isLoggedIn ? "mobile-hide-nav" : "" },
    { href: "/beranda", icon: "fa-landmark", label: t.sidebar.museum, tooltip: t.sidebar.tooltip_museum },
    { href: "/direktori", icon: "fa-address-book", label: t.sidebar.directory, tooltip: t.sidebar.tooltip_directory },
    { href: "/galeri", icon: "fa-film", label: t.sidebar.gallery, tooltip: t.sidebar.tooltip_gallery },
  ];

  // Auth-only desktop rail pages + Fitur core tab (Panduan stays accessible publicly on desktop)
  const authNavItems: Array<{ href: string; icon: string; label: string; tooltip: string; authOnly?: boolean; extraClass?: string }> = [
    { href: "/radar", icon: "fa-map-location-dot", label: t.sidebar.radar, tooltip: t.sidebar.tooltip_radar, authOnly: true, extraClass: "mobile-hide-nav" },
    { href: "/syndicate", icon: "fa-briefcase", label: t.sidebar.business, tooltip: t.sidebar.tooltip_business, authOnly: true, extraClass: "mobile-hide-nav" },
    { href: "/fitur", icon: "fa-cubes", label: t.sidebar.features, tooltip: t.sidebar.tooltip_features, authOnly: true },
    { href: "/panduan", icon: "fa-book-bookmark", label: t.sidebar.guide, tooltip: t.sidebar.tooltip_guide, authOnly: false, extraClass: "nav-item-panduan mobile-hide-nav" },
  ];

  // Fitur sub-pages for active state detection
  const fiturPages = [
    "/fitur",
    "/quran",
    "/matsurat",
    "/mahfuzhat",
    "/asmaul-husna",
    "/sirah",
    "/tasbih",
    "/kiblat",
    "/khatam",
    "/photobooth",
    "/oracle",
    "/enigma",
    "/genesis",
    "/celestial",
    "/majlis",
    "/tarbiyah",
    "/baitul-maal",
    "/wasiat",
    "/multazam",
    "/kontemplasi",
    "/divine",
    "/nexus",
    "/event",
    "/buku-tamu",
    "/birthday",
  ];

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
      <button
        type="button"
        className={`menu-toggle hover-trigger ${isOpen ? 'active' : ''}`}
        id="btnMenuOpen"
        title={t.sidebar.open_panel_title}
        aria-label={t.sidebar.open_panel_title}
        aria-expanded={isOpen}
        aria-controls="sidebarNav"
        onClick={toggleSidebar}
      >
        <span className="line"></span>
        <span className="line short"></span>
      </button>

      <nav className={`sidebar no-select ${isOpen ? 'active' : ''}`} id="sidebarNav" role="navigation" aria-label="Main Navigation">
        <button
          type="button"
          className="nav-item hover-trigger"
          id="btnMenuClose"
          aria-label={t.sidebar.tooltip_hide || t.sidebar.close}
          aria-expanded={isOpen}
          aria-controls="sidebarNav"
          onClick={toggleSidebar}
          data-tooltip={t.sidebar.tooltip_hide}
        >
          <span className="nav-icon-pill">
            <i className="fa-solid fa-compress" aria-hidden="true"></i>
          </span>
          <span className="nav-label">{t.sidebar.close}</span>
        </button>

        {/* Public navigation items */}
        {publicNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item hover-trigger ${isActive(item.href) ? 'active' : ''} ${item.extraClass || ''}`}
            data-tooltip={item.tooltip}
            aria-current={isActive(item.href) ? "page" : undefined}
            onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}
          >
            <span className="nav-icon-pill">
              <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
            </span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}

        {/* Auth / Feature navigation items */}
        {authNavItems
          .filter((item) => !item.authOnly || isLoggedIn)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item hover-trigger ${isActive(item.href) ? 'active' : ''} ${item.extraClass || ''}`}
              data-tooltip={item.tooltip}
              aria-current={isActive(item.href) ? "page" : undefined}
              onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}
            >
              <span className="nav-icon-pill">
                <i className={`fa-solid ${item.icon}`} aria-hidden="true"></i>
              </span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}

        <div style={{ flexGrow: 1 }} className="nav-spacer"></div>

        {/* Bottom: Profil (logged in) or Masuk (guest) */}
        {isLoggedIn ? (
          <Link
            href="/profil"
            className={`nav-item hover-trigger ${pathname?.startsWith("/profil") ? 'active' : ''}`}
            data-tooltip={t.sidebar.profile}
            aria-current={pathname?.startsWith("/profil") ? "page" : undefined}
            onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}
          >
            <span className="nav-icon-pill">
              <i className="fa-solid fa-circle-user" aria-hidden="true"></i>
            </span>
            <span className="nav-label">{t.sidebar.profile}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className={`nav-item hover-trigger ${pathname?.startsWith("/login") ? 'active' : ''}`}
            data-tooltip={t.sidebar.login}
            aria-current={pathname?.startsWith("/login") ? "page" : undefined}
            onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}
          >
            <span className="nav-icon-pill">
              <i className="fa-solid fa-door-open" aria-hidden="true"></i>
            </span>
            <span className="nav-label">{t.sidebar.login}</span>
          </Link>
        )}
      </nav>
    </>
  );
}
