"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  // Public pages: accessible without login
  const publicNavItems = [
    { href: "/beranda", icon: "fa-landmark", label: "Beranda", tooltip: "Grand Exhibition" },
    { href: "/direktori", icon: "fa-address-book", label: "Direktori", tooltip: "The Registry" },
    { href: "/galeri", icon: "fa-film", label: "Galeri", tooltip: "The Vault" },
  ];

  // Auth-only pages
  const authNavItems = [
    { href: "/radar", icon: "fa-earth-asia", label: "Radar", tooltip: "Peta Persebaran" },
    { href: "/syndicate", icon: "fa-chess-knight", label: "Council", tooltip: "The Council" },
    { href: "/fitur", icon: "fa-gem", label: "Fitur", tooltip: "Fitur Eksekutif" },
  ];

  // Fitur sub-pages for active state detection
  const fiturPages = ["/fitur", "/photobooth", "/oracle", "/enigma", "/genesis", "/celestial", "/majlis", "/tarbiyah", "/baitul-maal", "/wasiat", "/multazam", "/kontemplasi", "/divine", "/nexus"];

  const isActive = (href: string) => {
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
          <span className="nav-label">Tutup</span>
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
          <Link key={item.href} href={item.href} className={`nav-item hover-trigger ${isActive(item.href) ? 'active' : ''}`} data-tooltip={item.tooltip} onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}>
            <i className={`fa-solid ${item.icon}`}></i>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
        
        <div style={{ flexGrow: 1 }} className="nav-spacer"></div>

        {/* Bottom: Profil (logged in) or Masuk (guest) */}
        {isLoggedIn ? (
          <Link href="/profil" className={`nav-item hover-trigger ${pathname?.startsWith("/profil") ? 'active' : ''}`} data-tooltip="Profil Saya" onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}>
            <i className="fa-solid fa-user-astronaut"></i>
            <span className="nav-label">Profil</span>
          </Link>
        ) : isLoggedIn === false ? (
          <Link href="/login" className="nav-item hover-trigger" data-tooltip="Masuk ke Portal" onClick={() => { if (navigator.vibrate) navigator.vibrate(10); }}>
            <i className="fa-solid fa-right-to-bracket"></i>
            <span className="nav-label">Masuk</span>
          </Link>
        ) : null}
      </nav>
    </>
  );
}
