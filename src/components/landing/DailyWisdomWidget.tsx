"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function DailyWisdomWidget() {
  const { t, locale } = useLanguage();
  const proverbs = t.daily_proverbs && t.daily_proverbs.length > 0 ? t.daily_proverbs : [];
  const [mahfuzhatIdx, setMahfuzhatIdx] = useState(0);
  const [hijriDate, setHijriDate] = useState<string>("Bumi Slahung • Ponorogo");

  useEffect(() => {
    // Pick daily index based on day of month
    const today = new Date();
    const day = today.getDate();
    if (proverbs.length > 0) {
      setMahfuzhatIdx(day % proverbs.length);
    }

    // Format local date with Hijri context
    try {
      const loc = locale === "ar" ? "ar-SA-u-ca-islamic" : locale === "en" ? "en-US-u-ca-islamic" : "id-ID-u-ca-islamic";
      const formatter = new Intl.DateTimeFormat(loc, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const locationText = locale === "ar" ? "سلاهونغ، فونوروغو" : locale === "en" ? "Slahung, Ponorogo" : "Slahung, Ponorogo";
      setHijriDate(`${formatter.format(today)} • ${locationText}`);
    } catch {
      setHijriDate("1447 H • Slahung Ponorogo");
    }
  }, [locale, proverbs.length]);

  const current = proverbs[mahfuzhatIdx] || {
    arabic: "مَنْ جَدَّ وَجَدَ",
    latin: "Man jadda wajada",
    arti: "Barang siapa bersungguh-sungguh, maka ia akan berhasil.",
    source: "Mahfuzhat",
  };

  const nextWisdom = () => {
    if (proverbs.length > 0) {
      setMahfuzhatIdx((prev) => (prev + 1) % proverbs.length);
    }
  };

  return (
    <div className="daily-wisdom-banner">
      {/* Authentic Washi / Masking Tape on Desk Memo */}
      <div className="memo-masking-tape" title={locale === "ar" ? "شريط لاصق" : locale === "en" ? "Memo Masking Tape" : "Selotip Secarik Memo"}></div>
      {/* Dog-Ear Paper Fold (Lipatan Pembatas Kertas Memo) */}
      <div className="memo-dog-ear" title={locale === "ar" ? "طيّة حافة المذكرة" : locale === "en" ? "Memo Dog Ear" : "Lipatan Pembatas Memo Santri"}></div>
      <div className="wisdom-banner-content">
        <div className="wisdom-banner-left">
          <div className="wisdom-calendar-tag">
            <i className="fa-solid fa-moon"></i>
            <span>{hijriDate}</span>
          </div>

          <div className="wisdom-arabic-text" dir="rtl">
            {current.arabic}
          </div>

          <div className="wisdom-translation-row">
            <span className="wisdom-latin">"{current.latin}"</span>
            <span className="wisdom-divider">—</span>
            <span className="wisdom-meaning">{current.arti}</span>
          </div>
        </div>

        <div className="wisdom-banner-actions">
          <button
            type="button"
            className="btn-next-wisdom"
            onClick={nextWisdom}
            title={t.daily_wisdom.next_btn}
          >
            <i className="fa-solid fa-shuffle"></i>
            <span>{t.daily_wisdom.next_btn}</span>
          </button>

          <Link href="/mahfuzhat" className="btn-explore-mahfuzhat">
            <i className="fa-solid fa-book-open"></i>
            <span>{t.daily_wisdom.explore_btn}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
