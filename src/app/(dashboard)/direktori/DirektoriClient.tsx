"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Swiper from "swiper";
import { EffectCoverflow, Navigation, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import { getGelar, getGelarIcon, getBadgeColor } from "@/lib/gamification";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import "./direktori.css";

interface ProfileItem {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string | null;
  jenis_kelamin: string | null;
  foto_profil: string | null;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  alamat_lengkap: string | null;
  cita_cita: string | null;
  motivasi_hidup: string | null;
  akun_ig: string | null;
  akun_tiktok: string | null;
  no_whatsapp: string | null;
  role: string | null;
  is_active: boolean | null;
  prestise_points?: number | null;
  kelas?: string | null;
  tahun_masuk?: number | null;
  tahun_lulus?: number | null;
  privacy_settings?: {
    show_whatsapp?: boolean;
    show_social?: boolean;
    show_domisili?: boolean;
  } | null;
}

export default function DirektoriClient({
  alumni: initialAlumni,
  isLoggedIn,
  currentUserId,
}: {
  alumni: ProfileItem[];
  isLoggedIn: boolean;
  currentUserId: string | null;
}) {
  const { t } = useLanguage();
  const [alumni, setAlumni] = useState<ProfileItem[]>(initialAlumni || []);
  const [isSelfHealing, setIsSelfHealing] = useState(false);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "Laki-laki" | "Perempuan">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "points" | "recent">("name_asc");
  const [viewMode, setViewMode] = useState<"grid" | "coverflow" | "list">("grid");

  // Selected user for Mobile Bottom Sheet / Modal Detail
  const [selectedUser, setSelectedUser] = useState<ProfileItem | null>(null);
  const [sheetTab, setSheetTab] = useState<"biodata" | "kontak" | "visi">("biodata");
  const [isSheetClosing, setIsSheetClosing] = useState(false);

  // Pagination & Swiper states
  const [visibleCount, setVisibleCount] = useState(30);
  const [activeIndex, setActiveIndex] = useState(0);
  const [qrModalUser, setQrModalUser] = useState<ProfileItem | null>(null);
  const [failedPhotos, setFailedPhotos] = useState<{ [id: string]: boolean }>({});

  const swiperRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bottomSheetRef = useRef<HTMLDivElement>(null);

  // Trigger safe haptic
  const triggerHaptic = useCallback((duration = 12) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  }, []);

  // Sync state if initialAlumni changes
  useEffect(() => {
    if (initialAlumni && initialAlumni.length > 0) {
      setAlumni(initialAlumni);
    }
  }, [initialAlumni]);

  // Self-healing fallback if server prop was empty due to cache
  useEffect(() => {
    if (!initialAlumni || initialAlumni.length === 0) {
      setIsSelfHealing(true);
      const supabase = createClient();
      const fetchAlumni = async () => {
        try {
          const { data: fullData, error: fullError } = await supabase
            .from("profiles")
            .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, foto_profil, tempat_lahir, tanggal_lahir, alamat_lengkap, cita_cita, motivasi_hidup, akun_ig, akun_tiktok, no_whatsapp, role, is_active, prestise_points, kelas, tahun_masuk, tahun_lulus, privacy_settings")
            .or("is_active.eq.true,is_active.is.null")
            .order("id", { ascending: true });

          if (!fullError && fullData && fullData.length > 0) {
            setAlumni(fullData as any);
          } else {
            const { data: fallbackData } = await supabase
              .from("profiles")
              .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, foto_profil, tempat_lahir, tanggal_lahir, alamat_lengkap, cita_cita, motivasi_hidup, akun_ig, akun_tiktok, no_whatsapp, role, is_active, prestise_points")
              .or("is_active.eq.true,is_active.is.null")
              .order("id", { ascending: true });
            if (fallbackData && fallbackData.length > 0) {
              setAlumni(fallbackData as any);
            }
          }
        } catch {
          // ignore
        } finally {
          setIsSelfHealing(false);
        }
      };
      fetchAlumni();
    }
  }, [initialAlumni]);

  // CSS Scoping
  useEffect(() => {
    document.body.classList.add("page-direktori");
    return () => {
      document.body.classList.remove("page-direktori");
    };
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (selectedUser) closeBottomSheet();
        if (qrModalUser) setQrModalUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, qrModalUser]);

  // Close Bottom Sheet with smooth animation
  const closeBottomSheet = () => {
    setIsSheetClosing(true);
    setTimeout(() => {
      setSelectedUser(null);
      setIsSheetClosing(false);
      setSheetTab("biodata");
    }, 250);
  };

  const openUserDetail = (user: ProfileItem) => {
    triggerHaptic(15);
    setSelectedUser(user);
    setSheetTab("biodata");
  };

  // Distinct classes available
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    alumni.forEach((a) => {
      if (a.kelas && a.kelas.trim().length > 0) {
        classes.add(a.kelas.trim());
      }
    });
    return Array.from(classes).sort();
  }, [alumni]);

  // Filter & Sort Pipeline
  const filteredAndSortedAlumni = useMemo(() => {
    let result = alumni.filter((user) => {
      // 1. Text Search
      const searchString = `${user.nama_lengkap || ""} ${user.nama_panggilan || ""} ${user.alamat_lengkap || ""} ${user.tempat_lahir || ""} ${user.motivasi_hidup || ""} ${user.kelas || ""}`.toLowerCase();
      if (search.trim() && !searchString.includes(search.toLowerCase())) {
        return false;
      }

      // 2. Gender Filter
      if (genderFilter !== "all" && user.jenis_kelamin !== genderFilter) {
        return false;
      }

      // 3. Class Filter
      if (classFilter !== "all" && user.kelas !== classFilter) {
        return false;
      }

      return true;
    });

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "name_asc") {
        const nameA = a.nama_panggilan || a.nama_lengkap || "";
        const nameB = b.nama_panggilan || b.nama_lengkap || "";
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "name_desc") {
        const nameA = a.nama_panggilan || a.nama_lengkap || "";
        const nameB = b.nama_panggilan || b.nama_lengkap || "";
        return nameB.localeCompare(nameA);
      }
      if (sortBy === "points") {
        return (b.prestise_points || 0) - (a.prestise_points || 0);
      }
      return 0; // default order
    });

    return result;
  }, [alumni, search, genderFilter, classFilter, sortBy]);

  // Init Swiper if Coverflow mode is selected
  useEffect(() => {
    if (viewMode !== "coverflow") return;
    if (typeof window === "undefined") return;

    if (swiperRef.current) {
      try {
        swiperRef.current.destroy(true, true);
      } catch {}
    }

    const timer = setTimeout(() => {
      const isMobile = window.innerWidth < 768;
      try {
        swiperRef.current = new Swiper(".mySwiper", {
          modules: [EffectCoverflow, Navigation, Keyboard],
          effect: "coverflow",
          grabCursor: true,
          centeredSlides: true,
          slidesPerView: "auto",
          initialSlide: 0,
          speed: 500,
          touchRatio: 1.2,
          touchAngle: 45,
          threshold: 5,
          coverflowEffect: {
            rotate: isMobile ? 0 : 15,
            stretch: 0,
            depth: isMobile ? 80 : 350,
            modifier: 1,
            slideShadows: false,
          },
          navigation: { nextEl: "#btnNext", prevEl: "#btnPrev" },
          keyboard: { enabled: true },
          on: {
            slideChange: (swiper: any) => {
              setActiveIndex(swiper.activeIndex);
              triggerHaptic(10);
            },
          },
          observer: true,
          observeParents: true,
        });
      } catch (err) {
        console.error("Swiper init error:", err);
      }
    }, 60);

    return () => {
      clearTimeout(timer);
      if (swiperRef.current) {
        try {
          swiperRef.current.destroy(true, true);
        } catch {}
      }
    };
  }, [viewMode, filteredAndSortedAlumni, triggerHaptic]);

  const displayedAlumni = filteredAndSortedAlumni.slice(0, visibleCount);

  // Helper for masking WhatsApp phone
  const getWhatsAppLink = (user: ProfileItem) => {
    if (!isLoggedIn) return null; // Protect privacy from unauthenticated visitors
    const isOwner = currentUserId && currentUserId === user.id;
    const isPublic = user.privacy_settings?.show_whatsapp !== false;

    if (!user.no_whatsapp) return null;
    if (!isPublic && !isOwner) return null; // hidden by privacy

    let raw = user.no_whatsapp.replace(/\D/g, "");
    if (raw.startsWith("0")) raw = "62" + raw.slice(1);
    if (!raw.startsWith("62")) raw = "62" + raw;
    return `https://wa.me/${raw}?text=${encodeURIComponent("Assalamu'alaikum sahabat Expedient 43...")}`;
  };

  const formatDisplayPhone = (user: ProfileItem) => {
    if (!isLoggedIn) return "🔒 Terkunci (Khusus Anggota)";
    const isOwner = currentUserId && currentUserId === user.id;
    const isPublic = user.privacy_settings?.show_whatsapp !== false;

    if (!user.no_whatsapp) return "-";
    if (!isPublic && !isOwner) {
      // Masking: +62 812-••••-•••
      const raw = user.no_whatsapp.replace(/\D/g, "");
      return raw.length > 6 ? `+${raw.slice(0, 4)} ••••-••• (Privat)` : "Nomor Disembunyikan";
    }
    return user.no_whatsapp;
  };

  return (
    <div className="direktori-container">
      <div className="ethereal-glow"></div>

      {/* ================= STICKY SEARCH & FILTER CONTROL DECK ================= */}
      <div className="direktori-control-deck">
        {/* Search Input Bar */}
        <div className="search-pill-wrapper">
          <i className="fa-solid fa-magnifying-glass search-pill-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            className="search-pill-input"
            placeholder={t.direktori.search_placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-pill-clear"
              onClick={() => {
                setSearch("");
                searchInputRef.current?.focus();
                triggerHaptic(8);
              }}
              title="Hapus pencarian"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Filter Chips (Mobile-First) */}
        <div className="filter-chips-scroll">
          {/* Gender Filter Chips */}
          <button
            type="button"
            className={`chip-item ${genderFilter === "all" ? "active" : ""}`}
            onClick={() => {
              setGenderFilter("all");
              triggerHaptic(10);
            }}
          >
            <i className="fa-solid fa-users"></i> {t.direktori.filter_gender_all}
          </button>
          <button
            type="button"
            className={`chip-item chip-putra ${genderFilter === "Laki-laki" ? "active" : ""}`}
            onClick={() => {
              setGenderFilter(genderFilter === "Laki-laki" ? "all" : "Laki-laki");
              triggerHaptic(10);
            }}
          >
            <i className="fa-solid fa-mars"></i> {t.direktori.filter_gender_male}
          </button>
          <button
            type="button"
            className={`chip-item chip-putri ${genderFilter === "Perempuan" ? "active" : ""}`}
            onClick={() => {
              setGenderFilter(genderFilter === "Perempuan" ? "all" : "Perempuan");
              triggerHaptic(10);
            }}
          >
            <i className="fa-solid fa-venus"></i> {t.direktori.filter_gender_female}
          </button>

          {/* Class Filters (If available) */}
          {availableClasses.map((cls) => (
            <button
              key={cls}
              type="button"
              className={`chip-item ${classFilter === cls ? "active" : ""}`}
              onClick={() => {
                setClassFilter(classFilter === cls ? "all" : cls);
                triggerHaptic(10);
              }}
            >
              <i className="fa-solid fa-chalkboard-user"></i> Kelas {cls}
            </button>
          ))}
        </div>

        {/* View Switcher & Sorting Bar */}
        <div className="view-and-sort-bar">
          <div className="results-count">
            <span>{filteredAndSortedAlumni.length}</span> {t.direktori.stat_total}
          </div>

          <div className="controls-right">
            {/* Sort Selector */}
            <select
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                triggerHaptic(8);
              }}
            >
              <option value="name_asc">{t.direktori.sort_name_asc}</option>
              <option value="name_desc">{t.direktori.sort_name_desc}</option>
              <option value="points">{t.direktori.sort_points}</option>
            </select>

            {/* Layout Toggle Buttons */}
            <div className="view-mode-group">
              <button
                type="button"
                className={`mode-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => {
                  setViewMode("grid");
                  triggerHaptic(10);
                }}
                title={t.direktori.view_grid}
              >
                <i className="fa-solid fa-grip"></i>
              </button>
              <button
                type="button"
                className={`mode-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => {
                  setViewMode("list");
                  triggerHaptic(10);
                }}
                title={t.direktori.view_list}
              >
                <i className="fa-solid fa-list-ul"></i>
              </button>
              <button
                type="button"
                className={`mode-btn ${viewMode === "coverflow" ? "active" : ""}`}
                onClick={() => {
                  setViewMode("coverflow");
                  triggerHaptic(10);
                }}
                title={t.direktori.view_coverflow}
              >
                <i className="fa-solid fa-layer-group"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT LISTING ================= */}
      {filteredAndSortedAlumni.length === 0 ? (
        <div className="empty-direktori-state">
          {isSelfHealing ? (
            <div>
              <i className="fa-solid fa-circle-notch fa-spin empty-icon"></i>
              <p>Menghubungkan direktori alumni...</p>
            </div>
          ) : (
            <div>
              <i className="fa-solid fa-user-slash empty-icon"></i>
              <h3>Tidak ada alumni yang sesuai</h3>
              <p>Coba sesuaikan kata kunci atau bersihkan filter pencarian.</p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={() => {
                  setSearch("");
                  setGenderFilter("all");
                  setClassFilter("all");
                  triggerHaptic(12);
                }}
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 1. GRID CARDS VIEW (DEFAULT - SUPER MOBILE FRIENDLY) */}
          {viewMode === "grid" && (
            <div className="direktori-grid-container">
              {displayedAlumni.map((user) => {
                const foto = getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap);
                const gelar = getGelar(user.prestise_points || 0);
                const gelarIcon = getGelarIcon(user.prestise_points || 0);
                const badgeColor = getBadgeColor(user.prestise_points || 0);

                return (
                  <div
                    key={user.id}
                    className="alumni-grid-card cursor-bind"
                    onClick={() => openUserDetail(user)}
                  >
                    {/* Top Identity Row */}
                    <div className="card-top-row">
                      <div className="card-avatar-wrapper">
                        <Image
                          src={failedPhotos[user.id] ? getAvatarFallback(user.nama_panggilan || user.nama_lengkap) : foto}
                          width={72}
                          height={72}
                          className="card-avatar-img"
                          alt={user.nama_panggilan || user.nama_lengkap}
                          sizes="72px"
                          onError={() => setFailedPhotos((prev) => ({ ...prev, [user.id]: true }))}
                          unoptimized={foto.startsWith("data:") || foto.includes("ui-avatars.com")}
                        />
                        {user.jenis_kelamin === "Laki-laki" && (
                          <span className="gender-dot dot-putra" title="Putra">
                            <i className="fa-solid fa-mars"></i>
                          </span>
                        )}
                        {user.jenis_kelamin === "Perempuan" && (
                          <span className="gender-dot dot-putri" title="Putri">
                            <i className="fa-solid fa-venus"></i>
                          </span>
                        )}
                      </div>

                      <div className="card-heading">
                        <div className="card-nickname">{user.nama_panggilan || "Alumni"}</div>
                        <div className="card-fullname">{user.nama_lengkap}</div>
                        <div className="card-badges-row">
                          {user.kelas && <span className="badge-class">Kls {user.kelas}</span>}
                          <span className="badge-gelar" style={{ background: badgeColor }}>
                            <i className={gelarIcon}></i> {gelar}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="card-meta-list">
                      <div className="meta-item">
                        <i className="fa-solid fa-location-dot"></i>
                        <span>{user.alamat_lengkap || user.tempat_lahir || "Domisili belum diisi"}</span>
                      </div>
                      {user.cita_cita && (
                        <div className="meta-item aspiration">
                          <i className="fa-solid fa-compass"></i>
                          <span>{user.cita_cita}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Tap Action Hint */}
                    <div className="card-footer-tap">
                      <span>{t.direktori.card_detail_btn}</span>
                      <i className="fa-solid fa-chevron-right"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. COMPACT CONTACT LIST VIEW */}
          {viewMode === "list" && (
            <div className="direktori-list-container">
              {displayedAlumni.map((user) => {
                const foto = getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap);

                return (
                  <div
                    key={user.id}
                    className="alumni-list-row cursor-bind"
                    onClick={() => openUserDetail(user)}
                  >
                    <div className="list-avatar">
                      <Image
                        src={failedPhotos[user.id] ? getAvatarFallback(user.nama_panggilan || user.nama_lengkap) : foto}
                        width={46}
                        height={46}
                        className="list-avatar-img"
                        alt={user.nama_panggilan || user.nama_lengkap}
                        sizes="46px"
                        onError={() => setFailedPhotos((prev) => ({ ...prev, [user.id]: true }))}
                        unoptimized={foto.startsWith("data:") || foto.includes("ui-avatars.com")}
                      />
                    </div>

                    <div className="list-info">
                      <div className="list-primary-name">
                        <strong>{user.nama_panggilan || user.nama_lengkap}</strong>
                        {user.nama_panggilan && <span className="list-full-sub">({user.nama_lengkap})</span>}
                      </div>
                      <div className="list-meta-sub">
                        <span>{user.kelas ? `Kls ${user.kelas} • ` : ""}{user.tempat_lahir || user.alamat_lengkap || "Alumni 43"}</span>
                      </div>
                    </div>

                    <div className="list-right-arrow">
                      <i className="fa-solid fa-angle-right"></i>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. 3D SWIPER COVERFLOW VIEW (PRESERVED) */}
          {viewMode === "coverflow" && (
            <div className="coverflow-wrapper">
              <div className="mobile-swipe-hint">
                <i className="fa-solid fa-arrows-left-right"></i> Geser kartu ({activeIndex + 1} dari {filteredAndSortedAlumni.length})
              </div>

              <div className="swiper mySwiper">
                <div className="swiper-wrapper" id="swiperWrapper">
                  {displayedAlumni.map((user, idx) => {
                    const foto = getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap);
                    const gelar = getGelar(user.prestise_points || 0);

                    return (
                      <div key={user.id} className="swiper-slide alumni-slide">
                        <div className="luminary-card" onClick={() => openUserDetail(user)}>
                          <div className="photo-ring">
                            <Image
                              src={failedPhotos[user.id] ? getAvatarFallback(user.nama_panggilan || user.nama_lengkap) : foto}
                              width={150}
                              height={150}
                              className="card-photo"
                              alt={user.nama_panggilan || user.nama_lengkap}
                              priority={idx < 6}
                              sizes="150px"
                              onError={() => setFailedPhotos((prev) => ({ ...prev, [user.id]: true }))}
                              unoptimized={foto.startsWith("data:") || foto.includes("ui-avatars.com")}
                            />
                          </div>
                          <h3 className="card-name">{user.nama_panggilan}</h3>
                          <div className="card-full-name">{user.nama_lengkap}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--gold-main, #d4af37)", marginTop: "4px" }}>
                            {gelar} {user.kelas ? `• Kelas ${user.kelas}` : ""}
                          </div>

                          <div className="card-quote" style={{ margin: "14px 0", fontSize: "0.82rem", fontStyle: "italic", opacity: 0.85 }}>
                            "{user.motivasi_hidup || "Menjaga warisan, membangun masa depan."}"
                          </div>

                          <button
                            type="button"
                            className="btn-open-dossier"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserDetail(user);
                            }}
                          >
                            <i className="fa-solid fa-id-card"></i> {t.direktori.card_detail_btn}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="nav-arrow nav-prev" id="btnPrev">
                <i className="fa-solid fa-chevron-left"></i>
              </div>
              <div className="nav-arrow nav-next" id="btnNext">
                <i className="fa-solid fa-chevron-right"></i>
              </div>
            </div>
          )}

          {/* Load More Trigger */}
          {visibleCount < filteredAndSortedAlumni.length && (
            <div style={{ textAlign: "center", margin: "35px 0" }}>
              <button
                type="button"
                className="btn-load-more cursor-bind"
                onClick={() => {
                  setVisibleCount((prev) => Math.min(prev + 30, filteredAndSortedAlumni.length));
                  triggerHaptic(10);
                }}
              >
                <i className="fa-solid fa-angles-down"></i> Tampilkan Lebih Banyak ({filteredAndSortedAlumni.length - visibleCount} tersisa)
              </button>
            </div>
          )}
        </>
      )}

      {/* ================= NATIVE DRAGGABLE BOTTOM SHEET / MODAL DETAIL ================= */}
      {selectedUser && (
        <div
          className={`sheet-backdrop ${isSheetClosing ? "closing" : ""}`}
          onClick={closeBottomSheet}
        >
          <div
            ref={bottomSheetRef}
            className={`alumni-bottom-sheet ${isSheetClosing ? "closing" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull Bar (Mobile Native Handle) */}
            <div className="sheet-drag-handle" onClick={closeBottomSheet}>
              <div className="drag-pill"></div>
            </div>

            {/* Sheet Header */}
            <div className="sheet-header">
              <button
                type="button"
                className="sheet-close-btn"
                onClick={closeBottomSheet}
                title="Tutup (Esc)"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

              <div className="sheet-hero-row">
                <div className="sheet-avatar-ring">
                  <Image
                    src={failedPhotos[selectedUser.id] ? getAvatarFallback(selectedUser.nama_panggilan || selectedUser.nama_lengkap) : getAvatarUrl(selectedUser.foto_profil, selectedUser.nama_panggilan || selectedUser.nama_lengkap)}
                    width={90}
                    height={90}
                    className="sheet-avatar-img"
                    alt={selectedUser.nama_panggilan || selectedUser.nama_lengkap}
                    sizes="90px"
                    onError={() => setFailedPhotos((prev) => ({ ...prev, [selectedUser.id]: true }))}
                    unoptimized
                  />
                </div>

                <div className="sheet-hero-info">
                  <h2 className="sheet-user-name">{selectedUser.nama_lengkap}</h2>
                  <div className="sheet-user-panggilan">
                    Panggilan: <strong>{selectedUser.nama_panggilan || "-"}</strong>
                  </div>
                  <div className="sheet-badges-container">
                    <span
                      className="sheet-gelar-badge"
                      style={{ background: getBadgeColor(selectedUser.prestise_points || 0) }}
                    >
                      <i className={getGelarIcon(selectedUser.prestise_points || 0)}></i> {getGelar(selectedUser.prestise_points || 0)}
                    </span>
                    {selectedUser.kelas && <span className="sheet-class-badge">Kelas {selectedUser.kelas}</span>}
                    <span className="sheet-class-badge">Angkatan 43</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Dock (1-Click Actions) */}
            <div className="sheet-action-dock">
              {/* WhatsApp Direct Chat */}
              {(() => {
                if (!isLoggedIn) {
                  return (
                    <Link
                      href="/login"
                      className="dock-action-btn dock-disabled"
                      title="Masuk sebagai anggota alumni untuk menghubungi kontak"
                    >
                      <i className="fa-solid fa-lock"></i>
                      <span>WA Terkunci</span>
                    </Link>
                  );
                }
                const waLink = getWhatsAppLink(selectedUser);
                if (waLink) {
                  return (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dock-action-btn dock-whatsapp"
                      title="Kirim Pesan WhatsApp"
                      onClick={() => triggerHaptic(15)}
                    >
                      <i className="fa-brands fa-whatsapp"></i>
                      <span>WhatsApp</span>
                    </a>
                  );
                }
                return (
                  <button
                    type="button"
                    disabled
                    className="dock-action-btn dock-disabled"
                    title="Nomor WhatsApp disembunyikan oleh alumni demi privasi"
                  >
                    <i className="fa-solid fa-lock"></i>
                    <span>WA Privat</span>
                  </button>
                );
              })()}

              {/* Simpan Kontak vCard (.vcf) */}
              {isLoggedIn ? (
                <a
                  href={`/api/vcard/${selectedUser.id}`}
                  download={`Expedient_${(selectedUser.nama_panggilan || selectedUser.nama_lengkap || "Kontak").replace(/[^a-zA-Z0-9_-]/g, "_")}.vcf`}
                  className="dock-action-btn dock-vcard"
                  title="Simpan Kontak ke HP (.vcf)"
                  onClick={() => triggerHaptic(12)}
                >
                  <i className="fa-solid fa-address-card"></i>
                  <span>{t.direktori.card_vcard_btn}</span>
                </a>
              ) : (
                <Link
                  href="/login"
                  className="dock-action-btn dock-disabled"
                  title="Masuk untuk mengunduh kontak resmi alumni"
                >
                  <i className="fa-solid fa-lock"></i>
                  <span>{t.direktori.card_vcard_btn}</span>
                </Link>
              )}

              {/* Tampilkan QR Kontak */}
              <button
                type="button"
                className="dock-action-btn dock-qr"
                onClick={() => {
                  triggerHaptic(10);
                  setQrModalUser(selectedUser);
                }}
                title="Pindai QR Kontak"
              >
                <i className="fa-solid fa-qrcode"></i>
                <span>QR</span>
              </button>

              {/* Kirim Pesan Internal Portal */}
              {isLoggedIn && (
                <Link
                  href={`/chat/personal/${selectedUser.id}`}
                  className="dock-action-btn dock-chat"
                  title="Obrolan Internal Portal"
                  onClick={() => triggerHaptic(12)}
                >
                  <i className="fa-solid fa-comment-dots"></i>
                  <span>Portal</span>
                </Link>
              )}
            </div>

            {/* Sheet Tabs */}
            <div className="sheet-tabs-nav">
              <button
                type="button"
                className={`sheet-tab-btn ${sheetTab === "biodata" ? "active" : ""}`}
                onClick={() => {
                  setSheetTab("biodata");
                  triggerHaptic(8);
                }}
              >
                <i className="fa-solid fa-user"></i> {t.direktori.modal_personal}
              </button>
              <button
                type="button"
                className={`sheet-tab-btn ${sheetTab === "kontak" ? "active" : ""}`}
                onClick={() => {
                  setSheetTab("kontak");
                  triggerHaptic(8);
                }}
              >
                <i className="fa-solid fa-phone"></i> {t.direktori.modal_social}
              </button>
              <button
                type="button"
                className={`sheet-tab-btn ${sheetTab === "visi" ? "active" : ""}`}
                onClick={() => {
                  setSheetTab("visi");
                  triggerHaptic(8);
                }}
              >
                <i className="fa-solid fa-bullseye"></i> Visi & Sosial
              </button>
            </div>

            {/* Sheet Tab Body */}
            <div className="sheet-content-body">
              {sheetTab === "biodata" && (
                <div className="sheet-section-block">
                  <div className="sheet-field-group">
                    <span className="field-label">Tempat & Tanggal Lahir</span>
                    <span className="field-value">
                      {selectedUser.tempat_lahir || "-"}
                      {selectedUser.tanggal_lahir
                        ? `, ${new Date(selectedUser.tanggal_lahir).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}`
                        : ""}
                    </span>
                  </div>

                  <div className="sheet-field-group">
                    <span className="field-label">Alamat Domisili</span>
                    <span className="field-value">{selectedUser.alamat_lengkap || "Belum dicatat"}</span>
                  </div>

                  <div className="sheet-field-group">
                    <span className="field-label">Cita-cita & Aspirasi</span>
                    <span className="field-value">{selectedUser.cita_cita || "Menjadi pribadi yang berdaya guna bagi umat."}</span>
                  </div>
                </div>
              )}

              {sheetTab === "kontak" && (
                <div className="sheet-section-block">
                  <div className="sheet-field-group">
                    <span className="field-label">Nomor WhatsApp</span>
                    <span className="field-value">{formatDisplayPhone(selectedUser)}</span>
                    {!isLoggedIn ? (
                      <span className="privacy-shield-note" style={{ color: "#d4af37", marginTop: "6px", display: "inline-block" }}>
                        <i className="fa-solid fa-lock"></i> Kontak privat dilindungi. <Link href="/login" style={{ color: "#ffd700", textDecoration: "underline", fontWeight: 600 }}>Masuk ke Ruang Anggota</Link> untuk melihat nomor alumni.
                      </span>
                    ) : selectedUser.privacy_settings?.show_whatsapp === false && selectedUser.id !== currentUserId ? (
                      <span className="privacy-shield-note">
                        <i className="fa-solid fa-shield-halved"></i> Nomor kontak ini dilindungi privasi sesuai preferensi alumni.
                      </span>
                    ) : null}
                  </div>

                  <div className="sheet-field-group">
                    <span className="field-label">Kartu Kontak Digital</span>
                    <span className="field-value">
                      {isLoggedIn ? (
                        "Dapat diunduh langsung sebagai file vCard (.vcf) untuk disinkronkan otomatis dengan kontak smartphone Anda."
                      ) : (
                        <span>Unduhan file vCard (.vcf) hanya tersedia bagi sesama anggota angkatan. <Link href="/login" style={{ color: "#d4af37", textDecoration: "underline" }}>Masuk</Link></span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {sheetTab === "visi" && (
                <div className="sheet-section-block">
                  <div className="sheet-field-group">
                    <span className="field-label">Kutipan Hidup & Motivasi</span>
                    <blockquote className="sheet-quote">
                      "{selectedUser.motivasi_hidup || "Tetap ikhlas, sederhana, dan berdikari di mana pun melangkah."}"
                    </blockquote>
                  </div>

                  <div className="sheet-field-group">
                    <span className="field-label">Akun Sosial Media</span>
                    <div className="sheet-social-links">
                      {selectedUser.akun_ig ? (
                        <a
                          href={`https://instagram.com/${selectedUser.akun_ig.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sheet-social-badge ig-badge"
                        >
                          <i className="fa-brands fa-instagram"></i> @{selectedUser.akun_ig.replace("@", "")}
                        </a>
                      ) : (
                        <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>Instagram belum dicantumkan</span>
                      )}

                      {selectedUser.akun_tiktok && (
                        <a
                          href={`https://tiktok.com/@${selectedUser.akun_tiktok.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sheet-social-badge tt-badge"
                        >
                          <i className="fa-brands fa-tiktok"></i> @{selectedUser.akun_tiktok.replace("@", "")}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= QR CODE VCARD MODAL ================= */}
      {qrModalUser && (
        <div className="qr-modal-backdrop" onClick={() => setQrModalUser(null)}>
          <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="qr-card-tag">KARTU KONTAK DIGITAL</div>
            <h3 className="qr-card-title">{qrModalUser.nama_panggilan || qrModalUser.nama_lengkap}</h3>
            <p className="qr-card-desc">Arahkan kamera smartphone ke QR Code untuk simpan kontak otomatis.</p>

            <div className="qr-frame">
              {(() => {
                let rawPhone = (qrModalUser.no_whatsapp || "").replace(/\D/g, "");
                if (rawPhone.startsWith("0")) rawPhone = "62" + rawPhone.slice(1);
                const phoneFormatted = rawPhone ? `+${rawPhone}` : "";
                const isWaHidden = qrModalUser.privacy_settings?.show_whatsapp === false && qrModalUser.id !== currentUserId;

                const vcardPayload = [
                  "BEGIN:VCARD",
                  "VERSION:3.0",
                  `FN:${qrModalUser.nama_lengkap || qrModalUser.nama_panggilan}`,
                  `N:${qrModalUser.nama_lengkap || qrModalUser.nama_panggilan};;;;`,
                  `NICKNAME:${qrModalUser.nama_panggilan || ""}`,
                  "ORG:Expedient Generation 43",
                  !isWaHidden && phoneFormatted ? `TEL;TYPE=CELL,VOICE:${phoneFormatted}` : "",
                  "NOTE:Alumni Expedient Generation Angkatan 43",
                  "END:VCARD",
                ]
                  .filter(Boolean)
                  .join("\r\n");

                return (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(vcardPayload)}`}
                    alt="QR Code Kontak"
                    className="qr-img-canvas"
                  />
                );
              })()}
            </div>

            <div className="qr-card-actions">
              <a
                href={`/api/vcard/${qrModalUser.id}`}
                download={`Expedient_${(qrModalUser.nama_panggilan || qrModalUser.nama_lengkap || "Kontak").replace(/[^a-zA-Z0-9_-]/g, "_")}.vcf`}
                className="btn-download-vcf"
              >
                <i className="fa-solid fa-download"></i> Unduh File .vcf
              </a>
              <button
                type="button"
                className="btn-close-qr"
                onClick={() => setQrModalUser(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
