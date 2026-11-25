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
  const { t, locale, setLocale } = useLanguage();
  const router = useRouter();

  // Desktop & Mobile Category Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mobileCategory, setMobileCategory] = useState<string>("all");
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
    { id: "all", label: t.fitur.cat_all, icon: "fa-solid fa-layer-group" },
    { id: "social", label: t.fitur.cat_social, icon: "fa-solid fa-users" },
    { id: "kas", label: t.fitur.cat_kas, icon: "fa-solid fa-hand-holding-dollar" },
    { id: "media", label: t.fitur.cat_media, icon: "fa-solid fa-camera-retro" },
    { id: "spiritual", label: t.fitur.cat_spiritual, icon: "fa-solid fa-kaaba" },
    { id: "explore", label: t.fitur.cat_explore, icon: "fa-solid fa-compass" },
  ];

  // Full Feature List for Desktop (Curated High-Fidelity Thematic Imagery)
  const ALL_FEATURES = [
    {
      id: "photobooth",
      category: "media",
      title: t.fitur.photobooth_title,
      desc: t.fitur.photobooth_desc,
      href: "/photobooth",
      icon: "fa-camera-retro",
      bg: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.photobooth_btn,
      badge: "Populer",
    },
    {
      id: "galeri",
      category: "media",
      title: t.fitur.galeri_title,
      desc: t.fitur.galeri_desc,
      href: "/galeri",
      icon: "fa-images",
      bg: "/assets/gallery/display/disp_rihlah_001.webp",
      btnText: t.fitur.galeri_btn,
      badge: "Arsip 43",
    },
    {
      id: "kta",
      category: "social",
      title: t.fitur.kta_title,
      desc: t.fitur.kta_desc,
      href: "/sovereign",
      icon: "fa-id-card",
      bg: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.kta_btn,
      badge: "KTA 3D",
    },
    {
      id: "scanner",
      category: "social",
      title: t.fitur.scanner_title,
      desc: t.fitur.scanner_desc,
      href: "/scanner",
      icon: "fa-qrcode",
      bg: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.scanner_btn,
      badge: "Scanner",
    },
    {
      id: "radar",
      category: "social",
      title: t.fitur.radar_title,
      desc: t.fitur.radar_desc,
      href: "/radar",
      icon: "fa-location-dot",
      bg: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.radar_btn,
      badge: "Peta GPS",
    },
    {
      id: "buku-tamu",
      category: "social",
      title: t.fitur.buku_tamu_title,
      desc: t.fitur.buku_tamu_desc,
      href: "/buku-tamu",
      icon: "fa-pen-nib",
      bg: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.buku_tamu_btn,
      badge: "Presensi Santri",
    },
    {
      id: "chat",
      category: "social",
      title: t.fitur.quick_chat_title,
      desc: t.fitur.quick_chat_desc,
      href: "/chat",
      icon: "fa-comments",
      bg: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.quick_chat_btn,
      badge: "Real-time",
    },
    {
      id: "direktori",
      category: "social",
      title: t.fitur.quick_dir_title,
      desc: t.fitur.quick_dir_desc,
      href: "/direktori",
      icon: "fa-address-book",
      bg: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.quick_dir_btn,
    },
    {
      id: "birthday",
      category: "social",
      title: locale === "ar" ? "أعياد ميلاد الدفعة" : locale === "en" ? "Cohort Birthdays & Wishes" : "Ulang Tahun & Kartu Ucapan",
      desc: locale === "ar" ? "رزنامة أعياد ميلاد رفقاء الدفعة، وبطاقات تهنئة ومشاركة الدعاء عبر واتساب." : locale === "en" ? "Cohort birthday calendar, greeting cards, and sharing prayers via WhatsApp." : "Kalender ulang tahun alumni, kartu ucapan interaktif, serta kirim doa lewat WhatsApp.",
      href: "/birthday",
      icon: "fa-cake-candles",
      bg: "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=75&w=720&auto=format&fit=crop",
      btnText: locale === "ar" ? "فتح التقويم" : locale === "en" ? "Open Calendar" : "Lihat Kalender",
      badge: "Interaktif",
    },
    {
      id: "baitul-maal",
      category: "kas",
      title: t.fitur.baitul_title,
      desc: t.fitur.baitul_desc,
      href: "/baitul-maal",
      icon: "fa-hand-holding-dollar",
      bg: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.baitul_btn,
      badge: "Amanah Kas",
    },
    {
      id: "syndicate",
      category: "kas",
      title: locale === "ar" ? "دليل مشاريع ورواد أعمال الخريجين" : locale === "en" ? "Alumni Business Directory" : "Jejaring Bisnis Alumni",
      desc: locale === "ar" ? "دليل مشاريع وريادة أعمال رفقاء الدفعة، المنتجات المتميزة، وفرص التعاون والشراكة الاقتصادية." : locale === "en" ? "Cohort entrepreneurship catalog, featured alumni ventures, and collaborative business partnerships." : "Katalog jejaring wirausaha santri, direktori bisnis & jasa alumni, dan etalase kolaborasi ekonomi angkatan.",
      href: "/syndicate",
      icon: "fa-briefcase",
      bg: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=75&w=720&auto=format&fit=crop",
      btnText: locale === "ar" ? "استعراض الأعمال" : locale === "en" ? "Explore Directory" : "Jelajahi Usaha",
      badge: "Jejaring Bisnis",
    },
    {
      id: "wasiat",
      category: "kas",
      title: t.fitur.wasiat_title,
      desc: t.fitur.wasiat_desc,
      href: "/wasiat",
      icon: "fa-scroll",
      bg: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.wasiat_btn,
    },
    {
      id: "event",
      category: "social",
      title: t.event.title,
      desc: t.event.subtitle,
      href: "/event",
      icon: "fa-calendar-days",
      bg: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.launch_btn,
    },
    {
      id: "majlis",
      category: "spiritual",
      title: t.fitur.majlis_title,
      desc: t.fitur.majlis_desc,
      href: "/majlis",
      icon: "fa-microphone-lines",
      bg: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.majlis_btn,
    },
    {
      id: "tarbiyah",
      category: "social",
      title: t.fitur.tarbiyah_title,
      desc: t.fitur.tarbiyah_desc,
      href: "/tarbiyah",
      icon: "fa-handshake-angle",
      bg: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.tarbiyah_btn,
    },
    {
      id: "oracle",
      category: "media",
      title: "Kamera Aura Positif",
      desc: "Fitur kamera interaktif untuk mendeteksi ekspresi wajah dan membagikan kutipan semangat persaudaraan.",
      href: "/oracle",
      icon: "fa-camera",
      bg: "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?q=75&w=720&auto=format&fit=crop",
      btnText: "Mulai Kamera",
    },
    {
      id: "multazam",
      category: "spiritual",
      title: t.fitur.multazam_title,
      desc: t.fitur.multazam_desc,
      href: "/multazam",
      icon: "fa-kaaba",
      bg: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.multazam_btn,
    },
    {
      id: "kontemplasi",
      category: "spiritual",
      title: t.fitur.kontemplasi_title,
      desc: t.fitur.kontemplasi_desc,
      href: "/kontemplasi",
      icon: "fa-spa",
      bg: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.kontemplasi_btn,
    },
    {
      id: "celestial",
      category: "spiritual",
      title: t.fitur.celestial_title,
      desc: t.fitur.celestial_desc,
      href: "/celestial",
      icon: "fa-star",
      bg: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.celestial_btn,
    },
    {
      id: "khatam",
      category: "spiritual",
      title: t.fitur.quick_khatam_title,
      desc: t.fitur.quick_khatam_desc,
      href: "/quran?tab=khataman",
      icon: "fa-book-quran",
      bg: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.quick_khatam_btn,
      badge: "Live Tracker",
    },
    {
      id: "kiblat",
      category: "spiritual",
      title: t.fitur.quick_kiblat_title,
      desc: t.fitur.quick_kiblat_desc,
      href: "/kiblat",
      icon: "fa-compass",
      bg: "https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.quick_kiblat_btn,
      badge: "Kompas GPS",
    },
    {
      id: "quran",
      category: "spiritual",
      title: "Al-Qur'an Digital 30 Juz",
      desc: "Mushaf Al-Qur'an digital 30 Juz & 114 Surah lengkap standar Kemenag RI dengan murottal 6 Qari, transliterasi Latin, terjemahan resmi, tafsir ringkas, dan bookmark tilawah.",
      href: "/quran",
      icon: "fa-quran",
      bg: "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=75&w=720&auto=format&fit=crop",
      btnText: "Buka Mushaf",
      badge: "Kemenag RI",
    },
    {
      id: "tasbih",
      category: "spiritual",
      title: "Tasbih Digital Haptic",
      desc: "Hitung dzikir harian dengan getaran lembut smartphone, target 33 dan 99 butir, serta riwayat doa.",
      href: "/tasbih",
      icon: "fa-gem",
      bg: "https://images.unsplash.com/photo-1564769625905-50e93615e769?q=75&w=720&auto=format&fit=crop",
      btnText: "Mulai Dzikir",
      badge: "Dzikir Harian",
    },
    {
      id: "divine",
      category: "spiritual",
      title: "Ayat & Refleksi Harian",
      desc: "Tadabbur ayat-ayat suci Al-Qur'an dan hadits pilihan harian sebagai pedoman moral dan bekal amal shalih.",
      href: "/divine",
      icon: "fa-book-open",
      bg: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?q=75&w=720&auto=format&fit=crop",
      btnText: "Resapi Ayat",
    },
    {
      id: "matsurat",
      category: "spiritual",
      title: "Al-Ma’tsurat Dzikir Pagi & Petang",
      desc: "Bacaan dzikir pagi dan petang disertai penghitung tasbih, audio murattal, dan doa rabithah.",
      href: "/matsurat",
      icon: "fa-hands-praying",
      bg: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=75&w=720&auto=format&fit=crop",
      btnText: "Buka Al-Ma’tsurat",
      badge: "Amalan Harian",
    },
    {
      id: "mahfuzhat",
      category: "spiritual",
      title: "Mahfuzhat & Hikmah Santri",
      desc: "Kumpulan kata mutiara klasik pesantren, kuis sambung hafalan, dan kartu kutipan siap dibagikan ke WhatsApp.",
      href: "/mahfuzhat",
      icon: "fa-feather-pointed",
      bg: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=75&w=720&auto=format&fit=crop",
      btnText: "Buka Mahfuzhat",
      badge: "Koleksi Hikmah",
    },
    {
      id: "asmaul-husna",
      category: "spiritual",
      title: "99 Asmaul Husna & Tadabbur",
      desc: "Pelajari 99 Nama Allah SWT lengkap dengan arti, dalil Al-Qur'an, mode tasbih, dan audio murattal.",
      href: "/asmaul-husna",
      icon: "fa-certificate",
      bg: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?q=75&w=720&auto=format&fit=crop",
      btnText: "Buka Asmaul Husna",
      badge: "Asma Agung",
    },
    {
      id: "sirah",
      category: "spiritual",
      title: "Sirah Nabawiyah & Peta Jejak",
      desc: "Peta interaktif dan kronologi peristiwa penting kehidupan Rasulullah SAW di Makkah dan Madinah.",
      href: "/sirah",
      icon: "fa-map-location-dot",
      bg: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=75&w=720&auto=format&fit=crop",
      btnText: "Buka Peta Sirah",
      badge: "Peta Sejarah",
    },
    {
      id: "enigma",
      category: "explore",
      title: "Catatan Kenangan Pribadi",
      desc: "Buku catatan pribadi yang aman. Simpan kenangan masa nyantri, catatan perjalanan, dan resolusi masa depan Anda.",
      href: "/enigma",
      icon: "fa-book-bookmark",
      bg: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=75&w=720&auto=format&fit=crop",
      btnText: "Buka Catatan",
    },
    {
      id: "genesis",
      category: "explore",
      title: t.fitur.genesis_title,
      desc: t.fitur.genesis_desc,
      href: "/genesis",
      icon: "fa-landmark",
      bg: "https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.genesis_btn,
    },
    {
      id: "nexus",
      category: "social",
      title: t.fitur.nexus_title,
      desc: t.fitur.nexus_desc,
      href: "/nexus",
      icon: "fa-network-wired",
      bg: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.nexus_btn,
    },
    {
      id: "wrapped",
      category: "explore",
      title: "Kilas Balik Angkatan (Wrapped)",
      desc: "Rangkuman jejak aktivitas dan momen interaksi kebersamaan Anda di portal alumni sepanjang tahun ini.",
      href: "/wrapped",
      icon: "fa-film",
      bg: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=75&w=720&auto=format&fit=crop",
      btnText: "Lihat Kilas Balik",
    },
    {
      id: "panduan",
      category: "explore",
      title: t.panduan.title,
      desc: t.panduan.subtitle,
      href: "/panduan",
      icon: "fa-circle-question",
      bg: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=75&w=720&auto=format&fit=crop",
      btnText: t.fitur.panduan_btn,
    },
  ];

  // Filtered list for desktop
  const filteredFeatures = ALL_FEATURES.filter(
    (f) => selectedCategory === "all" || f.category === selectedCategory
  );

  // Mini App Drawer items for mobile launcher (Categorized 33 Features)
  const MINI_APPS = [
    { href: "/sovereign", category: "social", name: locale === "ar" ? "بطاقة الهوية 3D" : locale === "en" ? "3D ID Card" : "KTA 3D", icon: "fa-id-card" },
    { href: "/scanner", category: "social", name: t.fitur.scanner_btn, icon: "fa-qrcode" },
    { href: "/radar", category: "social", name: t.fitur.radar_btn, icon: "fa-location-dot" },
    { href: "/buku-tamu", category: "social", name: locale === "ar" ? "دفتر الزوار" : locale === "en" ? "Guestbook" : "Buku Tamu", icon: "fa-pen-nib" },
    { href: "/baitul-maal", category: "kas", name: t.fitur.launcher_baitul, icon: "fa-hand-holding-dollar" },
    { href: "/syndicate", category: "kas", name: locale === "ar" ? "دليل الأعمال" : locale === "en" ? "Business" : "Bisnis Alumni", icon: "fa-briefcase" },
    { href: "/chat", category: "social", name: t.fitur.launcher_chat, icon: "fa-comments" },
    { href: "/direktori", category: "social", name: t.fitur.launcher_direktori, icon: "fa-address-book" },
    { href: "/galeri", category: "media", name: t.fitur.launcher_galeri, icon: "fa-images" },
    { href: "/birthday", category: "social", name: locale === "ar" ? "أعياد الميلاد" : locale === "en" ? "Birthdays" : "Ulang Tahun", icon: "fa-cake-candles" },
    { href: "/photobooth", category: "media", name: t.fitur.launcher_photobooth, icon: "fa-camera-retro" },
    { href: "/event", category: "social", name: t.fitur.launcher_event, icon: "fa-calendar-days" },
    { href: "/wasiat", category: "kas", name: t.fitur.launcher_wasiat, icon: "fa-scroll" },
    { href: "/majlis", category: "spiritual", name: t.fitur.launcher_majlis, icon: "fa-microphone-lines" },
    { href: "/tarbiyah", category: "social", name: t.fitur.launcher_tarbiyah, icon: "fa-handshake-angle" },
    { href: "/oracle", category: "media", name: "Oracle", icon: "fa-camera" },
    { href: "/multazam", category: "spiritual", name: t.fitur.launcher_multazam, icon: "fa-kaaba" },
    { href: "/quran", category: "spiritual", name: t.fitur.launcher_quran, icon: "fa-quran" },
    { href: "/quran?tab=khataman", category: "spiritual", name: t.fitur.launcher_khatam, icon: "fa-book-quran" },
    { href: "/kiblat", category: "spiritual", name: t.fitur.launcher_kiblat, icon: "fa-compass" },
    { href: "/tasbih", category: "spiritual", name: t.fitur.launcher_tasbih, icon: "fa-gem" },
    { href: "/kontemplasi", category: "spiritual", name: t.fitur.launcher_kontemplasi, icon: "fa-spa" },
    { href: "/celestial", category: "spiritual", name: t.fitur.launcher_celestial, icon: "fa-star" },
    { href: "/divine", category: "spiritual", name: locale === "ar" ? "الآيات المباركة" : locale === "en" ? "Divine Verses" : "Ayat Suci", icon: "fa-book-open" },
    { href: "/matsurat", category: "spiritual", name: t.fitur.launcher_matsurat, icon: "fa-hands-praying" },
    { href: "/mahfuzhat", category: "spiritual", name: t.fitur.launcher_mahfuzhat, icon: "fa-feather-pointed" },
    { href: "/asmaul-husna", category: "spiritual", name: t.fitur.launcher_asmaul, icon: "fa-certificate" },
    { href: "/sirah", category: "spiritual", name: t.fitur.launcher_sirah, icon: "fa-map-location-dot" },
    { href: "/enigma", category: "explore", name: locale === "ar" ? "مذكرات إنيغما" : locale === "en" ? "Enigma Notes" : "Catatan", icon: "fa-book-bookmark" },
    { href: "/genesis", category: "explore", name: "Genesis", icon: "fa-landmark" },
    { href: "/nexus", category: "social", name: t.fitur.launcher_nexus, icon: "fa-network-wired" },
    { href: "/wrapped", category: "explore", name: "Wrapped", icon: "fa-film" },
    { href: "/panduan", category: "explore", name: t.fitur.launcher_panduan, icon: "fa-circle-question" },
  ];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMiniApps = MINI_APPS.filter((app) => {
    const matchCategory = mobileCategory === "all" || app.category === mobileCategory;
    const matchQuery = !normalizedQuery || app.name.toLowerCase().includes(normalizedQuery) || app.href.toLowerCase().includes(normalizedQuery);
    return matchCategory && matchQuery;
  });

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
          y: 28,
          duration: 0.65,
          stagger: 0.04,
          ease: "expo.out",
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
              <div className="widget-greeting">{t.fitur.greeting_ahlan}</div>
              <h2 className="widget-user-name">{userProfile?.nama_panggilan || userProfile?.nama_lengkap || "Sahabat"}</h2>
              <div className="widget-badge-row">
                <span className="widget-gelar-badge" style={{ background: badgeColor }}>
                  <i className={badgeIcon}></i> {gelar}
                </span>
                <span className="widget-points-badge">
                  {points.toLocaleString("id-ID")} <small>{t.fitur.points_unit}</small>
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
            <Link href="/profil" className="widget-action-btn tertiary" aria-label={t.sidebar.profile}>
              <i className="fa-solid fa-gear"></i>
            </Link>
          </div>

          <div className="widget-quick-prefs">
            <div className="widget-lang-group" role="group" aria-label={locale === "ar" ? "اللغة" : locale === "en" ? "Language" : "Bahasa"}>
              <span className="widget-prefs-label">
                <i className="fa-solid fa-globe"></i> {locale === "ar" ? "اللغة" : locale === "en" ? "Lang" : "Bahasa"}
              </span>
              {(["id", "en", "ar"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
                    setLocale(code);
                  }}
                  className={`widget-pref-pill ${locale === code ? "active" : ""}`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="widget-guide-pill"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
                window.dispatchEvent(new CustomEvent("expedient-open-guide"));
              }}
            >
              <i className="fa-solid fa-circle-question"></i>
              <span>{locale === "ar" ? "مساعدة" : locale === "en" ? "Help" : "Panduan"}</span>
            </button>
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
                <span className="widget-status-pill bday-active">
                  <i className="fa-solid fa-cake-candles" style={{ marginRight: "4px" }}></i>
                  {locale === "ar" ? "اليوم" : locale === "en" ? "Today" : "Hari Ini"}
                </span>
              ) : (
                <span className="widget-status-pill bday-soon">Bulan Ini</span>
              )}
            </div>

            {birthdayWidget.today.length > 0 ? (
              <>
                <div className="widget-bday-name">{birthdayWidget.today[0].nama_panggilan || birthdayWidget.today[0].nama_lengkap}</div>
                <div className="widget-card-label">{locale === "ar" ? "عيد ميلاد اليوم" : locale === "en" ? "Birthday Today" : "Ulang Tahun Hari Ini"}</div>
                <div className="widget-card-footer-link">
                  <span>{locale === "ar" ? "إرسال دعاء" : locale === "en" ? "Send Wishes" : "Kirim Doa"}</span>
                  <i className="fa-brands fa-whatsapp"></i>
                </div>
              </>
            ) : birthdayWidget.next ? (
              <>
                <div className="widget-bday-name">{birthdayWidget.next.nama_panggilan || birthdayWidget.next.nama_lengkap}</div>
                <div className="widget-card-label">{locale === "ar" ? `${birthdayWidget.next.day} (متبقي ${birthdayWidget.next.daysLeft} يوم)` : locale === "en" ? `Date ${birthdayWidget.next.day} (in ${birthdayWidget.next.daysLeft}d)` : `Tgl ${birthdayWidget.next.day} (H-${birthdayWidget.next.daysLeft})`}</div>
                <div className="widget-card-footer-link">
                  <span>{locale === "ar" ? "عرض التقويم" : locale === "en" ? "View Calendar" : "Lihat Kalender"}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </div>
              </>
            ) : (
              <>
                <div className="widget-bday-name" style={{ fontSize: "0.95rem" }}>{locale === "ar" ? "جميع الزملاء" : locale === "en" ? "All Peers" : "Semua Rekan"}</div>
                <div className="widget-card-label">{locale === "ar" ? "تقويم أعياد ميلاد الدفعة" : locale === "en" ? "Cohort Birthday Calendar" : "Kalender Ultah Angkatan"}</div>
                <div className="widget-card-footer-link">
                  <span>{locale === "ar" ? "فتح التقويم" : locale === "en" ? "Open Calendar" : "Buka Kalender"}</span>
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
                <i className="fa-regular fa-clock"></i> {eventDaysLeft !== null ? (eventDaysLeft === 0 ? (locale === "ar" ? "اليوم!" : locale === "en" ? "Today!" : "Hari Ini!") : (locale === "ar" ? `متبقي ${eventDaysLeft} يوم` : locale === "en" ? `In ${eventDaysLeft}d` : `H-${eventDaysLeft}`)) : (locale === "ar" ? "قريباً" : locale === "en" ? "Soon" : "Segera")}
              </span>
              <span className="widget-event-tag">{locale === "ar" ? "الحدث القادم" : locale === "en" ? "Upcoming Event" : "Agenda Terdekat"}</span>
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
            <div className="widget-card-top">
              <div className="widget-card-icon">
                <i className="fa-regular fa-calendar-plus"></i>
              </div>
              <span className="widget-status-pill bday-soon">
                {locale === "ar" ? "قريباً" : locale === "en" ? "Upcoming" : "Agenda"}
              </span>
            </div>
            <h3 className="widget-event-title widget-event-title-compact">
              {locale === "ar" ? "الفعاليات واللقاءات" : locale === "en" ? "Events & Reunions" : "Agenda & Reuni Angkatan"}
            </h3>
            <div className="widget-card-label">
              {locale === "ar" ? "لا توجد فعاليات جديدة حالياً. خططوا معاً!" : locale === "en" ? "No new events yet. Plan together!" : "Belum ada agenda baru. Rencanakan bersama!"}
            </div>
            <div className="widget-card-footer-link widget-card-footer-compact">
              <span>{locale === "ar" ? "فتح التقويم" : locale === "en" ? "Open Calendar" : "Buka Kalender Agenda"}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </Link>
        )}

        {/* WIDGET ROW: CHAT & PHOTOBOOTH */}
        <div className="mobile-bento-row">
          {/* WIDGET 5: CHAT SILATURAHMI */}
          <Link href="/chat" className="mobile-bento-card widget-action-bubble chat">
            <div className="bubble-card-header">
              <div className="bubble-icon-wrap chat">
                <i className="fa-solid fa-comments"></i>
              </div>
              <i className="fa-solid fa-arrow-right bubble-chevron"></i>
            </div>
            <div className="bubble-text">
              <h4>{locale === "ar" ? "غرفة المحادثة" : locale === "en" ? "Chat Room" : "Ruang Obrolan"}</h4>
              <p>{locale === "ar" ? "تواصل مع رفقاء الدفعة" : locale === "en" ? "Say hello to peers" : "Sapa kawan santri"}</p>
            </div>
          </Link>

          {/* WIDGET 6: PHOTOBOOTH SANTRI */}
          <Link href="/photobooth" className="mobile-bento-card widget-action-bubble photobooth">
            <div className="bubble-card-header">
              <div className="bubble-icon-wrap photobooth">
                <i className="fa-solid fa-camera-retro"></i>
              </div>
              <i className="fa-solid fa-arrow-right bubble-chevron"></i>
            </div>
            <div className="bubble-text">
              <h4>{locale === "ar" ? "كشك الصور" : locale === "en" ? "Photobooth" : "Photobooth"}</h4>
              <p>{locale === "ar" ? "صور تذكارية كلاسيكية" : locale === "en" ? "Retro photo memories" : "Foto kenangan retro"}</p>
            </div>
          </Link>
        </div>

        {/* WIDGET: KHATAM BERSAMA REAL-TIME */}
        <Link
          href="/quran?tab=khataman"
          className="mobile-bento-card widget-event-card widget-khatam-card"
        >
          <div className="widget-event-badge-row">
            <span className="widget-event-countdown khatam-countdown">
              <i className="fa-solid fa-book-quran"></i> One Member One Juz
            </span>
            <span className="widget-event-tag khatam-tag">Live Tracker</span>
          </div>
          <h3 className="widget-event-title khatam-title">
            {locale === "ar" ? "ختمة جماعية للدفعة 43" : locale === "en" ? "Cohort 43 Group Khatam" : "Khatam Bersama Angkatan 43"}
          </h3>
          <div className="widget-event-meta widget-khatam-meta">
            <span className="khatam-subtext">
              <i className="fa-solid fa-circle-check khatam-check-icon"></i>
              {locale === "ar" ? "اختر وأكمل جزأك" : locale === "en" ? "Claim & Complete Your Juz" : "Ambil & Selesaikan Juz Anda"}
            </span>
            <div className="widget-card-footer-link khatam-link">
              <span>{locale === "ar" ? "فتح اللوحة" : locale === "en" ? "Open Board" : "Buka Papan"}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </div>
          </div>
        </Link>

        {/* WIDGET 7: QUICK SEARCH ALUMNI & FITUR */}
        <form onSubmit={handleSearchSubmit} className="mobile-bento-card widget-search-card">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder={locale === "ar" ? "ابحث عن ميزة أو زميل..." : locale === "en" ? "Filter features or search alumni..." : "Cari fitur atau nama alumni..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
          <button type="submit" className="search-btn">
            {locale === "ar" ? "بحث" : locale === "en" ? "Directory" : "Direktori"}
          </button>
        </form>

        {/* MINI APP DRAWER (SEMUA FITUR ANGKATAN - CATEGORIZED) */}
        <div className="mobile-apps-section">
          <div className="mobile-section-header">
            <h3 className="mobile-section-title">
              <i className="fa-solid fa-shapes"></i> {locale === "ar" ? "المرافق والميزات" : locale === "en" ? "Portal Features" : "Semua Fitur Portal"}
            </h3>
            <span className="mobile-section-counter">
              {filteredMiniApps.length} {locale === "ar" ? "قائمة" : locale === "en" ? "Menus" : "Menu"}
            </span>
          </div>

          <div className="mobile-category-strip" role="tablist">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={mobileCategory === cat.id}
                onClick={() => setMobileCategory(cat.id)}
                className={`mobile-cat-pill ${mobileCategory === cat.id ? "active" : ""}`}
              >
                <i className={cat.icon}></i>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {filteredMiniApps.length > 0 ? (
            <div className="mobile-app-grid">
              {filteredMiniApps.map((app) => (
                <Link key={app.href} href={app.href} className="mobile-app-item">
                  <div className="mobile-app-icon-badge">
                    <i className={`fa-solid ${app.icon}`}></i>
                  </div>
                  <span className="mobile-app-name">{app.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mobile-apps-empty">
              <p>
                {locale === "ar"
                  ? `لا توجد ميزة مطابقة لـ "${searchQuery}"`
                  : locale === "en"
                    ? `No feature matched "${searchQuery}"`
                    : `Tidak ada fitur bernama "${searchQuery}"`}
              </p>
              <Link
                href={`/direktori?search=${encodeURIComponent(searchQuery.trim())}`}
                className="mobile-dir-fallback-btn"
              >
                <i className="fa-solid fa-address-book"></i>{" "}
                {locale === "ar" ? "ابحث في دليل الخريجين" : locale === "en" ? "Search in Alumni Directory" : `Cari "${searchQuery}" di Direktori Alumni`}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. DESKTOP VIEW: KTA DIGITAL SANTRI (SUPER KEREN & SINEMATIK > 900PX)
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
              <div className="card-bg">
                <img
                  src={item.bg}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="card-bg-img"
                />
              </div>
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
