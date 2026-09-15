"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getGelar, getBadgeColor, getGelarIcon } from "@/lib/gamification";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import "./fitur.css";

interface FiturClientProps {
  userProfile?: {
    id: string;
    nama_lengkap: string;
    nama_panggilan: string;
    role: string;
    foto_profil: string | null;
    prestise_points: number;
  } | null;
  birthdayWidget?: {
    today: any[];
    next: any | null;
  };
  kasWidget?: {
    totalKas: number;
    hasPaidThisMonth: boolean;
  };
  eventWidget?: {
    nearest: any | null;
  };
}

export default function FiturClient({
  userProfile,
  birthdayWidget = { today: [], next: null },
  kasWidget = { totalKas: 0, hasPaidThisMonth: false },
  eventWidget = { nearest: null },
}: FiturClientProps) {
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const { t } = useLanguage();
  const router = useRouter();

  // Desktop Category Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const points = userProfile?.prestise_points || 0;
  const gelar = getGelar(points);
  const badgeColor = getBadgeColor(points);
  const badgeIcon = getGelarIcon(points);
  const avatarUrl = getAvatarUrl(userProfile?.foto_profil, userProfile?.nama_panggilan || userProfile?.nama_lengkap || "A");

  // Format Kas
  const formatRupiah = (val: number) => {
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 })}jt`;
    }
    return `Rp ${val.toLocaleString('id-ID')}`;
  };

  // Event Countdown
  const nearestEvent = eventWidget?.nearest;
  let eventDaysLeft: number | null = null;
  let eventDateFormatted = "";
  if (nearestEvent?.event_date) {
    const evDate = new Date(nearestEvent.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = evDate.getTime() - today.getTime();
    eventDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    eventDateFormatted = evDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Handle Search Submission on Mobile Widget
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/direktori?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/direktori`);
    }
  };

  // Desktop Categories
  const CATEGORIES = [
    { id: "all", label: "Semua Fasilitas", icon: "fa-solid fa-layer-group" },
    { id: "social", label: "Sosial & Alumni", icon: "fa-solid fa-users" },
    { id: "kas", label: "Kas & Baitul Maal", icon: "fa-solid fa-hand-holding-dollar" },
    { id: "media", label: "Media & Kenangan", icon: "fa-solid fa-camera-retro" },
    { id: "spiritual", label: "Spiritual & Hikmah", icon: "fa-solid fa-kaaba" },
    { id: "explore", label: "Eksplorasi & Arsip", icon: "fa-solid fa-compass" },
  ];

  // Full Feature List for Desktop
  const ALL_FEATURES = [
    {
      id: "photobooth",
      category: "media",
      title: t.fitur.photobooth_title,
      desc: t.fitur.photobooth_desc,
      href: "/photobooth",
      icon: "fa-camera-retro",
      bg: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2564&auto=format&fit=crop",
      btnText: t.fitur.photobooth_btn,
      badge: "Populer",
    },
    {
      id: "kta",
      category: "social",
      title: t.fitur.kta_title,
      desc: t.fitur.kta_desc,
      href: "/sovereign",
      icon: "fa-id-card",
      bg: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      btnText: t.fitur.kta_btn,
      badge: "Eksklusif 3D",
    },
    {
      id: "scanner",
      category: "social",
      title: t.fitur.scanner_title,
      desc: t.fitur.scanner_desc,
      href: "/scanner",
      icon: "fa-qrcode",
      bg: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
      btnText: t.fitur.scanner_btn,
    },
    {
      id: "chat",
      category: "social",
      title: "Ruang Obrolan Alumni",
      desc: "Bilik silaturahmi langsung antar alumni angkatan, koordinasi kegiatan, dan obrolan santai.",
      href: "/chat",
      icon: "fa-comments",
      bg: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2670&auto=format&fit=crop",
      btnText: "Buka Obrolan",
      badge: "Real-time",
    },
    {
      id: "direktori",
      category: "social",
      title: "Direktori Angkatan",
      desc: "Buku induk digital kontak alumni, domisili, profil lengkap, dan sebaran karir sahabat seangkatan.",
      href: "/direktori",
      icon: "fa-address-book",
      bg: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2670&auto=format&fit=crop",
      btnText: "Buka Direktori",
    },
    {
      id: "baitul-maal",
      category: "kas",
      title: t.fitur.baitul_title,
      desc: t.fitur.baitul_desc,
      href: "/baitul-maal",
      icon: "fa-hand-holding-dollar",
      bg: "https://images.unsplash.com/photo-1579621970795-87facc2f976d?q=80&w=2670&auto=format&fit=crop",
      btnText: t.fitur.baitul_btn,
      badge: "Amanah Kas",
    },
    {
      id: "wasiat",
      category: "kas",
      title: t.fitur.wasiat_title,
      desc: t.fitur.wasiat_desc,
      href: "/wasiat",
      icon: "fa-scroll",
      bg: "https://images.unsplash.com/photo-1614064641913-a520f596a247?q=80&w=2574&auto=format&fit=crop",
      btnText: t.fitur.wasiat_btn,
    },
    {
      id: "event",
      category: "social",
      title: t.event.title,
      desc: t.event.subtitle,
      href: "/event",
      icon: "fa-calendar-days",
      bg: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2670&auto=format&fit=crop",
      btnText: t.fitur.launch_btn,
    },
    {
      id: "majlis",
      category: "spiritual",
      title: t.fitur.majlis_title,
      desc: t.fitur.majlis_desc,
      href: "/majlis",
      icon: "fa-microphone-lines",
      bg: "https://images.unsplash.com/photo-1594954002661-8f55fc15d7de?q=80&w=2670&auto=format&fit=crop",
      btnText: t.fitur.majlis_btn,
    },
    {
      id: "tarbiyah",
      category: "social",
      title: t.fitur.tarbiyah_title,
      desc: t.fitur.tarbiyah_desc,
      href: "/tarbiyah",
      icon: "fa-handshake-angle",
      bg: "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?q=80&w=2532&auto=format&fit=crop",
      btnText: t.fitur.tarbiyah_btn,
    },
    {
      id: "oracle",
      category: "media",
      title: "Kamera Aura Positif",
      desc: "Fitur kamera interaktif untuk mendeteksi ekspresi wajah dan membagikan kutipan semangat persaudaraan.",
      href: "/oracle",
      icon: "fa-camera",
      bg: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop",
      btnText: "Mulai Kamera",
    },
    {
      id: "multazam",
      category: "spiritual",
      title: t.fitur.multazam_title,
      desc: t.fitur.multazam_desc,
      href: "/multazam",
      icon: "fa-kaaba",
      bg: "https://images.unsplash.com/photo-1542642510-48227b613eec?q=80&w=2670&auto=format&fit=crop",
      btnText: t.fitur.multazam_btn,
    },
    {
      id: "kontemplasi",
      category: "spiritual",
      title: t.fitur.kontemplasi_title,
      desc: t.fitur.kontemplasi_desc,
      href: "/kontemplasi",
      icon: "fa-spa",
      bg: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=2574&auto=format&fit=crop",
      btnText: t.fitur.kontemplasi_btn,
    },
    {
      id: "celestial",
      category: "spiritual",
      title: t.fitur.celestial_title,
      desc: t.fitur.celestial_desc,
      href: "/celestial",
      icon: "fa-star",
      bg: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2670&auto=format&fit=crop",
      btnText: t.fitur.celestial_btn,
    },
    {
      id: "khatam",
      category: "spiritual",
      title: "Khatam Bersama Real-Time",
      desc: "Papan pembagian 30 Juz Al-Qur'an terintegrasi. Klaim juz, catat progres tadarus, dan raih berkah khataman angkatan.",
      href: "/khatam",
      icon: "fa-book-quran",
      bg: "https://images.unsplash.com/photo-1584281722572-c284fc5fcefa?q=80&w=2670&auto=format&fit=crop",
      btnText: "Buka Khataman",
      badge: "Live Tracker",
    },
    {
      id: "divine",
      category: "spiritual",
      title: "Ayat & Refleksi Harian",
      desc: "Tadabbur ayat-ayat suci Al-Qur'an dan hadits pilihan harian sebagai pedoman moral dan bekal amal shalih.",
      href: "/divine",
      icon: "fa-book-open",
      bg: "https://images.unsplash.com/photo-1606836109968-3e4b37be8079?q=80&w=2574&auto=format&fit=crop",
      btnText: "Resapi Ayat",
    },
    {
      id: "enigma",
      category: "explore",
      title: "Catatan Kenangan Pribadi",
      desc: "Buku catatan pribadi yang aman. Simpan kenangan masa nyantri, catatan perjalanan, dan resolusi masa depan Anda.",
      href: "/enigma",
      icon: "fa-book-bookmark",
      bg: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
      btnText: "Buka Catatan",
    },
    {
      id: "genesis",
      category: "explore",
      title: t.fitur.genesis_title,
      desc: t.fitur.genesis_desc,
      href: "/genesis",
      icon: "fa-landmark",
      bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop",
      btnText: t.fitur.genesis_btn,
    },
    {
      id: "nexus",
      category: "social",
      title: t.fitur.nexus_title,
      desc: t.fitur.nexus_desc,
      href: "/nexus",
      icon: "fa-network-wired",
      bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop",
      btnText: t.fitur.nexus_btn,
    },
    {
      id: "wrapped",
      category: "explore",
      title: "Kilas Balik Angkatan (Wrapped)",
      desc: "Rangkuman jejak aktivitas dan momen interaksi kebersamaan Anda di portal alumni sepanjang tahun ini.",
      href: "/wrapped",
      icon: "fa-film",
      bg: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2670&auto=format&fit=crop",
      btnText: "Lihat Kilas Balik",
    },
    {
      id: "panduan",
      category: "explore",
      title: t.panduan.title,
      desc: t.panduan.subtitle,
      href: "/panduan",
      icon: "fa-circle-question",
      bg: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2573&auto=format&fit=crop",
      btnText: t.fitur.panduan_btn,
    },
  ];

  // Filtered list for desktop
  const filteredFeatures = ALL_FEATURES.filter(
    (f) => selectedCategory === "all" || f.category === selectedCategory
  );

  // Mini App Drawer items for mobile launcher
  const MINI_APPS = [
    { href: "/sovereign", name: "KTA 3D", icon: "fa-id-card", color: "#ffd700", bg: "rgba(212,175,55,0.18)" },
    { href: "/scanner", name: "Pindai QR", icon: "fa-qrcode", color: "#00d2ff", bg: "rgba(0,210,255,0.18)" },
    { href: "/baitul-maal", name: "Baitul Maal", icon: "fa-hand-holding-dollar", color: "#25d366", bg: "rgba(37,211,102,0.18)" },
    { href: "/chat", name: "Obrolan", icon: "fa-comments", color: "#a855f7", bg: "rgba(168,85,247,0.18)" },
    { href: "/direktori", name: "Direktori", icon: "fa-address-book", color: "#f59e0b", bg: "rgba(245,158,11,0.18)" },
    { href: "/galeri", name: "Galeri", icon: "fa-images", color: "#ec4899", bg: "rgba(236,72,153,0.18)" },
    { href: "/photobooth", name: "Photobooth", icon: "fa-camera-retro", color: "#f43f5e", bg: "rgba(244,63,94,0.18)" },
    { href: "/event", name: "Agenda", icon: "fa-calendar-days", color: "#3b82f6", bg: "rgba(59,130,246,0.18)" },
    { href: "/wasiat", name: "Wasiat", icon: "fa-scroll", color: "#eab308", bg: "rgba(234,179,8,0.18)" },
    { href: "/majlis", name: "Majlis", icon: "fa-microphone-lines", color: "#10b981", bg: "rgba(16,185,129,0.18)" },
    { href: "/tarbiyah", name: "Karir", icon: "fa-handshake-angle", color: "#06b6d4", bg: "rgba(6,182,212,0.18)" },
    { href: "/oracle", name: "Oracle", icon: "fa-camera", color: "#8b5cf6", bg: "rgba(139,92,246,0.18)" },
    { href: "/multazam", name: "Dinding Doa", icon: "fa-kaaba", color: "#d97706", bg: "rgba(217,119,6,0.18)" },
    { href: "/khatam", name: "Khatam", icon: "fa-book-quran", color: "#ffd700", bg: "rgba(212,175,55,0.22)" },
    { href: "/kontemplasi", name: "Dzikir", icon: "fa-spa", color: "#14b8a6", bg: "rgba(20,184,166,0.18)" },
    { href: "/celestial", name: "Hikmah", icon: "fa-star", color: "#facc15", bg: "rgba(250,204,21,0.18)" },
    { href: "/divine", name: "Ayat Suci", icon: "fa-book-open", color: "#22c55e", bg: "rgba(34,197,94,0.18)" },
    { href: "/enigma", name: "Catatan", icon: "fa-book-bookmark", color: "#6366f1", bg: "rgba(99,102,241,0.18)" },
    { href: "/genesis", name: "Genesis", icon: "fa-landmark", color: "#c084fc", bg: "rgba(192,132,252,0.18)" },
    { href: "/nexus", name: "Nexus", icon: "fa-network-wired", color: "#38bdf8", bg: "rgba(56,189,248,0.18)" },
    { href: "/wrapped", name: "Wrapped", icon: "fa-film", color: "#f472b6", bg: "rgba(244,114,182,0.18)" },
    { href: "/panduan", name: "Panduan", icon: "fa-circle-question", color: "#94a3b8", bg: "rgba(148,163,184,0.18)" },
  ];

  // Setup GSAP and 3D Tilt for Desktop
  useEffect(() => {
    document.body.classList.add("page-fitur");
    const isMobileDevice =
      typeof window !== "undefined" &&
      (window.innerWidth <= 900 || "ontouchstart" in window || navigator.maxTouchPoints > 0);

    const ctx = gsap.context(() => {
      if (!isMobileDevice) {
        // Desktop cinematic entrance
        gsap.from(".desktop-header", { opacity: 0, y: -30, duration: 0.9, ease: "expo.out", clearProps: "all" });
        gsap.from(".desktop-category-bar", { opacity: 0, y: -15, duration: 0.8, delay: 0.1, ease: "power2.out", clearProps: "all" });
        gsap.from(".desktop-card", {
          opacity: 0,
          y: 50,
          duration: 0.8,
          stagger: 0.05,
          ease: "back.out(1.2)",
          clearProps: "all",
        });
      } else {
        // Mobile entrance
        gsap.from(".mobile-bento-card", {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "all",
        });
      }
    });

    // JS Tilt Effect (Only for Desktop Mouse Pointer)
    const tiltCards = cardsRef.current;
    if (!isMobileDevice && window.innerWidth > 900) {
      tiltCards.forEach((card) => {
        if (!card) return;

        const mouseMoveHandler = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const centerX = rect.width / 2;
          const centerY = rect.height / 2;

          const rotateX = ((y - centerY) / centerY) * -10;
          const rotateY = ((x - centerX) / centerX) * 10;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          card.style.transition = "none";
        };

        const mouseLeaveHandler = () => {
          card.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)";
          card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
        };

        card.addEventListener("mousemove", mouseMoveHandler);
        card.addEventListener("mouseleave", mouseLeaveHandler);

        (card as any)._mouseMoveHandler = mouseMoveHandler;
        (card as any)._mouseLeaveHandler = mouseLeaveHandler;
      });
    }

    return () => {
      document.body.classList.remove("page-fitur");
      ctx.revert();
      tiltCards.forEach((card) => {
        if (!card) return;
        if ((card as any)._mouseMoveHandler) card.removeEventListener("mousemove", (card as any)._mouseMoveHandler);
        if ((card as any)._mouseLeaveHandler) card.removeEventListener("mouseleave", (card as any)._mouseLeaveHandler);
      });
    };
  }, [selectedCategory]);

  return (
    <div className="vault-wrapper">
      {/* =========================================================================
          1. MOBILE VIEW: BENTO WIDGET HUB (<= 900PX SCREEN)
          ========================================================================= */}
      <div className="mobile-widget-hub">
        {/* WIDGET 1: PROFIL & KTA DIGITAL (2 Kolom / Full Width) */}
        <div className="mobile-bento-card widget-profile-card">
          <div className="widget-profile-header">
            <img
              src={avatarUrl}
              alt="Profil"
              className="widget-avatar"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getAvatarFallback(userProfile?.nama_panggilan || userProfile?.nama_lengkap || "A");
              }}
            />
            <div className="widget-profile-info">
              <div className="widget-greeting">Ahlan wa Sahlan,</div>
              <h2 className="widget-user-name">{userProfile?.nama_panggilan || userProfile?.nama_lengkap || "Sahabat"}</h2>
              <div className="widget-badge-row">
                <span className="widget-gelar-badge" style={{ background: badgeColor }}>
                  <i className={badgeIcon}></i> {gelar}
                </span>
                <span className="widget-points-badge">
                  {points.toLocaleString("id-ID")} <small>PTS</small>
                </span>
              </div>
            </div>
          </div>

          <div className="widget-profile-actions">
            <Link href="/sovereign" className="widget-action-btn primary">
              <i className="fa-solid fa-id-card"></i>
              <span>KTA 3D</span>
            </Link>
            <Link href="/scanner" className="widget-action-btn secondary">
              <i className="fa-solid fa-qrcode"></i>
              <span>Pindai QR</span>
            </Link>
            <Link href="/profil" className="widget-action-btn tertiary">
              <i className="fa-solid fa-gear"></i>
            </Link>
          </div>
        </div>

        {/* WIDGET ROW: BAITUL MAAL & ULANG TAHUN (2 Kotak Berdampingan) */}
        <div className="mobile-bento-row">
          {/* WIDGET 2: BAITUL MAAL & KAS */}
          <Link href="/baitul-maal" className="mobile-bento-card widget-kas-card">
            <div className="widget-card-top">
              <div className="widget-card-icon kas">
                <i className="fa-solid fa-hand-holding-dollar"></i>
              </div>
              <span className={`widget-status-pill ${kasWidget.hasPaidThisMonth ? "paid" : "unpaid"}`}>
                {kasWidget.hasPaidThisMonth ? "Lunas" : "Belum Infaq"}
              </span>
            </div>
            <div className="widget-kas-amount">{formatRupiah(kasWidget.totalKas)}</div>
            <div className="widget-card-label">Saldo Kas Angkatan</div>
            <div className="widget-card-footer-link">
              <span>{kasWidget.hasPaidThisMonth ? "Lihat Transaksi" : "Bayar Infaq"}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </Link>

          {/* WIDGET 3: ULANG TAHUN HARI INI / TERDEKAT */}
          <Link
            href={birthdayWidget.today.length > 0 ? `/birthday/${birthdayWidget.today[0].id}` : "/birthday"}
            className="mobile-bento-card widget-bday-card"
          >
            <div className="widget-card-top">
              <div className="widget-card-icon bday">
                <i className="fa-solid fa-cake-candles"></i>
              </div>
              {birthdayWidget.today.length > 0 ? (
                <span className="widget-status-pill bday-active">Hari Ini 🎉</span>
              ) : (
                <span className="widget-status-pill bday-soon">Bulan Ini</span>
              )}
            </div>

            {birthdayWidget.today.length > 0 ? (
              <>
                <div className="widget-bday-name">{birthdayWidget.today[0].nama_panggilan || birthdayWidget.today[0].nama_lengkap}</div>
                <div className="widget-card-label">Ulang Tahun Hari Ini</div>
                <div className="widget-card-footer-link bday">
                  <span>Kirim Doa</span>
                  <i className="fa-brands fa-whatsapp"></i>
                </div>
              </>
            ) : birthdayWidget.next ? (
              <>
                <div className="widget-bday-name">{birthdayWidget.next.nama_panggilan || birthdayWidget.next.nama_lengkap}</div>
                <div className="widget-card-label">Tgl {birthdayWidget.next.day} (H-{birthdayWidget.next.daysLeft})</div>
                <div className="widget-card-footer-link">
                  <span>Lihat Kalender</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </>
            ) : (
              <>
                <div className="widget-bday-name" style={{ fontSize: "0.95rem" }}>Semua Rekan</div>
                <div className="widget-card-label">Kalender Ultah Angkatan</div>
                <div className="widget-card-footer-link">
                  <span>Buka Kalender</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </>
            )}
          </Link>
        </div>

        {/* WIDGET 4: EVENT & REUNI TERDEKAT (Full Width) */}
        {nearestEvent ? (
          <Link href="/event" className="mobile-bento-card widget-event-card">
            <div className="widget-event-badge-row">
              <span className="widget-event-countdown">
                <i className="fa-regular fa-clock"></i> {eventDaysLeft !== null ? (eventDaysLeft === 0 ? "Hari Ini!" : `H-${eventDaysLeft}`) : "Segera"}
              </span>
              <span className="widget-event-tag">Agenda Terdekat</span>
            </div>
            <h3 className="widget-event-title">{nearestEvent.title}</h3>
            <div className="widget-event-meta">
              <span><i className="fa-regular fa-calendar"></i> {eventDateFormatted}</span>
              {nearestEvent.location && (
                <span><i className="fa-solid fa-location-dot"></i> {nearestEvent.location}</span>
              )}
            </div>
          </Link>
        ) : (
          <Link href="/event" className="mobile-bento-card widget-event-card empty">
            <div className="widget-event-meta" style={{ justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 className="widget-event-title" style={{ fontSize: "0.95rem", marginBottom: "4px" }}>Agenda & Reuni Angkatan</h3>
                <div className="widget-card-label">Belum ada agenda baru. Rencanakan bersama!</div>
              </div>
              <div className="widget-card-footer-link" style={{ marginTop: 0 }}>
                <span>Buka</span>
                <i className="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          </Link>
        )}

        {/* WIDGET ROW: CHAT & PHOTOBOOTH */}
        <div className="mobile-bento-row">
          {/* WIDGET 5: CHAT SILATURAHMI */}
          <Link href="/chat" className="mobile-bento-card widget-action-bubble chat">
            <div className="bubble-icon-wrap chat">
              <i className="fa-solid fa-comments"></i>
            </div>
            <div className="bubble-text">
              <h4>Ruang Obrolan</h4>
              <p>Sapa kawan santri</p>
            </div>
            <i className="fa-solid fa-chevron-right bubble-chevron"></i>
          </Link>

          {/* WIDGET 6: PHOTOBOOTH SANTRI */}
          <Link href="/photobooth" className="mobile-bento-card widget-action-bubble photobooth">
            <div className="bubble-icon-wrap photobooth">
              <i className="fa-solid fa-camera-retro"></i>
            </div>
            <div className="bubble-text">
              <h4>Photobooth</h4>
              <p>Foto kenangan retro</p>
            </div>
            <i className="fa-solid fa-chevron-right bubble-chevron"></i>
          </Link>
        </div>

        {/* WIDGET: KHATAM BERSAMA REAL-TIME */}
        <Link
          href="/khatam"
          className="mobile-bento-card widget-event-card"
          style={{
            background: "linear-gradient(135deg, rgba(27,94,32,0.2) 0%, rgba(212,175,55,0.12) 100%)",
            borderColor: "rgba(212,175,55,0.35)",
          }}
        >
          <div className="widget-event-badge-row">
            <span
              className="widget-event-countdown"
              style={{
                background: "rgba(212,175,55,0.2)",
                color: "#ffd700",
                borderColor: "rgba(212,175,55,0.4)",
              }}
            >
              <i className="fa-solid fa-book-quran"></i> One Member One Juz
            </span>
            <span className="widget-event-tag" style={{ color: "#2bb97c" }}>Live Tracker</span>
          </div>
          <h3 className="widget-event-title" style={{ color: "var(--gold-main)" }}>
            Khatam Bersama Angkatan 43
          </h3>
          <div className="widget-event-meta" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              <i className="fa-solid fa-circle-check" style={{ color: "#2bb97c", marginRight: "6px" }}></i>
              Ambil & Selesaikan Juz Anda
            </span>
            <div className="widget-card-footer-link" style={{ marginTop: 0, color: "var(--gold-main)" }}>
              <span>Buka Papan</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        </Link>

        {/* WIDGET 7: QUICK SEARCH ALUMNI */}
        <form onSubmit={handleSearchSubmit} className="mobile-bento-card widget-search-card">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Cari nama kawan alumni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Cari
          </button>
        </form>

        {/* MINI APP DRAWER (SEMUA FITUR ANGKATAN) */}
        <div className="mobile-apps-section">
          <div className="mobile-section-header">
            <h3 className="mobile-section-title">
              <i className="fa-solid fa-shapes"></i> Fasilitas & Fitur Lainnya
            </h3>
            <span className="mobile-section-counter">{MINI_APPS.length} Menu</span>
          </div>

          <div className="mobile-app-grid">
            {MINI_APPS.map((app, idx) => (
              <Link key={idx} href={app.href} className="mobile-app-item">
                <div className="mobile-app-icon-badge" style={{ background: app.bg, color: app.color, borderColor: `${app.color}40` }}>
                  <i className={`fa-solid ${app.icon}`}></i>
                </div>
                <span className="mobile-app-name">{app.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. DESKTOP VIEW: THE SOVEREIGN VAULT (SUPER KEREN & SINEMATIK > 900PX)
          ========================================================================= */}
      <div className="desktop-vault-view">
        <div className="desktop-header">
          <div className="vault-emblem">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h1 className="desktop-title">{t.fitur.title}</h1>
          <p className="desktop-subtitle">{t.fitur.subtitle}</p>
        </div>

        {/* Category Filter Bar */}
        <div className="desktop-category-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`category-pill-btn ${selectedCategory === cat.id ? "active" : ""}`}
            >
              <i className={cat.icon}></i>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Cinematic 3D Cards Grid */}
        <div className="cinematic-grid">
          {filteredFeatures.map((item, idx) => (
            <Link
              key={item.id}
              href={item.href}
              className="premium-card js-tilt-card desktop-card"
              ref={(el) => {
                cardsRef.current[idx] = el;
              }}
            >
              <div className="card-bg" style={{ backgroundImage: `url('${item.bg}')` }}></div>
              <div className="card-glow-layer"></div>
              {item.badge && <div className="card-badge-tag">{item.badge}</div>}
              <i className={`fa-solid ${item.icon} card-icon`}></i>
              <div className="card-content">
                <h3 className="card-title">{item.title}</h3>
                <p className="card-desc">{item.desc}</p>
                <div className="launch-btn">
                  {item.btnText} <i className="fa-solid fa-arrow-right-long"></i>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
