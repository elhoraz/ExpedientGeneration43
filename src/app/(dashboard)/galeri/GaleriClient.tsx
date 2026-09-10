"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import "./galeri.css";

export interface AlbumItem {
  id: string;
  title: string;
  description?: string | null;
  cover_url?: string | null;
  year?: number | null;
  icon?: string | null;
}

export interface PhotoItem {
  id: string;
  image_url: string;
  caption?: string | null;
  created_at?: string | null;
  likes_count: number;
  year?: number | null;
  album_id?: string | null;
  uploader_id?: string | null;
  uploader_name?: string;
  uploader_avatar?: string | null;
  is_liked?: boolean;
}

// Curated Showcase Fallback Photos if database is fresh
const SHOWCASE_FALLBACK_PHOTOS: PhotoItem[] = [
  {
    id: "showcase-1",
    image_url: "/assets/foto_putra/Cover Depan.webp",
    caption: "Sampul Emas Mahakarya Angkatan 43 — The Syndicate & Omega",
    likes_count: 43,
    year: 2025,
    album_id: "wisuda",
    uploader_name: "Presidium Expedient",
    is_liked: false,
  },
  {
    id: "showcase-2",
    image_url: "/assets/foto_putra/Hal 1.webp",
    caption: "Prakata & Kilas Balik Perjalanan 6 Tahun Pengabdian",
    likes_count: 28,
    year: 2025,
    album_id: "keseharian",
    uploader_name: "Redaksi Yearbook",
    is_liked: false,
  },
  {
    id: "showcase-3",
    image_url: "/assets/foto_putri/Cover Depan.webp",
    caption: "Arsip Keagungan Omega Dynasty — Generasi Putri 43",
    likes_count: 39,
    year: 2025,
    album_id: "wisuda",
    uploader_name: "Presidium Putri",
    is_liked: false,
  },
  {
    id: "showcase-4",
    image_url: "/assets/foto_putra/Hal 3.webp",
    caption: "Dokumentasi Pagelaran Seni & Panggung Gembira (PG)",
    likes_count: 52,
    year: 2024,
    album_id: "pg",
    uploader_name: "Divisi Dokumentasi",
    is_liked: false,
  },
  {
    id: "showcase-5",
    image_url: "/assets/foto_putri/Hal 2.webp",
    caption: "Senyuman Hangat Kebersamaan di Serambi Asrama",
    likes_count: 34,
    year: 2024,
    album_id: "keseharian",
    uploader_name: "Keluarga Besar 43",
    is_liked: false,
  },
  {
    id: "showcase-6",
    image_url: "/assets/foto_putra/Hal 5.webp",
    caption: "Momen Silaturahmi Akbar & Malam Keakraban Alumni",
    likes_count: 61,
    year: 2025,
    album_id: "reuni",
    uploader_name: "Humas Expedient",
    is_liked: false,
  },
];

const DEFAULT_ALBUM_HIGHLIGHTS: AlbumItem[] = [
  { id: "all", title: "Semua Momen", icon: "fa-solid fa-photo-film" },
  { id: "wisuda", title: "Wisuda 2025", icon: "fa-solid fa-graduation-cap" },
  { id: "pg", title: "Panggung Gembira", icon: "fa-solid fa-masks-theater" },
  { id: "reuni", title: "Reuni & Temu Kangen", icon: "fa-solid fa-people-roof" },
  { id: "keseharian", title: "Nostalgia Asrama", icon: "fa-solid fa-camera-retro" },
];

export default function GaleriClient({
  initialAlbums = [],
  initialPhotos = [],
  currentUser = null,
}: {
  initialAlbums?: AlbumItem[];
  initialPhotos?: PhotoItem[];
  currentUser?: { id: string; email?: string } | null;
}) {
  // Mode Switcher: "vault" (Mobile-first Modern Grid & Highlights) vs "yearbook" (3D Flipbook)
  const [galleryMode, setGalleryMode] = useState<"vault" | "yearbook">("vault");

  // Albums & Photos State
  const [albums, setAlbums] = useState<AlbumItem[]>(
    initialAlbums.length > 0 ? initialAlbums : DEFAULT_ALBUM_HIGHLIGHTS
  );
  const [photos, setPhotos] = useState<PhotoItem[]>(
    initialPhotos.length > 0 ? initialPhotos : SHOWCASE_FALLBACK_PHOTOS
  );

  // Filters & Search
  const [selectedAlbum, setSelectedAlbum] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLightboxZoomed, setIsLightboxZoomed] = useState(false);

  // Floating Heart Double-tap Animation
  const [activeHeartPhotoId, setActiveHeartPhotoId] = useState<string | null>(null);
  const lastTapRef = useRef<{ [photoId: string]: number }>({});
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Upload Photo Bottom Sheet
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadAlbumId, setUploadAlbumId] = useState("wisuda");
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear().toString());
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Yearbook 3D State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Safe Haptic feedback
  const triggerHaptic = useCallback((duration = 15) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(duration);
      } catch {}
    }
  }, []);

  // Fetch live photos if empty
  useEffect(() => {
    if (initialPhotos.length === 0) {
      fetch("/api/galeri")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.photos && data.photos.length > 0) {
            setPhotos(data.photos);
          }
          if (data && data.albums && data.albums.length > 0) {
            setAlbums(data.albums);
          }
        })
        .catch(() => {});
    }
  }, [initialPhotos]);

  // CSS Scoping
  useEffect(() => {
    document.body.classList.add("page-galeri");
    return () => {
      document.body.classList.remove("page-galeri");
    };
  }, []);

  // Filter & Search Photos Pipeline
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      // 1. Album Filter
      if (selectedAlbum !== "all" && photo.album_id && photo.album_id !== selectedAlbum) {
        return false;
      }
      // 2. Year Filter
      if (selectedYear !== "all" && photo.year && photo.year.toString() !== selectedYear) {
        return false;
      }
      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const captionMatch = (photo.caption || "").toLowerCase().includes(q);
        const uploaderMatch = (photo.uploader_name || "").toLowerCase().includes(q);
        if (!captionMatch && !uploaderMatch) return false;
      }
      return true;
    });
  }, [photos, selectedAlbum, selectedYear, searchQuery]);

  // Handle Like Action (Heart Button or Double-Tap)
  const handleToggleLike = async (photo: PhotoItem) => {
    triggerHaptic(20);

    // Trigger floating heart animation
    setActiveHeartPhotoId(photo.id);
    setTimeout(() => {
      setActiveHeartPhotoId((prev) => (prev === photo.id ? null : prev));
    }, 850);

    // Optimistic UI Update
    const willBeLiked = !photo.is_liked;
    setPhotos((prev) =>
      prev.map((p) => {
        if (p.id === photo.id) {
          return {
            ...p,
            is_liked: willBeLiked,
            likes_count: willBeLiked ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 1) - 1),
          };
        }
        return p;
      })
    );

    // Call API in background
    try {
      await fetch("/api/galeri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_like",
          photo_id: photo.id,
        }),
      });
    } catch {
      // ignore
    }
  };

  // Double-tap handler for photo cards
  const handlePhotoTap = (photo: PhotoItem, index: number) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[photo.id] || 0;

    if (now - lastTap < 320) {
      // Double tap detected -> Like!
      handleToggleLike(photo);
      lastTapRef.current[photo.id] = 0;
    } else {
      // Single tap -> record timestamp & open lightbox after slight delay
      lastTapRef.current[photo.id] = now;
      setTimeout(() => {
        if (Date.now() - (lastTapRef.current[photo.id] || 0) >= 300) {
          setLightboxIndex(index);
          setIsLightboxZoomed(false);
          triggerHaptic(12);
        }
      }, 300);
    }
  };

  // Lightbox Navigation
  const handleLightboxPrev = useCallback(() => {
    triggerHaptic(10);
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
    setIsLightboxZoomed(false);
  }, [filteredPhotos.length, triggerHaptic]);

  const handleLightboxNext = useCallback(() => {
    triggerHaptic(10);
    setLightboxIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
    setIsLightboxZoomed(false);
  }, [filteredPhotos.length, triggerHaptic]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null) {
        if (e.key === "Escape") setLightboxIndex(null);
        if (e.key === "ArrowLeft") handleLightboxPrev();
        if (e.key === "ArrowRight") handleLightboxNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, handleLightboxPrev, handleLightboxNext]);

  // Handle Photo File Selection for Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setUploadStatusMsg({ type: "error", text: "Ukuran foto maksimal 8 MB" });
        return;
      }
      setUploadFile(file);
      const url = URL.createObjectURL(file);
      setUploadPreview(url);
      setUploadStatusMsg(null);
      triggerHaptic(12);
    }
  };

  // Submit Upload to /api/upload and /api/galeri
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadStatusMsg({ type: "error", text: "Silakan pilih foto terlebih dahulu" });
      return;
    }

    setIsSubmittingUpload(true);
    setUploadStatusMsg(null);
    triggerHaptic(15);

    try {
      // Step 1: Upload binary to storage via /api/upload
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("folder", "gallery");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.url) {
        throw new Error(uploadJson.error || "Gagal mengunggah foto ke server");
      }

      // Step 2: Save metadata to /api/galeri
      const saveRes = await fetch("/api/galeri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload_photo",
          image_url: uploadJson.url,
          caption: uploadCaption,
          album_id: uploadAlbumId,
          year: uploadYear,
        }),
      });
      const saveJson = await saveRes.json();

      if (!saveRes.ok || !saveJson.photo) {
        throw new Error(saveJson.error || "Gagal mencatat foto di galeri angkatan");
      }

      // Prepend to local state
      const newPhotoItem: PhotoItem = {
        ...saveJson.photo,
        uploader_name: "Saya",
        uploader_avatar: null,
        is_liked: false,
      };
      setPhotos((prev) => [newPhotoItem, ...prev]);

      triggerHaptic(25);
      setUploadStatusMsg({ type: "success", text: "Foto kenangan berhasil diabadikan!" });

      // Reset & close after short delay
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadCaption("");
        setUploadStatusMsg(null);
      }, 1200);
    } catch (err: any) {
      setUploadStatusMsg({ type: "error", text: err.message || "Terjadi kesalahan saat mengunggah" });
    } finally {
      setIsSubmittingUpload(false);
    }
  };

  // ----------------------------------------------------
  // YEARBOOK 3D PRESERVED ELEMENTS
  // ----------------------------------------------------
  const handleOpenPrintView = (dim: "putra" | "putri") => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Harap izinkan pop-up browser untuk mengekspor buku kenangan.");
      return;
    }

    const title = dim === "putra" ? "Buku Kenangan Putra — Expedient 43" : "Buku Kenangan Putri — Expedient 43";
    const totalPages = dim === "putra" ? 75 : 41;
    const folder = dim === "putra" ? "foto_putra" : "foto_putri";

    let imagesHtml = `
      <div class="page-break"><img src="/assets/${folder}/Cover Depan.webp" alt="Cover Depan" /></div>
      <div class="page-break"><img src="/assets/${folder}/Cover Dalem Depan.webp" alt="Cover Dalem Depan" /></div>
    `;

    for (let i = 1; i <= totalPages * 2; i++) {
      imagesHtml += `<div class="page-break"><img src="/assets/${folder}/Hal ${i}.webp" alt="Halaman ${i}" /></div>`;
    }

    imagesHtml += `
      <div class="page-break"><img src="/assets/${folder}/Cover Dalem Belakang.webp" alt="Cover Dalem Belakang" /></div>
      <div class="page-break"><img src="/assets/${folder}/Cover Belakang.webp" alt="Cover Belakang" /></div>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; background: #000; text-align: center; }
          .page-break { page-break-after: always; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { max-width: 100vw; max-height: 100vh; object-fit: contain; display: block; margin: 0 auto; }
          .no-print { position: fixed; top: 15px; right: 15px; z-index: 9999; background: #d4af37; color: #000; border: none; padding: 12px 24px; border-radius: 30px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
          @media print { .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <button class="no-print" onclick="window.print()">Simpan Seluruh Buku ke PDF / Cetak</button>
        ${imagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 1500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const sheetsPutra = useMemo(() => {
    const list = [];
    let idxPutra = 0;
    list.push(
      <div key={`putra-${idxPutra}`} className="sheet cursor-bind" data-sheet={idxPutra++}>
        <div className="face front cover-material"><img data-src="/assets/foto_putra/Cover Depan.webp" alt="Cover Depan" /></div>
        <div className="face back"><img data-src="/assets/foto_putra/Cover Dalem Depan.webp" alt="Cover Dalem Depan" /></div>
      </div>
    );
    for (let i = 1; i <= 75; i++) {
      list.push(
        <div key={`putra-${idxPutra}`} className="sheet cursor-bind" data-sheet={idxPutra++}>
          <div className="face front"><img data-src={`/assets/foto_putra/Hal ${i * 2 - 1}.webp`} alt={`Hal ${i * 2 - 1}`} /></div>
          <div className="face back"><img data-src={`/assets/foto_putra/Hal ${i * 2}.webp`} alt={`Hal ${i * 2}`} /></div>
        </div>
      );
    }
    list.push(
      <div key={`putra-${idxPutra}`} className="sheet cursor-bind" data-sheet={idxPutra++}>
        <div className="face front"><img data-src="/assets/foto_putra/Cover Dalem Belakang.webp" alt="Cover Dalem Belakang" /></div>
        <div className="face back cover-material"><img data-src="/assets/foto_putra/Cover Belakang.webp" alt="Cover Belakang" /></div>
      </div>
    );
    return list;
  }, []);

  const sheetsPutri = useMemo(() => {
    const list = [];
    let idxPutri = 0;
    list.push(
      <div key={`putri-${idxPutri}`} className="sheet cursor-bind" data-sheet={idxPutri++}>
        <div className="face front cover-material"><img data-src="/assets/foto_putri/Cover Depan.webp" alt="Cover Depan" /></div>
        <div className="face back"><img data-src="/assets/foto_putri/Cover Dalem Depan.webp" alt="Cover Dalem Depan" /></div>
      </div>
    );
    for (let i = 1; i <= 41; i++) {
      list.push(
        <div key={`putri-${idxPutri}`} className="sheet cursor-bind" data-sheet={idxPutri++}>
          <div className="face front"><img data-src={`/assets/foto_putri/Hal ${i * 2 - 1}.webp`} alt={`Hal ${i * 2 - 1}`} /></div>
          <div className="face back"><img data-src={`/assets/foto_putri/Hal ${i * 2}.webp`} alt={`Hal ${i * 2}`} /></div>
        </div>
      );
    }
    list.push(
      <div key={`putri-${idxPutri}`} className="sheet cursor-bind" data-sheet={idxPutri++}>
        <div className="face front"><img data-src="/assets/foto_putri/Cover Dalem Belakang.webp" alt="Cover Dalem Belakang" /></div>
        <div className="face back cover-material"><img data-src="/assets/foto_putri/Cover Belakang.webp" alt="Cover Belakang" /></div>
      </div>
    );
    return list;
  }, []);

  return (
    <div className="galeri-master-wrapper">
      {/* ================= TOP DUAL-MODE SWITCHER PILL ================= */}
      <div className="galeri-mode-switcher-dock">
        <div className="switcher-pill-glass">
          <button
            type="button"
            className={`mode-tab-btn ${galleryMode === "vault" ? "active" : ""}`}
            onClick={() => {
              setGalleryMode("vault");
              triggerHaptic(12);
            }}
          >
            <i className="fa-solid fa-camera-retro"></i>
            <span>Dokumentasi & Album</span>
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${galleryMode === "yearbook" ? "active" : ""}`}
            onClick={() => {
              setGalleryMode("yearbook");
              triggerHaptic(12);
            }}
          >
            <i className="fa-solid fa-book-open"></i>
            <span>Buku Kenangan 3D</span>
          </button>
        </div>
      </div>

      {/* ================================================================
          MODE 1: VISUAL VAULT 2.0 (MODERN ALBUM STORIES & MASONRY GRID)
          ================================================================ */}
      {galleryMode === "vault" && (
        <div className="visual-vault-container">
          {/* 1. TOP ALBUM STORIES & HIGHLIGHTS CAROUSEL */}
          <div className="album-stories-section">
            <div className="stories-scroll-track">
              {albums.map((album) => {
                const isActive = selectedAlbum === album.id;
                return (
                  <div
                    key={album.id}
                    className={`story-capsule cursor-bind ${isActive ? "active-story" : ""}`}
                    onClick={() => {
                      setSelectedAlbum(album.id);
                      triggerHaptic(10);
                    }}
                  >
                    <div className="story-ring-gradient">
                      <div className="story-avatar-box">
                        <i className={album.icon || "fa-solid fa-images"}></i>
                      </div>
                    </div>
                    <span className="story-title">{album.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. FILTER & SEARCH CONTROL BAR */}
          <div className="vault-control-bar">
            {/* Search Pill */}
            <div className="vault-search-box">
              <i className="fa-solid fa-magnifying-glass search-ico"></i>
              <input
                type="text"
                className="vault-search-input"
                placeholder="Cari momen, acara, sahabat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="vault-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            {/* Year Chips */}
            <div className="vault-year-chips">
              {["all", "2025", "2024", "2023"].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  className={`year-chip ${selectedYear === yr ? "active" : ""}`}
                  onClick={() => {
                    setSelectedYear(yr);
                    triggerHaptic(8);
                  }}
                >
                  {yr === "all" ? "Semua Tahun" : yr}
                </button>
              ))}
            </div>

            {/* Photobooth Shortcut */}
            <Link href="/photobooth" className="vault-photobooth-link">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Studio Photobooth</span>
            </Link>
          </div>

          {/* 3. PINTEREST-STYLE RESPONSIVE MASONRY GRID */}
          <div className="vault-masonry-section">
            {filteredPhotos.length === 0 ? (
              <div className="vault-empty-state">
                <i className="fa-solid fa-images empty-icon"></i>
                <h3>Belum Ada Foto untuk Filter Ini</h3>
                <p>Jadilah yang pertama mengabadikan momen ini ke dalam arsip angkatan.</p>
                <button
                  type="button"
                  className="btn-empty-upload"
                  onClick={() => setIsUploadOpen(true)}
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i> Unggah Foto Sekarang
                </button>
              </div>
            ) : (
              <div className="vault-masonry-grid">
                {filteredPhotos.map((photo, index) => {
                  const isHeartActive = activeHeartPhotoId === photo.id;

                  return (
                    <div
                      key={photo.id}
                      className="masonry-card cursor-bind"
                      onClick={() => handlePhotoTap(photo, index)}
                    >
                      {/* Photo Thumbnail Wrapper */}
                      <div className="card-media-wrapper">
                        <img
                          src={photo.image_url}
                          alt={photo.caption || "Momen Angkatan 43"}
                          className="card-media-img"
                          loading="lazy"
                        />

                        {/* Floating Heart Micro-Animation on Double Tap */}
                        {isHeartActive && (
                          <div className="floating-heart-anim">
                            <i className="fa-solid fa-heart"></i>
                          </div>
                        )}

                        {/* Year Badge */}
                        {photo.year && <span className="media-year-badge">{photo.year}</span>}

                        {/* Expand Icon */}
                        <button
                          type="button"
                          className="media-expand-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(index);
                            triggerHaptic(10);
                          }}
                          title="Buka Layar Penuh"
                        >
                          <i className="fa-solid fa-expand"></i>
                        </button>
                      </div>

                      {/* Card Meta & Actions Footer */}
                      <div className="card-footer-info">
                        {photo.caption && <p className="card-caption">{photo.caption}</p>}

                        <div className="card-action-row">
                          <div className="card-uploader">
                            <i className="fa-regular fa-user uploader-icon"></i>
                            <span className="uploader-name">{photo.uploader_name || "Alumni Expedient"}</span>
                          </div>

                          <button
                            type="button"
                            className={`btn-card-heart ${photo.is_liked ? "liked" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLike(photo);
                            }}
                            title={photo.is_liked ? "Batal Suka" : "Sukai Foto"}
                          >
                            <i className={photo.is_liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                            <span>{photo.likes_count || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. MOBILE FLOATING ACTION BUTTON (FAB) `+ UNGGAH FOTO` */}
          <button
            type="button"
            className="vault-fab-upload cursor-bind"
            onClick={() => {
              setIsUploadOpen(true);
              triggerHaptic(18);
            }}
            title="Unggah Foto Kenangan"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="fab-label">Unggah Foto</span>
          </button>

          {/* 5. FULLSCREEN TOUCH GESTURE LIGHTBOX */}
          {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
            <div
              className="vault-lightbox-overlay"
              onClick={() => setLightboxIndex(null)}
              onTouchStart={(e) => {
                touchStartPosRef.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                };
              }}
              onTouchEnd={(e) => {
                if (!touchStartPosRef.current) return;
                const deltaX = e.changedTouches[0].clientX - touchStartPosRef.current.x;
                const deltaY = e.changedTouches[0].clientY - touchStartPosRef.current.y;
                // Swipe down to dismiss
                if (deltaY > 100 && Math.abs(deltaX) < 80) {
                  setLightboxIndex(null);
                  triggerHaptic(10);
                }
                // Swipe left -> next
                else if (deltaX < -70 && Math.abs(deltaY) < 60) {
                  handleLightboxNext();
                }
                // Swipe right -> prev
                else if (deltaX > 70 && Math.abs(deltaY) < 60) {
                  handleLightboxPrev();
                }
                touchStartPosRef.current = null;
              }}
            >
              {/* Lightbox Nav Arrows */}
              <button
                type="button"
                className="lightbox-nav-btn prev-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLightboxPrev();
                }}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              <button
                type="button"
                className="lightbox-nav-btn next-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLightboxNext();
                }}
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>

              {/* Lightbox Main Stage */}
              <div
                className="lightbox-dialog-stage"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top Control Bar */}
                <div className="lightbox-top-bar">
                  <div className="lightbox-counter">
                    <span>{lightboxIndex + 1}</span> / {filteredPhotos.length}
                  </div>

                  <div className="lightbox-top-actions">
                    <button
                      type="button"
                      className="lightbox-action-btn"
                      onClick={() => setIsLightboxZoomed(!isLightboxZoomed)}
                      title={isLightboxZoomed ? "Perkecil (Zoom Out)" : "Perbesar (Zoom In)"}
                    >
                      <i className={isLightboxZoomed ? "fa-solid fa-magnifying-glass-minus" : "fa-solid fa-magnifying-glass-plus"}></i>
                    </button>

                    <a
                      href={filteredPhotos[lightboxIndex].image_url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="lightbox-action-btn"
                      title="Unduh Resolusi Asli"
                    >
                      <i className="fa-solid fa-download"></i>
                    </a>

                    <button
                      type="button"
                      className="lightbox-action-btn close-btn"
                      onClick={() => setLightboxIndex(null)}
                      title="Tutup (Esc)"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>

                {/* Displayed Image */}
                <div
                  className={`lightbox-img-wrapper ${isLightboxZoomed ? "zoomed" : ""}`}
                  onDoubleClick={() => handleToggleLike(filteredPhotos[lightboxIndex])}
                >
                  <img
                    src={filteredPhotos[lightboxIndex].image_url}
                    alt={filteredPhotos[lightboxIndex].caption || "Foto Kenangan"}
                    className="lightbox-img"
                  />
                  {activeHeartPhotoId === filteredPhotos[lightboxIndex].id && (
                    <div className="floating-heart-anim">
                      <i className="fa-solid fa-heart"></i>
                    </div>
                  )}
                </div>

                {/* Bottom Details Bar */}
                <div className="lightbox-bottom-info">
                  <div className="lightbox-caption-text">
                    {filteredPhotos[lightboxIndex].caption || "Momen Berharga Expedient 43"}
                  </div>

                  <div className="lightbox-bottom-row">
                    <span className="lightbox-meta-uploader">
                      Diabadikan oleh <strong>{filteredPhotos[lightboxIndex].uploader_name || "Alumni"}</strong>
                      {filteredPhotos[lightboxIndex].year ? ` • ${filteredPhotos[lightboxIndex].year}` : ""}
                    </span>

                    <button
                      type="button"
                      className={`lightbox-heart-btn ${filteredPhotos[lightboxIndex].is_liked ? "liked" : ""}`}
                      onClick={() => handleToggleLike(filteredPhotos[lightboxIndex])}
                    >
                      <i className={filteredPhotos[lightboxIndex].is_liked ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                      <span>{filteredPhotos[lightboxIndex].likes_count || 0} Suka</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. UPLOAD PHOTO BOTTOM SHEET DIALOG */}
          {isUploadOpen && (
            <div className="sheet-backdrop" onClick={() => !isSubmittingUpload && setIsUploadOpen(false)}>
              <div className="alumni-bottom-sheet upload-sheet-card" onClick={(e) => e.stopPropagation()}>
                {/* Drag Handle */}
                <div className="sheet-drag-handle" onClick={() => !isSubmittingUpload && setIsUploadOpen(false)}>
                  <div className="drag-pill"></div>
                </div>

                {/* Header */}
                <div className="sheet-header">
                  <button
                    type="button"
                    className="sheet-close-btn"
                    onClick={() => !isSubmittingUpload && setIsUploadOpen(false)}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <h3 className="sheet-user-name" style={{ marginTop: "4px" }}>
                    Abadikan Foto Kenangan
                  </h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--gold-main, #d4af37)" }}>
                    Arsip visual resmi seluruh sahabat angkatan
                  </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleUploadSubmit} className="upload-form-body">
                  {/* Status Banner */}
                  {uploadStatusMsg && (
                    <div className={`upload-status-banner ${uploadStatusMsg.type}`}>
                      <i className={uploadStatusMsg.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}></i>
                      <span>{uploadStatusMsg.text}</span>
                    </div>
                  )}

                  {/* Dropzone & Preview */}
                  <div
                    className="upload-dropzone cursor-bind"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    {uploadPreview ? (
                      <div className="upload-preview-container">
                        <img src={uploadPreview} alt="Pratinjau Foto" className="upload-preview-img" />
                        <div className="change-photo-badge">
                          <i className="fa-solid fa-rotate"></i> Ganti Foto
                        </div>
                      </div>
                    ) : (
                      <div className="dropzone-placeholder">
                        <div className="dropzone-icon-ring">
                          <i className="fa-solid fa-cloud-arrow-up"></i>
                        </div>
                        <h4>Pilih Foto dari Galeri atau Kamera</h4>
                        <p>Mendukung JPG, PNG, WEBP hingga 8 MB</p>
                      </div>
                    )}
                  </div>

                  {/* Album Selector */}
                  <div className="sheet-field-group">
                    <label className="field-label">Pilih Kategori Album</label>
                    <select
                      className="upload-select-input"
                      value={uploadAlbumId}
                      onChange={(e) => setUploadAlbumId(e.target.value)}
                    >
                      <option value="wisuda">Wisuda 2025</option>
                      <option value="pg">Panggung Gembira (PG)</option>
                      <option value="reuni">Reuni & Temu Kangen</option>
                      <option value="keseharian">Nostalgia Asrama & Keseharian</option>
                    </select>
                  </div>

                  {/* Year Selector */}
                  <div className="sheet-field-group">
                    <label className="field-label">Tahun Pengambilan</label>
                    <input
                      type="number"
                      className="upload-text-input"
                      value={uploadYear}
                      onChange={(e) => setUploadYear(e.target.value)}
                      placeholder="2025"
                      min="2018"
                      max="2030"
                    />
                  </div>

                  {/* Caption Input */}
                  <div className="sheet-field-group">
                    <label className="field-label">Keterangan / Cerita Momen</label>
                    <textarea
                      rows={3}
                      className="upload-textarea"
                      placeholder="Tuliskan cerita singkat atau kenangan di balik foto ini..."
                      value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Action Buttons */}
                  <div className="upload-actions-row">
                    <button
                      type="button"
                      className="btn-cancel-upload"
                      onClick={() => setIsUploadOpen(false)}
                      disabled={isSubmittingUpload}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-submit-upload"
                      disabled={isSubmittingUpload || !uploadFile}
                    >
                      {isSubmittingUpload ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                          <span>Menyimpan ke Galeri...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-cloud-arrow-up"></i>
                          <span>Publikasikan ke Galeri</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          MODE 2: BUKU KENANGAN 3D (PRESERVED FLIPBOOK & PDF EXPORT)
          ================================================================ */}
      {galleryMode === "yearbook" && (
        <div className="yearbook-stage-wrapper">
          <audio id="bgMusic" loop preload="none">
            <source src="/assets/audio/memori.mp3" type="audio/mpeg" />
          </audio>

          <audio id="whisperAudio" preload="none">
            <source src="/assets/audio/pesan_angkatan.mp3" type="audio/mpeg" />
          </audio>

          <div className="portrait-lock">
            <i className="fa-solid fa-mobile-screen"></i>
            <h2>AKSES TERKUNCI</h2>
            <p>Ruang Kenangan 3D terbaik dinikmati dalam mode Landscape.<br />Silakan putar perangkat Anda.</p>
            <button
              id="btnBypassLock"
              onClick={() => {
                document.body.classList.add("bypass-portrait");
              }}
              style={{
                marginTop: "20px",
                padding: "10px 22px",
                background: "rgba(212,175,55,0.15)",
                border: "1px solid #d4af37",
                color: "#d4af37",
                borderRadius: "50px",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <i className="fa-solid fa-unlock" style={{ marginRight: "6px" }}></i> Tetap Buka dalam Mode Tegak
            </button>
          </div>

          <div className="gallery-stage" id="galleryStage">
            <div className="glitch-overlay" id="glitchOverlay"></div>
            <div className="ethereal-text" id="etherealText" title="Double Click for Epilogue">THE SYNDICATE</div>
            <canvas id="dustCanvas"></canvas>
            <div className="ambient-light" id="ambientLight"></div>
            <button className="dimension-shift-btn hover-trigger" id="btnShift">
              <i className="fa-solid fa-rotate"></i> SHIFT TO OMEGA (PUTRI)
            </button>

            <div className="dimension-core" id="dimCore">
              <div className="book-scene" id="bookPutra">
                {sheetsPutra}
              </div>

              <div className="book-scene" id="bookPutri">
                {sheetsPutri}
              </div>
            </div>

            <button className="whisper-btn hover-trigger" id="btnWhisper" title="Dengarkan Pesan Memori">
              <i className="fa-solid fa-microphone-lines"></i>
            </button>

            <div className="gallery-hud">
              <button className="btn-icon hover-trigger" id="btnAudio" title="Nyalakan Musik Kenangan"><i className="fa-solid fa-music"></i></button>
              <button className="btn-icon hover-trigger" id="btnAutoPlay" title="Cinematic Auto-Play"><i className="fa-solid fa-play"></i></button>
              <button className="btn-icon hover-trigger" id="btnIndex" title="Constellation Grid"><i className="fa-solid fa-border-all"></i></button>

              <button className="btn-nav hover-trigger" id="btnPrev"><i className="fa-solid fa-arrow-left"></i></button>
              <div className="indicator-wrapper">
                <div className="page-indicator" id="pageIndicator">COVER DEPAN</div>
                <div className="progress-bar-container"><div className="progress-bar-fill" id="progressFill"></div></div>
              </div>
              <button className="btn-nav hover-trigger" id="btnNext"><i className="fa-solid fa-arrow-right"></i></button>

              <button className="btn-icon hover-trigger" id="btnCloseBook" title="Tutup Buku"><i className="fa-solid fa-book"></i></button>
              <button className="btn-icon hover-trigger" id="btnPin" title="Simpan Halaman Ini"><i className="fa-regular fa-bookmark"></i></button>
              <button className="btn-icon hover-trigger" id="btnGoToPin" title="Teleportasi ke Memori" style={{ display: "none" }}><i className="fa-solid fa-map-location-dot"></i></button>
              <button className="btn-icon hover-trigger" onClick={() => setIsExportModalOpen(true)} title="Unduh Arsip & Ekspor Bundle PDF Buku Kenangan"><i className="fa-solid fa-file-pdf"></i></button>
              <Link href="/photobooth" className="btn-icon hover-trigger" title="Studio Photobooth Angkatan" style={{ color: "#ffd700", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="fa-solid fa-camera-retro"></i></Link>
              <button className="btn-icon hover-trigger" id="btnFullscreen" title="Immersive Mode"><i className="fa-solid fa-expand"></i></button>
            </div>
          </div>

          {/* YEARBOOK BUNDLE EXPORT MODAL (TASK B-5) */}
          {isExportModalOpen && (
            <div
              onClick={() => setIsExportModalOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 999999,
                background: "rgba(0, 0, 0, 0.88)",
                backdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "var(--bg-secondary, #0c120f)",
                  border: "1px solid rgba(212, 175, 55, 0.4)",
                  borderRadius: "24px",
                  padding: "32px 28px",
                  maxWidth: "460px",
                  width: "100%",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontFamily: "Courier New, monospace", color: "#d4af37", fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase" }}>
                      ARSIP RESMI ANGKATAN 43
                    </span>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: "var(--text-primary)", margin: "4px 0 0 0" }}>
                      Ekspor Buku Kenangan
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: "1.2rem", cursor: "pointer" }}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "22px" }}>
                  Pilih edisi buku kenangan yang ingin dicetak atau disimpan sebagai arsip digital resolusi tinggi (High-Definition PDF Pack):
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <div
                    style={{
                      background: "rgba(212, 175, 55, 0.06)",
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                      borderRadius: "16px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#f3e5ab" }}>
                        <i className="fa-solid fa-mars" style={{ color: "#00bfff", marginRight: "6px" }}></i> Edisi Putra (The Syndicate)
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        150 Halaman Lengkap (Cover + Hal 1 - 150)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportModalOpen(false);
                        handleOpenPrintView("putra");
                      }}
                      style={{
                        background: "rgba(212, 175, 55, 0.2)",
                        border: "1px solid #d4af37",
                        color: "#d4af37",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <i className="fa-solid fa-print"></i> Cetak / PDF
                    </button>
                  </div>

                  <div
                    style={{
                      background: "rgba(212, 175, 55, 0.06)",
                      border: "1px solid rgba(212, 175, 55, 0.3)",
                      borderRadius: "16px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "0.95rem", color: "#f3e5ab" }}>
                        <i className="fa-solid fa-venus" style={{ color: "#ff69b4", marginRight: "6px" }}></i> Edisi Putri (Omega Dynasty)
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        82 Halaman Lengkap (Cover + Hal 1 - 82)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportModalOpen(false);
                        handleOpenPrintView("putri");
                      }}
                      style={{
                        background: "rgba(212, 175, 55, 0.2)",
                        border: "1px solid #d4af37",
                        color: "#d4af37",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <i className="fa-solid fa-print"></i> Cetak / PDF
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textAlign: "center" }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: "4px" }}></i> Seluruh lembar akan disusun berurutan per halaman A4 portrait siap cetak ke percetakan atau disimpan sebagai PDF.
                </div>
              </div>
            </div>
          )}

          <Script src="/vendor/gsap/gsap.min.js" strategy="beforeInteractive" />
          <Script src="/assets/js/galeri.js" strategy="afterInteractive" />
        </div>
      )}
    </div>
  );
}
