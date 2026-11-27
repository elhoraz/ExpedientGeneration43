"use client";

import React from "react";
import type { QuranAyatItem } from "@/lib/data/quranSurahList";
import { toArabicNumerals } from "../types";

interface QuranAyahCardProps {
  surahNomor: number;
  ayah: QuranAyatItem;
  isCurrentPlaying: boolean;
  isPlaying: boolean;
  isBookmarked: boolean;
  showLatin: boolean;
  showTranslation: boolean;
  onPlayAyah: (ayahNum: number) => void;
  onToggleBookmark: (ayah: QuranAyatItem) => void;
  onOpenTafsir: (ayahNum: number) => void;
}

/** Memoized Surah ayah card to avoid re-rendering 200+ verses on audio or timer state ticks */
export const QuranAyahCard = React.memo(function QuranAyahCard({
  surahNomor,
  ayah,
  isCurrentPlaying,
  isPlaying,
  isBookmarked,
  showLatin,
  showTranslation,
  onPlayAyah,
  onToggleBookmark,
  onOpenTafsir,
}: QuranAyahCardProps) {
  return (
    <div
      id={`ayah-${ayah.nomorAyat}`}
      className={`ayah-card ${isCurrentPlaying ? "active-playing" : ""}`}
    >
      <div className="ayah-header">
        <div className="ayah-number-badge">
          <span>
            {surahNomor}:{ayah.nomorAyat}
          </span>
        </div>
        <div className="ayah-action-buttons">
          <button
            type="button"
            className={`ayah-action-btn ${isCurrentPlaying && isPlaying ? "playing-btn" : ""}`}
            onClick={() => onPlayAyah(ayah.nomorAyat)}
            title="Dengar Murottal (Lanjut terus ke ayat berikutnya)"
          >
            <i className={`fa-solid ${isCurrentPlaying && isPlaying ? "fa-pause" : "fa-play"}`}></i>
          </button>

          <button
            type="button"
            className={`ayah-action-btn ${isBookmarked ? "bookmarked-btn" : ""}`}
            onClick={() => onToggleBookmark(ayah)}
            title={isBookmarked ? "Hapus dari Bookmark" : "Simpan Bookmark"}
          >
            <i className={`fa-${isBookmarked ? "solid" : "regular"} fa-star`}></i>
          </button>

          <button
            type="button"
            className="ayah-action-btn tafsir-btn"
            onClick={() => onOpenTafsir(ayah.nomorAyat)}
            title="Baca Tafsir Ayat"
          >
            <i className="fa-solid fa-book-open-reader"></i>
          </button>
        </div>
      </div>

      <div className="ayah-arabic-wrapper">
        <p className="ayah-arabic-text" dir="rtl">
          {ayah.teksArab}
          <span className="ayah-end-symbol">
            ۝<span className="ayah-end-num">{toArabicNumerals(ayah.nomorAyat)}</span>
          </span>
        </p>
      </div>

      {showLatin && ayah.teksLatin && (
        <div className="ayah-latin-wrapper">
          <p className="ayah-latin-text">{ayah.teksLatin}</p>
        </div>
      )}

      {showTranslation && (
        <div className="ayah-translation-wrapper">
          <p className="ayah-translation-text">{ayah.teksIndonesia}</p>
        </div>
      )}
    </div>
  );
});
