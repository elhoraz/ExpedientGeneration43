"use client";

import type { QuranSurahDetail } from "@/lib/data/quranSurahList";
import { QuranTafsirSkeleton } from "@/components/ui/skeletons/SkeletonWorship";
import type { BookmarkItem } from "../types";

interface QuranTafsirModalProps {
  locale: string;
  closeLabel: string;
  loadingTafsir: boolean;
  selectedAyahTafsir: number | null;
  selectedSurah: QuranSurahDetail | null;
  tafsirData: any | null;
  onClose: () => void;
}

export function QuranTafsirModal({
  locale,
  closeLabel,
  loadingTafsir,
  selectedAyahTafsir,
  selectedSurah,
  tafsirData,
  onClose,
}: QuranTafsirModalProps) {
  return (
    <div
      className="quran-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={locale === "ar" ? "تفسير الآيات الكريمة" : locale === "en" ? "Quranic Tafsir Analysis" : "Tafsir Ringkas Kemenag RI"}
      onClick={onClose}
    >
      <div className="quran-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="quran-modal-header">
          <div className="modal-title-group">
            <i className="fa-solid fa-book-open-reader" aria-hidden="true"></i>
            <h3>{locale === "ar" ? "تفسير الآيات الكريمة" : locale === "en" ? "Quranic Tafsir Analysis" : "Tafsir Ringkas Kemenag RI"}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div className="quran-modal-body">
          {loadingTafsir ? (
            <QuranTafsirSkeleton />
          ) : (
            <>
              {selectedAyahTafsir && selectedSurah && (
                <div className="tafsir-ayah-box">
                  <div className="tafsir-arabic" dir="rtl">
                    {selectedSurah.ayat.find((a) => a.nomorAyat === selectedAyahTafsir)?.teksArab}
                  </div>
                  <div className="tafsir-indo">
                    &ldquo;{selectedSurah.ayat.find((a) => a.nomorAyat === selectedAyahTafsir)?.teksIndonesia}&rdquo;
                  </div>
                </div>
              )}

              <div className="tafsir-explanation">
                <h4>{locale === "ar" ? "البيان والتفسير:" : locale === "en" ? "Official Tafsir Explanation:" : "Penjelasan Tafsir Resmi:"}</h4>
                <p>
                  {tafsirData?.tafsir?.find((item: any) => item.ayat === selectedAyahTafsir)?.teks ||
                    (locale === "ar" ? "تفسير هذه الآية قيد المعالجة." : locale === "en" ? "Tafsir for this verse is being loaded." : "Tafsir resmi Kemenag RI untuk ayat ini sedang diproses.")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface QuranBookmarksModalProps {
  locale: string;
  closeLabel: string;
  bookmarks: BookmarkItem[];
  onClose: () => void;
  onOpenSurah: (surahNumber: number, ayahNumber: number) => void;
  onRemoveBookmark: (idx: number) => void;
}

export function QuranBookmarksModal({
  locale,
  closeLabel,
  bookmarks,
  onClose,
  onOpenSurah,
  onRemoveBookmark,
}: QuranBookmarksModalProps) {
  return (
    <div
      className="quran-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={locale === "ar" ? "الإشارات المرجعية والآيات المفضلة" : locale === "en" ? "Bookmarks & Favorite Verses" : "Bookmark & Ayat Favorit"}
      onClick={onClose}
    >
      <div className="quran-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="quran-modal-header">
          <div className="modal-title-group">
            <i className="fa-solid fa-star gold-icon" aria-hidden="true"></i>
            <h3>{locale === "ar" ? "الإشارات المرجعية والآيات المفضلة" : locale === "en" ? "Bookmarks & Favorite Verses" : "Bookmark & Ayat Favorit"}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div className="quran-modal-body">
          {bookmarks.length === 0 ? (
            <div className="modal-empty-bookmarks">
              <i className="fa-regular fa-bookmark empty-icon"></i>
              <p>{locale === "ar" ? "لم يتم حفظ أي آيات بعد" : locale === "en" ? "No bookmarked verses yet" : "Belum ada ayat yang ditandai"}</p>
              <span>{locale === "ar" ? "انقر على رمز النجمة بجانب الآية لحفظها هنا." : locale === "en" ? "Tap the star icon next to any verse to save it here." : "Ketuk ikon bintang pada ayat saat membaca untuk menyimpannya di sini."}</span>
            </div>
          ) : (
            <div className="bookmarks-list">
              {bookmarks.map((b, idx) => (
                <div
                  key={idx}
                  className="bookmark-item-card"
                  onClick={() => {
                    onClose();
                    onOpenSurah(b.surahNumber, b.ayahNumber);
                  }}
                >
                  <div className="bookmark-item-top">
                    <span className="bookmark-surah-tag">
                      {locale === "ar" ? `سورة ${b.surahName} : آية ${b.ayahNumber}` : locale === "en" ? `Surah ${b.surahName} : Verse ${b.ayahNumber}` : `Surah ${b.surahName} : Ayat ${b.ayahNumber}`}
                    </span>
                    <button
                      type="button"
                      className="bookmark-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(idx);
                      }}
                      title={locale === "ar" ? "حذف الإشارة المرجعية" : locale === "en" ? "Remove bookmark" : "Hapus bookmark"}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                  <p className="bookmark-arabic" dir="rtl">{b.teksArab}</p>
                  <p className="bookmark-translation">{b.teksIndonesia}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
