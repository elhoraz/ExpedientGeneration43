"use client";

import { useState, useMemo, useRef } from "react";
import { ASATIDZ_ITEMS, AsatidzItem } from "@/lib/data/asatidzData";

interface AsatidzSectionProps {
  search: string;
  onSearchChange: (val: string) => void;
  asatidzCategory: "all" | "pimpinan" | "guru" | "tutor" | "ustadzah";
  onCategoryChange: (cat: "all" | "pimpinan" | "guru" | "tutor" | "ustadzah") => void;
  selectedAsatidz: AsatidzItem | null;
  onSelectAsatidz: (item: AsatidzItem | null) => void;
  fatihahCounts: Record<string, number>;
  fatihahToast: Record<string, boolean>;
  onGiftFatihah: (id: string) => void;
  triggerHaptic: (duration?: number) => void;
  locale: string;
  t: any;
}

const LEADER_META: Record<
  string,
  {
    header: string;
    label: string;
    collageTitle: string;
    collageAlt: string;
    icon: string;
  }
> = {
  pimpinan_shoiman: {
    header: "Pesan Nasihat Direktur Pengasuhan",
    label: "Direktur Pengasuhan Santri",
    collageTitle: "Naskah Nasihat Direktur Pengasuhan Santri",
    collageAlt: "Naskah Nasihat Ustadz Shoiman Lukmanul Hakim",
    icon: "fa-solid fa-compass",
  },
  pimpinan_winardi: {
    header: "Untaian Mutiara Hikmah Direktur Keputrian",
    label: "Direktur Pengasuhan Putri",
    collageTitle: "Naskah Mutiara Hikmah Ustadz Winardi Yusuf",
    collageAlt: "Naskah Mutiara Hikmah Ustadz Winardi Yusuf",
    icon: "fa-solid fa-lightbulb",
  },
  pimpinan_saroni: {
    header: "Pesan Mutiara Direktur KMI",
    label: "Direktur KMI Arrisalah",
    collageTitle: "Naskah Pesan Direktur KMI Al-Ustadz Sa'roni, Lc.",
    collageAlt: "Naskah Pesan Direktur KMI Al-Ustadz Sa'roni, Lc.",
    icon: "fa-solid fa-mosque",
  },
};

export function AsatidzSection({
  search,
  onSearchChange,
  asatidzCategory,
  onCategoryChange,
  selectedAsatidz,
  onSelectAsatidz,
  fatihahCounts,
  fatihahToast,
  onGiftFatihah,
  triggerHaptic,
  locale,
  t,
}: AsatidzSectionProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(
    () => ({
      all: ASATIDZ_ITEMS.length,
      pimpinan: ASATIDZ_ITEMS.filter((i) => i.category === "pimpinan").length,
      guru: ASATIDZ_ITEMS.filter((i) => i.category === "guru").length,
      tutor: ASATIDZ_ITEMS.filter((i) => i.category === "tutor").length,
      ustadzah: ASATIDZ_ITEMS.filter((i) => i.category === "ustadzah" || i.isMotherHeadmaster).length,
    }),
    []
  );

  const filteredAsatidz = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ASATIDZ_ITEMS.filter((item) => {
      if (asatidzCategory !== "all") {
        if (asatidzCategory === "ustadzah") {
          if (item.category !== "ustadzah" && !item.isMotherHeadmaster) return false;
        } else if (item.category !== asatidzCategory) {
          return false;
        }
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        (item.subject || "").toLowerCase().includes(q) ||
        (item.quote || "").toLowerCase().includes(q) ||
        (item.classAssigned || "").toLowerCase().includes(q)
      );
    });
  }, [asatidzCategory, search]);

  const getCategoryLabel = (item: AsatidzItem) => {
    if (item.category === "pimpinan") return t.direktori_extra.asatidz_cat_pimpinan;
    if (item.category === "ustadzah" || item.isMotherHeadmaster)
      return t.direktori_extra.asatidz_cat_ustadzah;
    if (item.category === "tutor") return t.direktori_extra.asatidz_cat_tutor;
    return t.direktori_extra.asatidz_cat_guru;
  };

  const getWasiatMeta = (item: AsatidzItem) => {
    if (item.isFounder) {
      return {
        header: "20 Wasiat & Falsafah Hidup",
        label: "Pendiri Arrisalah",
        collageTitle: "Dokumentasi Kenangan (Terima Kasih Kyaiku)",
        collageAlt: "Kenangan Terima Kasih Kyaiku",
        icon: "fa-solid fa-scroll",
      };
    }
    if (item.isMotherHeadmaster) {
      return {
        header: "Pesan Kasih 3 Nasihat Mulia",
        label: "Pimpinan Putri & Istri Pimpinan",
        collageTitle: "Naskah Nasihat Tulisan Tangan Ustadzah Indriatin",
        collageAlt: "Naskah Nasihat Ustadzah Indriatin",
        icon: "fa-solid fa-heart",
      };
    }
    return (
      LEADER_META[item.id] || {
        header: "Pesan Nasihat Keistiqomahan",
        label: "Putra & Penerus Pendiri",
        collageTitle: "Naskah Asli Tulisan Tangan Buku Tahunan",
        collageAlt: "Naskah Pesan KH Muhammad Azharullah",
        icon: "fa-solid fa-feather-pointed",
      }
    );
  };

  return (
    <div className="asatidz-wrapper">
      {/* Sticky Search & Category Control Bar */}
      <div className="direktori-control-deck">
        <div className="search-pill-wrapper">
          <i className="fa-solid fa-magnifying-glass search-pill-icon" aria-hidden="true"></i>
          <input
            ref={searchRef}
            type="search"
            className="search-pill-input"
            placeholder={
              locale === "ar"
                ? "ابحث عن اسم الأستاذ أو المادة..."
                : locale === "en"
                ? "Search teacher name, role, or subject..."
                : "Cari nama guru, amanah, atau mata pelajaran..."
            }
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari dewan guru"
          />
          {search && (
            <button
              type="button"
              className="search-pill-clear"
              onClick={() => {
                onSearchChange("");
                searchRef.current?.focus();
              }}
              aria-label="Hapus pencarian"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <div className="filter-chips-scroll" role="tablist" aria-label="Kategori Asatidz">
          {(
            [
              { id: "all", label: t.direktori_extra.asatidz_cat_all, count: counts.all },
              { id: "pimpinan", label: t.direktori_extra.asatidz_cat_pimpinan, count: counts.pimpinan },
              { id: "guru", label: t.direktori_extra.asatidz_cat_guru, count: counts.guru },
              { id: "tutor", label: t.direktori_extra.asatidz_cat_tutor, count: counts.tutor },
              { id: "ustadzah", label: t.direktori_extra.asatidz_cat_ustadzah, count: counts.ustadzah },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={asatidzCategory === chip.id}
              className={`chip-item ${asatidzCategory === chip.id ? "active" : ""}`}
              onClick={() => {
                onCategoryChange(chip.id);
                triggerHaptic(10);
              }}
            >
              <span>{chip.label}</span>
              <span className="chip-count">{chip.count}</span>
            </button>
          ))}
        </div>

        <div className="view-and-sort-bar">
          <div className="results-count">
            <strong>{filteredAsatidz.length}</strong>{" "}
            {locale === "ar" ? "أستاذ ومعلم" : locale === "en" ? "Teachers & Mentors" : "Dewan Guru"}
          </div>
        </div>
      </div>

      {/* Asatidz Grid */}
      <div className="asatidz-grid-container">
        {filteredAsatidz.length === 0 ? (
          <div className="empty-direktori-state">
            <i className="fa-solid fa-chalkboard-user empty-icon"></i>
            <h3>{t.direktori.empty_title}</h3>
            <p>{t.direktori.empty_desc}</p>
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                onSearchChange("");
                onCategoryChange("all");
                triggerHaptic(10);
              }}
            >
              {t.direktori.reset_filter}
            </button>
          </div>
        ) : (
          <div className="asatidz-grid">
            {filteredAsatidz.map((item) => {
              const fatihahCount = fatihahCounts[item.id] || 0;
              return (
                <article
                  key={item.id}
                  className={`asatidz-card ${item.isFounder ? "founder-card" : ""} ${
                    item.isSuccessor ? "successor-card" : ""
                  } ${item.isMotherHeadmaster ? "mother-card" : ""}`}
                  onClick={() => {
                    onSelectAsatidz(item);
                    triggerHaptic(12);
                  }}
                >
                  <div className="asatidz-frame-outer">
                    <div className="asatidz-frame-inner">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="asatidz-img"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling;
                            if (fallback) (fallback as HTMLElement).style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className="asatidz-fallback-avatar"
                        style={{ display: item.photoUrl ? "none" : "flex" }}
                      >
                        <i className="fa-solid fa-user-tie asatidz-fallback-icon"></i>
                        <span className="asatidz-fallback-initials">
                          {item.titleHonorific || "UST"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="asatidz-card-body">
                    <div className="asatidz-tag-row">
                      <span className="asatidz-badge">{getCategoryLabel(item)}</span>
                      {item.isRahimahullah && (
                        <span className="asatidz-rahimahullah-chip">Rahimahullah</span>
                      )}
                    </div>

                    <h3 className="asatidz-name">{item.name}</h3>
                    <div className="asatidz-role">{item.role}</div>

                    {item.subject && (
                      <div className="asatidz-subject">
                        <i className="fa-solid fa-book"></i> {item.subject}
                      </div>
                    )}

                    {item.quote && <p className="asatidz-quote-preview">&ldquo;{item.quote}&rdquo;</p>}

                    {fatihahCount > 0 && (
                      <div className="asatidz-fatihah-stat">
                        <i className="fa-solid fa-hands-praying"></i> {fatihahCount}x doa dikirimkan
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Asatidz Detail Modal */}
      {selectedAsatidz && (
        <div
          className="asatidz-modal-overlay"
          onClick={() => onSelectAsatidz(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedAsatidz.name}
        >
          <div className="asatidz-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="asatidz-modal-close"
              onClick={() => onSelectAsatidz(null)}
              aria-label={t.common.close}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="asatidz-frame-outer asatidz-modal-frame">
              <div className="asatidz-frame-inner">
                {selectedAsatidz.photoUrl ? (
                  <img
                    src={selectedAsatidz.photoUrl}
                    alt={selectedAsatidz.name}
                    className="asatidz-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) (fallback as HTMLElement).style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="asatidz-fallback-avatar"
                  style={{ display: selectedAsatidz.photoUrl ? "none" : "flex" }}
                >
                  <i className="fa-solid fa-user-tie asatidz-fallback-icon"></i>
                  <span className="asatidz-fallback-initials">
                    {selectedAsatidz.titleHonorific || "UST"}
                  </span>
                </div>
              </div>
            </div>

            <div className="asatidz-badge" style={{ marginBottom: 8 }}>
              {selectedAsatidz.role}
            </div>

            <h3 className="asatidz-name" style={{ fontSize: "1.35rem", textAlign: "center" }}>
              {selectedAsatidz.name}
            </h3>

            {selectedAsatidz.subject && (
              <div className="asatidz-subject" style={{ justifyContent: "center", marginTop: 4 }}>
                <i className="fa-solid fa-book"></i> {selectedAsatidz.subject}
              </div>
            )}

            {selectedAsatidz.quote && (
              <div className="asatidz-modal-quote-box">
                <p className="asatidz-modal-quote-text">&ldquo;{selectedAsatidz.quote}&rdquo;</p>
                <div className="asatidz-modal-source">Buku Tahunan Expedient 43</div>
              </div>
            )}

            {selectedAsatidz.wasiat && (() => {
              const meta = getWasiatMeta(selectedAsatidz);
              return (
                <div className="founder-wasiat-section">
                  <div className="founder-wasiat-header">
                    <span>
                      <i className={meta.icon}></i> {meta.header}
                    </span>
                    <span className="founder-wasiat-sub">{meta.label}</span>
                  </div>
                  <div className="founder-wasiat-list">
                    {selectedAsatidz.wasiat.map((w, idx) => (
                      <div key={idx} className="founder-wasiat-item">
                        {w}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {selectedAsatidz.collageUrl && (() => {
              const meta = getWasiatMeta(selectedAsatidz);
              return (
                <div className="founder-collage-box">
                  <div className="founder-collage-header">
                    <i className="fa-solid fa-image"></i>
                    <span>{meta.collageTitle}</span>
                  </div>
                  <img
                    src={selectedAsatidz.collageUrl}
                    alt={meta.collageAlt}
                    className="founder-collage-img"
                  />
                </div>
              );
            })()}

            <button
              type="button"
              className="btn-fatihah-guru"
              onClick={() => onGiftFatihah(selectedAsatidz.id)}
            >
              <i className="fa-solid fa-hands-praying"></i>
              <span>{t.direktori_extra.btn_send_fatihah}</span>
              <span className="fatihah-pill">{fatihahCounts[selectedAsatidz.id] || 0}</span>
            </button>

            {fatihahToast[selectedAsatidz.id] && (
              <div className="fatihah-toast-msg" role="status">
                <i className="fa-solid fa-circle-check"></i> {t.direktori_extra.fatihah_sent_toast}{" "}
                {selectedAsatidz.name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

