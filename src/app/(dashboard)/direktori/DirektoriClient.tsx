"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Swiper from "swiper";
import { EffectCoverflow, Navigation, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "./direktori.css";

import { createClient } from "@/lib/supabase/client";
import { getAvatarFallback, getAvatarUrl } from "@/lib/avatar";
import { getGelar, getGelarIcon } from "@/lib/gamification";
import { ASATIDZ_ITEMS, AsatidzItem } from "@/lib/data/asatidzData";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProfileItem, buildWhatsAppLink } from "./types";
import { AlumniDetailSheet, QrContactModal } from "./components/AlumniDetailSheet";
import { AsatidzSection } from "./components/AsatidzSection";

interface DirektoriClientProps {
  alumni: ProfileItem[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}

const FATIHAH_STORAGE_KEY = "ekspi_asatidz_fatihah_v1";
const PAGE_SIZE = 30;
const COVERFLOW_LIMIT = 60;

export default function DirektoriClient({
  alumni: initialAlumni,
  isLoggedIn,
  currentUserId,
}: DirektoriClientProps) {
  const { locale, t } = useLanguage();
  const [alumni, setAlumni] = useState<ProfileItem[]>(initialAlumni);
  const [isFallbackLoading, setIsFallbackLoading] = useState(
    initialAlumni.length === 0
  );

  // Sync SSR updates
  useEffect(() => {
    setAlumni(initialAlumni);
    if (initialAlumni.length > 0) {
      setIsFallbackLoading(false);
    }
  }, [initialAlumni]);

  // Self-healing fallback fetch when SSR prop arrives empty
  useEffect(() => {
    if (initialAlumni.length > 0) return;

    let active = true;
    async function fallbackFetch() {
      setIsFallbackLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, nama_lengkap, nama_panggilan, jenis_kelamin, foto_profil, tempat_lahir, tanggal_lahir, alamat_lengkap, cita_cita, motivasi_hidup, akun_ig, akun_tiktok, no_whatsapp, role, is_active, prestise_points, kelas, tahun_masuk, tahun_lulus, privacy_settings"
          )
          .order("nama_lengkap", { ascending: true });

        if (!error && data && active) {
          const sanitized: ProfileItem[] = isLoggedIn
            ? (data as ProfileItem[])
            : (data as ProfileItem[]).map((item) => ({
                ...item,
                no_whatsapp: null,
                tanggal_lahir: null,
                alamat_lengkap: item.alamat_lengkap
                  ? item.alamat_lengkap.split(",").pop()?.trim() || "Indonesia"
                  : null,
              }));
          setAlumni(sanitized);
        }
      } catch {
        // Silent fallback on offline or transient error
      } finally {
        if (active) setIsFallbackLoading(false);
      }
    }

    fallbackFetch();
    return () => {
      active = false;
    };
  }, [initialAlumni.length, isLoggedIn]);

  // Top-level directory tab & filters
  const [activeMainTab, setActiveMainTab] = useState<"alumni" | "asatidz">("alumni");
  const [asatidzCategory, setAsatidzCategory] = useState<
    "all" | "pimpinan" | "guru" | "tutor" | "ustadzah"
  >("all");
  const [selectedAsatidz, setSelectedAsatidz] = useState<AsatidzItem | null>(null);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "L" | "P">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "points">("name_asc");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "coverflow">("grid");
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Modals / Bottom sheet state
  const [selectedUser, setSelectedUser] = useState<ProfileItem | null>(null);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [qrModalUser, setQrModalUser] = useState<ProfileItem | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const [coverflowIndex, setCoverflowIndex] = useState(0);

  // Al-Fatihah devotion counts for Asatidz
  const [fatihahCounts, setFatihahCounts] = useState<Record<string, number>>({});
  const [fatihahToast, setFatihahToast] = useState<Record<string, boolean>>({});
  const urlSyncReadyRef = useRef(false);

  // Hydrate directory search & filters from URL query parameters cleanly after mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      const g = params.get("gender");
      const k = params.get("kelas");
      const s = params.get("sort");
      const tab = params.get("tab");
      if (q) setSearch(q);
      if (g === "L" || g === "P") setGenderFilter(g);
      if (k) setClassFilter(k);
      if (s === "name_asc" || s === "name_desc" || s === "points") setSortBy(s);
      if (tab === "alumni" || tab === "asatidz") setActiveMainTab(tab);
    } catch {
      // Ignore query parse failures
    } finally {
      urlSyncReadyRef.current = true;
    }
  }, []);

  // Persist directory filters to URL without page navigation
  useEffect(() => {
    if (!urlSyncReadyRef.current || typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (activeMainTab !== "alumni") params.set("tab", activeMainTab);
    if (search.trim()) params.set("q", search.trim());
    if (genderFilter !== "all") params.set("gender", genderFilter);
    if (classFilter !== "all") params.set("kelas", classFilter);
    if (sortBy !== "name_asc") params.set("sort", sortBy);
    const qs = params.toString();
    const targetUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.replaceState(null, "", targetUrl);
    }
  }, [activeMainTab, search, genderFilter, classFilter, sortBy]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(FATIHAH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setFatihahCounts(parsed);
        }
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const swiperContainerRef = useRef<HTMLDivElement>(null);
  const swiperInstanceRef = useRef<Swiper | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerHaptic = useCallback((duration = 10) => {
    try {
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(duration);
      }
    } catch {
      // Ignore unsupported environments
    }
  }, []);

  const handlePhotoError = useCallback((userId: string) => {
    setFailedPhotos((prev) => (prev[userId] ? prev : { ...prev, [userId]: true }));
  }, []);

  const openBottomSheet = useCallback(
    (user: ProfileItem) => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsSheetClosing(false);
      setSelectedUser(user);
      triggerHaptic(12);
    },
    [triggerHaptic]
  );

  const closeBottomSheet = useCallback(() => {
    setIsSheetClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedUser(null);
      setIsSheetClosing(false);
    }, 240);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleGiftFatihah = useCallback(
    (id: string) => {
      triggerHaptic(15);
      setFatihahCounts((prev) => {
        const next = { ...prev, [id]: (prev[id] || 0) + 1 };
        try {
          localStorage.setItem(FATIHAH_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota/storage errors
        }
        return next;
      });
      setFatihahToast((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setFatihahToast((prev) => ({ ...prev, [id]: false }));
      }, 3200);
    },
    [triggerHaptic]
  );

  // Body + main-wrapper scroll lock when any overlay/sheet is open
  useEffect(() => {
    const isOverlayOpen = Boolean(selectedUser || qrModalUser || selectedAsatidz);
    if (!isOverlayOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const mainWrapper = document.querySelector(".main-wrapper") as HTMLElement | null;
    const prevWrapperOverflow = mainWrapper ? mainWrapper.style.overflow : "";

    document.body.style.overflow = "hidden";
    if (mainWrapper) {
      mainWrapper.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (mainWrapper) {
        mainWrapper.style.overflow = prevWrapperOverflow;
      }
    };
  }, [selectedUser, qrModalUser, selectedAsatidz]);

  // Global keyboard shortcuts ('/' to search, 'Escape' to close overlays)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (qrModalUser) {
          setQrModalUser(null);
          return;
        }
        if (selectedAsatidz) {
          setSelectedAsatidz(null);
          return;
        }
        if (selectedUser) {
          closeBottomSheet();
          return;
        }
        if (document.activeElement === searchInputRef.current && search) {
          setSearch("");
        }
      }

      if (
        e.key === "/" &&
        activeMainTab === "alumni" &&
        !selectedUser &&
        !qrModalUser &&
        !selectedAsatidz
      ) {
        const tag = (document.activeElement?.tagName || "").toUpperCase();
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeMainTab,
    closeBottomSheet,
    qrModalUser,
    search,
    selectedAsatidz,
    selectedUser,
  ]);

  // Extract sorted class filters & gender counts
  const { uniqueClasses, genderCounts } = useMemo(() => {
    const classSet = new Set<string>();
    let male = 0;
    let female = 0;

    for (const item of alumni) {
      if (item.kelas?.trim()) {
        classSet.add(item.kelas.trim());
      }
      const g = (item.jenis_kelamin || "").trim().toUpperCase();
      if (g.startsWith("L")) male += 1;
      else if (g.startsWith("P")) female += 1;
    }

    const sortedClasses = Array.from(classSet).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );

    return {
      uniqueClasses: sortedClasses,
      genderCounts: { all: alumni.length, L: male, P: female },
    };
  }, [alumni]);

  // Filter & sort alumni
  const filteredAndSortedAlumni = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = alumni.filter((user) => {
      if (genderFilter !== "all") {
        const g = (user.jenis_kelamin || "").trim().toUpperCase();
        if (!g.startsWith(genderFilter)) return false;
      }

      if (classFilter !== "all") {
        if ((user.kelas || "").trim() !== classFilter) return false;
      }

      if (!q) return true;
      return (
        (user.nama_lengkap || "").toLowerCase().includes(q) ||
        (user.nama_panggilan || "").toLowerCase().includes(q) ||
        (user.alamat_lengkap || "").toLowerCase().includes(q) ||
        (user.tempat_lahir || "").toLowerCase().includes(q) ||
        (user.cita_cita || "").toLowerCase().includes(q) ||
        (user.kelas || "").toLowerCase().includes(q) ||
        (user.motivasi_hidup || "").toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "name_asc") {
        return (a.nama_lengkap || "").localeCompare(b.nama_lengkap || "", "id");
      }
      if (sortBy === "name_desc") {
        return (b.nama_lengkap || "").localeCompare(a.nama_lengkap || "", "id");
      }
      const diff = (b.prestise_points || 0) - (a.prestise_points || 0);
      if (diff !== 0) return diff;
      return (a.nama_lengkap || "").localeCompare(b.nama_lengkap || "", "id");
    });
  }, [alumni, classFilter, genderFilter, search, sortBy]);

  // Reset pagination when criteria change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setCoverflowIndex(0);
  }, [search, genderFilter, classFilter, sortBy, activeMainTab]);

  // Auto-paginate on scroll sentinel
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (
      !sentinel ||
      activeMainTab !== "alumni" ||
      viewMode === "coverflow" ||
      visibleCount >= filteredAndSortedAlumni.length
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + PAGE_SIZE, filteredAndSortedAlumni.length)
          );
        }
      },
      { rootMargin: "220px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeMainTab, filteredAndSortedAlumni.length, viewMode, visibleCount]);

  const coverflowAlumni = useMemo(
    () => filteredAndSortedAlumni.slice(0, COVERFLOW_LIMIT),
    [filteredAndSortedAlumni]
  );

  // Initialize Swiper 3D Coverflow when active
  useEffect(() => {
    if (
      activeMainTab !== "alumni" ||
      viewMode !== "coverflow" ||
      coverflowAlumni.length === 0 ||
      !swiperContainerRef.current
    ) {
      if (swiperInstanceRef.current) {
        swiperInstanceRef.current.destroy(true, true);
        swiperInstanceRef.current = null;
      }
      return;
    }

    if (swiperInstanceRef.current) {
      swiperInstanceRef.current.destroy(true, true);
      swiperInstanceRef.current = null;
    }

    const swiper = new Swiper(swiperContainerRef.current, {
      modules: [EffectCoverflow, Navigation, Keyboard],
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      initialSlide: Math.min(2, Math.max(0, coverflowAlumni.length - 1)),
      coverflowEffect: {
        rotate: 22,
        stretch: 0,
        depth: 160,
        modifier: 1,
        slideShadows: false,
      },
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      keyboard: {
        enabled: true,
      },
      on: {
        init(sw) {
          setCoverflowIndex(sw.activeIndex);
        },
        slideChange(sw) {
          setCoverflowIndex(sw.activeIndex);
        },
      },
    });

    swiperInstanceRef.current = swiper;

    return () => {
      swiper.destroy(true, true);
      swiperInstanceRef.current = null;
    };
  }, [activeMainTab, viewMode, coverflowAlumni]);

  const visibleAlumni = useMemo(
    () => filteredAndSortedAlumni.slice(0, visibleCount),
    [filteredAndSortedAlumni, visibleCount]
  );

  const hasActiveFilter =
    Boolean(search.trim()) || genderFilter !== "all" || classFilter !== "all";

  const resetAllFilters = () => {
    setSearch("");
    setGenderFilter("all");
    setClassFilter("all");
    triggerHaptic(10);
  };

  const pageTitle =
    locale === "ar"
      ? "دليل الخريجين والأساتذة"
      : locale === "en"
      ? "Cohort 43 Directory"
      : "Direktori Angkatan 43";

  return (
    <div className="direktori-container">
      {/* Compact Operational Header */}
      <header className="direktori-header">
        <div className="direktori-header-top">
          <div>
            <h1 className="direktori-title">{pageTitle}</h1>
            <p className="direktori-summary">
              <span>
                <strong>{alumni.length}</strong> {t.direktori.stat_total}
              </span>
              <span aria-hidden="true">•</span>
              <span>
                <strong>{ASATIDZ_ITEMS.length}</strong> {t.direktori_extra.tab_asatidz}
              </span>
            </p>
          </div>

          <div
            className="direktori-main-tabs"
            role="tablist"
            aria-label={pageTitle}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeMainTab === "alumni"}
              className={`main-tab-btn ${activeMainTab === "alumni" ? "active" : ""}`}
              onClick={() => {
                setActiveMainTab("alumni");
                triggerHaptic(10);
              }}
            >
              <i className="fa-solid fa-user-graduate" aria-hidden="true"></i>
              <span>{t.direktori_extra.tab_alumni}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMainTab === "asatidz"}
              className={`main-tab-btn ${activeMainTab === "asatidz" ? "active" : ""}`}
              onClick={() => {
                setActiveMainTab("asatidz");
                triggerHaptic(10);
              }}
            >
              <i className="fa-solid fa-mosque" aria-hidden="true"></i>
              <span>{t.direktori_extra.tab_asatidz}</span>
            </button>
          </div>
        </div>
      </header>

      {activeMainTab === "asatidz" ? (
        <AsatidzSection
          search={search}
          onSearchChange={setSearch}
          asatidzCategory={asatidzCategory}
          onCategoryChange={setAsatidzCategory}
          selectedAsatidz={selectedAsatidz}
          onSelectAsatidz={setSelectedAsatidz}
          fatihahCounts={fatihahCounts}
          fatihahToast={fatihahToast}
          onGiftFatihah={handleGiftFatihah}
          triggerHaptic={triggerHaptic}
          locale={locale}
          t={t}
        />
      ) : (
        <>
          {/* Sticky Search & Filter Control Deck */}
          <div className="direktori-control-deck">
            <div className="search-pill-wrapper">
              <i
                className="fa-solid fa-magnifying-glass search-pill-icon"
                aria-hidden="true"
              ></i>
              <input
                ref={searchInputRef}
                type="search"
                className="search-pill-input"
                placeholder={t.direktori.search_placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t.direktori.search_placeholder}
              />
              {search ? (
                <button
                  type="button"
                  className="search-pill-clear"
                  onClick={() => {
                    setSearch("");
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Hapus pencarian"
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
              ) : (
                <kbd className="search-shortcut-kbd" aria-hidden="true">
                  /
                </kbd>
              )}
            </div>

            {/* Gender & Class Chips */}
            <div
              className="filter-chips-scroll"
              role="region"
              aria-label="Filter alumni"
            >
              <button
                type="button"
                className={`chip-item ${genderFilter === "all" && classFilter === "all" ? "active" : ""}`}
                onClick={resetAllFilters}
              >
                <span>{t.direktori.filter_gender_all}</span>
                <span className="chip-count">{genderCounts.all}</span>
              </button>

              <button
                type="button"
                className={`chip-item ${genderFilter === "L" ? "active" : ""}`}
                onClick={() => {
                  setGenderFilter((prev) => (prev === "L" ? "all" : "L"));
                  triggerHaptic(8);
                }}
              >
                <span>{t.direktori.filter_gender_male}</span>
                <span className="chip-count">{genderCounts.L}</span>
              </button>

              <button
                type="button"
                className={`chip-item ${genderFilter === "P" ? "active" : ""}`}
                onClick={() => {
                  setGenderFilter((prev) => (prev === "P" ? "all" : "P"));
                  triggerHaptic(8);
                }}
              >
                <span>{t.direktori.filter_gender_female}</span>
                <span className="chip-count">{genderCounts.P}</span>
              </button>

              {uniqueClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  className={`chip-item ${classFilter === cls ? "active" : ""}`}
                  onClick={() => {
                    setClassFilter((prev) => (prev === cls ? "all" : cls));
                    triggerHaptic(8);
                  }}
                >
                  <span>
                    {t.direktori_extra.filter_class_prefix} {cls}
                  </span>
                </button>
              ))}
            </div>

            {/* Count + Sort + View Mode Bar */}
            <div className="view-and-sort-bar">
              <div className="results-count">
                <strong>{filteredAndSortedAlumni.length}</strong>{" "}
                {locale === "ar"
                  ? "نتيجة"
                  : locale === "en"
                  ? "matched"
                  : "alumni ditemukan"}
                {hasActiveFilter && (
                  <button
                    type="button"
                    className="inline-reset-btn"
                    onClick={resetAllFilters}
                  >
                    {t.direktori.reset_filter}
                  </button>
                )}
              </div>

              <div className="controls-right-group">
                <select
                  className="sort-dropdown"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as "name_asc" | "name_desc" | "points");
                    triggerHaptic(8);
                  }}
                  aria-label="Urutkan daftar alumni"
                >
                  <option value="name_asc">{t.direktori.sort_name_asc}</option>
                  <option value="name_desc">{t.direktori.sort_name_desc}</option>
                  <option value="points">{t.direktori.sort_points}</option>
                </select>

                <div className="view-mode-group" role="group" aria-label="Mode tampilan">
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("grid");
                      triggerHaptic(8);
                    }}
                    title={t.direktori.view_grid}
                    aria-label={t.direktori.view_grid}
                    aria-pressed={viewMode === "grid"}
                  >
                    <i className="fa-solid fa-table-cells-large" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("list");
                      triggerHaptic(8);
                    }}
                    title={t.direktori.view_list}
                    aria-label={t.direktori.view_list}
                    aria-pressed={viewMode === "list"}
                  >
                    <i className="fa-solid fa-list" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === "coverflow" ? "active" : ""}`}
                    onClick={() => {
                      setViewMode("coverflow");
                      triggerHaptic(8);
                    }}
                    title={t.direktori.view_coverflow}
                    aria-label={t.direktori.view_coverflow}
                    aria-pressed={viewMode === "coverflow"}
                  >
                    <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Directory Body */}
          {isFallbackLoading ? (
            <div className="direktori-loading-banner" role="status">
              <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i>
              <span>{t.direktori.connecting_text}</span>
            </div>
          ) : filteredAndSortedAlumni.length === 0 ? (
            <div className="empty-direktori-state">
              <i className="fa-solid fa-user-slash empty-icon" aria-hidden="true"></i>
              <h3>{t.direktori.empty_title}</h3>
              <p>{t.direktori.empty_desc}</p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={resetAllFilters}
              >
                {t.direktori.reset_filter}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <>
              <div className="direktori-grid-container">
                {visibleAlumni.map((user) => {
                  const displayNickname = user.nama_panggilan || "Alumni 43";
                  const points = user.prestise_points || 0;
                  const waLink = buildWhatsAppLink(user, isLoggedIn, currentUserId);
                  const subtitleText =
                    user.alamat_lengkap ||
                    user.cita_cita ||
                    user.tempat_lahir ||
                    getGelar(points);

                  return (
                    <article key={user.id} className="alumni-card">
                      <button
                        type="button"
                        className="card-open-trigger"
                        onClick={() => openBottomSheet(user)}
                        aria-label={`${user.nama_lengkap} - ${t.direktori.card_detail_btn}`}
                      >
                        <div className="card-avatar-wrap">
                          <Image
                            src={
                              failedPhotos[user.id]
                                ? getAvatarFallback(displayNickname || user.nama_lengkap)
                                : getAvatarUrl(
                                    user.foto_profil,
                                    displayNickname || user.nama_lengkap
                                  )
                            }
                            width={64}
                            height={64}
                            className="card-avatar-img"
                            alt={user.nama_lengkap}
                            sizes="(min-width: 640px) 64px, 52px"
                            onError={() => handlePhotoError(user.id)}
                            unoptimized
                          />
                        </div>

                        <div className="card-info">
                          <div className="card-name-row">
                            <h2 className="card-name">{user.nama_lengkap}</h2>
                            {user.kelas && (
                              <span className="card-class-pill">{user.kelas}</span>
                            )}
                          </div>

                          <div className="card-gelar-line">
                            <i className={getGelarIcon(points)} aria-hidden="true"></i>
                            <span>
                              {displayNickname} • {getGelar(points)}
                            </span>
                          </div>

                          <div className="card-meta-line">
                            <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
                            <span>{subtitleText}</span>
                          </div>
                        </div>
                      </button>

                      <div className="card-actions">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-quick-action is-wa"
                            title={t.direktori.contact_wa}
                            aria-label={`${t.direktori.contact_wa}: ${user.nama_lengkap}`}
                            onClick={() => triggerHaptic(12)}
                          >
                            <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
                          </a>
                        ) : isLoggedIn ? (
                          <Link
                            href={`/chat/personal/${user.id}`}
                            className="card-quick-action is-chat"
                            title={`Chat ${displayNickname}`}
                            aria-label={`Chat ${user.nama_lengkap}`}
                            onClick={() => triggerHaptic(10)}
                          >
                            <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
                          </Link>
                        ) : null}

                        <button
                          type="button"
                          className="card-chevron-btn"
                          onClick={() => openBottomSheet(user)}
                          aria-label={t.direktori.card_detail_btn}
                          tabIndex={-1}
                        >
                          <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleCount < filteredAndSortedAlumni.length && (
                <div className="load-more-container" ref={loadMoreSentinelRef}>
                  <button
                    type="button"
                    className="btn-load-more"
                    onClick={() => {
                      setVisibleCount((prev) => prev + PAGE_SIZE);
                      triggerHaptic(8);
                    }}
                  >
                    {locale === "ar"
                      ? `عرض المزيد (${filteredAndSortedAlumni.length - visibleCount})`
                      : locale === "en"
                      ? `Load more (${filteredAndSortedAlumni.length - visibleCount} remaining)`
                      : `Muat ${Math.min(
                          PAGE_SIZE,
                          filteredAndSortedAlumni.length - visibleCount
                        )} Alumni Lagi`}
                  </button>
                </div>
              )}
            </>
          ) : viewMode === "list" ? (
            <>
              <div className="direktori-list-container">
                {visibleAlumni.map((user) => {
                  const displayNickname = user.nama_panggilan || "Alumni 43";
                  const waLink = buildWhatsAppLink(user, isLoggedIn, currentUserId);
                  return (
                    <article key={user.id} className="list-row-item">
                      <button
                        type="button"
                        className="list-row-trigger"
                        onClick={() => openBottomSheet(user)}
                        aria-label={`${user.nama_lengkap} - ${t.direktori.card_detail_btn}`}
                      >
                        <Image
                          src={
                            failedPhotos[user.id]
                              ? getAvatarFallback(displayNickname || user.nama_lengkap)
                              : getAvatarUrl(
                                  user.foto_profil,
                                  displayNickname || user.nama_lengkap
                                )
                          }
                          width={40}
                          height={40}
                          className="list-avatar-img"
                          alt={user.nama_lengkap}
                          sizes="40px"
                          onError={() => handlePhotoError(user.id)}
                          unoptimized
                        />
                        <div className="list-row-info">
                          <div className="list-row-name">{user.nama_lengkap}</div>
                          <div className="list-row-meta">
                            <span>{displayNickname}</span>
                            {user.kelas && <span>• Kelas {user.kelas}</span>}
                            {user.alamat_lengkap && <span>• {user.alamat_lengkap}</span>}
                          </div>
                        </div>
                      </button>

                      <div className="list-row-actions">
                        {waLink ? (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card-quick-action is-wa"
                            title={t.direktori.contact_wa}
                            aria-label={`${t.direktori.contact_wa}: ${user.nama_lengkap}`}
                          >
                            <i className="fa-brands fa-whatsapp" aria-hidden="true"></i>
                          </a>
                        ) : isLoggedIn ? (
                          <Link
                            href={`/chat/personal/${user.id}`}
                            className="card-quick-action is-chat"
                            title={`Chat ${displayNickname}`}
                            aria-label={`Chat ${user.nama_lengkap}`}
                          >
                            <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
                          </Link>
                        ) : null}

                        <button
                          type="button"
                          className="card-chevron-btn"
                          onClick={() => openBottomSheet(user)}
                          aria-label={t.direktori.card_detail_btn}
                          tabIndex={-1}
                        >
                          <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleCount < filteredAndSortedAlumni.length && (
                <div className="load-more-container" ref={loadMoreSentinelRef}>
                  <button
                    type="button"
                    className="btn-load-more"
                    onClick={() => {
                      setVisibleCount((prev) => prev + PAGE_SIZE);
                      triggerHaptic(8);
                    }}
                  >
                    {locale === "ar"
                      ? `عرض المزيد (${filteredAndSortedAlumni.length - visibleCount})`
                      : locale === "en"
                      ? `Load more (${filteredAndSortedAlumni.length - visibleCount} remaining)`
                      : `Muat ${Math.min(
                          PAGE_SIZE,
                          filteredAndSortedAlumni.length - visibleCount
                        )} Alumni Lagi`}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="coverflow-view-shell">
              <div className="swiper coverflow-swiper" ref={swiperContainerRef}>
                <div className="swiper-wrapper">
                  {coverflowAlumni.map((user) => {
                    const displayNickname = user.nama_panggilan || "Alumni 43";
                    const points = user.prestise_points || 0;
                    return (
                      <div key={user.id} className="swiper-slide coverflow-slide">
                        <article className="coverflow-card">
                          <div className="coverflow-avatar-wrap">
                            <Image
                              src={
                                failedPhotos[user.id]
                                  ? getAvatarFallback(displayNickname || user.nama_lengkap)
                                  : getAvatarUrl(
                                      user.foto_profil,
                                      displayNickname || user.nama_lengkap
                                    )
                              }
                              width={112}
                              height={112}
                              className="coverflow-avatar-img"
                              alt={user.nama_lengkap}
                              sizes="112px"
                              onError={() => handlePhotoError(user.id)}
                              unoptimized
                            />
                          </div>
                          <h2 className="coverflow-name">{user.nama_lengkap}</h2>
                          <div className="coverflow-sub">
                            {displayNickname}
                            {user.kelas ? ` • Kelas ${user.kelas}` : ""}
                          </div>
                          <div className="coverflow-gelar">
                            <i className={getGelarIcon(points)} aria-hidden="true"></i>
                            <span>{getGelar(points)}</span>
                          </div>
                          {user.alamat_lengkap && (
                            <div className="coverflow-domisili">{user.alamat_lengkap}</div>
                          )}
                          <button
                            type="button"
                            className="coverflow-detail-btn"
                            onClick={() => openBottomSheet(user)}
                          >
                            {t.direktori.card_detail_btn}
                          </button>
                        </article>
                      </div>
                    );
                  })}
                </div>
                <div className="swiper-button-prev" aria-label="Slide sebelumnya"></div>
                <div className="swiper-button-next" aria-label="Slide berikutnya"></div>
              </div>

              <div className="coverflow-footer-status">
                <span>
                  {Math.min(coverflowIndex + 1, coverflowAlumni.length)} /{" "}
                  {coverflowAlumni.length}
                </span>
                {filteredAndSortedAlumni.length > COVERFLOW_LIMIT && (
                  <span>
                    (Menampilkan {COVERFLOW_LIMIT} pertama dari{" "}
                    {filteredAndSortedAlumni.length})
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Sheet & Local QR Modal */}
      <AlumniDetailSheet
        user={selectedUser}
        isClosing={isSheetClosing}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        failedPhotos={failedPhotos}
        onPhotoError={handlePhotoError}
        onClose={closeBottomSheet}
        onOpenQr={(u) => setQrModalUser(u)}
        triggerHaptic={triggerHaptic}
        locale={locale}
        t={t}
      />

      <QrContactModal
        user={qrModalUser}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        onClose={() => setQrModalUser(null)}
        locale={locale}
        t={t}
      />
    </div>
  );
}
