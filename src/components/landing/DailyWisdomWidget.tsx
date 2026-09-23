"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface MahfuzhatItem {
  arabic: string;
  latin: string;
  arti: string;
  source: string;
}

const MAHFUZHAT_DAILY: MahfuzhatItem[] = [
  {
    arabic: "مَنْ جَدَّ وَجَدَ",
    latin: "Man jadda wajada",
    arti: "Barang siapa yang bersungguh-sungguh, maka ia pasti akan berhasil.",
    source: "Mahfuzhat Kelas 1 KMI",
  },
  {
    arabic: "مَنْ سَارَ عَلَى الدَّرْبِ وَصَلَ",
    latin: "Man sara 'alad-darbi washala",
    arti: "Barang siapa berjalan pada jalurnya, maka ia akan sampai ke tujuan.",
    source: "Mahfuzhat Pondok Modern",
  },
  {
    arabic: "الصَّبْرُ يُعِينُ عَلَى كُلِّ عَمَلٍ",
    latin: "Ash-shabru yu'iinu 'alaa kulli 'amalin",
    arti: "Kesabaran itu menolong dan meringankan setiap pekerjaan.",
    source: "Kulliyyatul Mu'allimin",
  },
  {
    arabic: "العِلْمُ فِي الصِّغَرِ كَالنَّقْشِ عَلَى الحَجَرِ",
    latin: "Al-'ilmu fish-shighari kan-naqsyi 'alal-hajari",
    arti: "Ilmu di waktu muda bagaikan ukiran di atas batu karang.",
    source: "Hikmah Salafus Shalih",
  },
  {
    arabic: "جَالِسْ أَهْلَ الصِّدْقِ وَالوَفَاءِ",
    latin: "Jaalis ahlas-shidqi wal-wafaa'",
    arti: "Bergaullah dengan orang-orang yang jujur dan setia menepati janji.",
    source: "Adab Pergaulan Santri",
  },
];

export default function DailyWisdomWidget() {
  const { locale } = useLanguage();
  const [mahfuzhatIdx, setMahfuzhatIdx] = useState(0);
  const [hijriDate, setHijriDate] = useState<string>("Bumi Slahung • Ponorogo");

  useEffect(() => {
    // Pick daily index based on day of month
    const today = new Date();
    const day = today.getDate();
    setMahfuzhatIdx(day % MAHFUZHAT_DAILY.length);

    // Format local date with Hijri context
    try {
      const loc = locale === "ar" ? "ar-SA-u-ca-islamic" : locale === "en" ? "en-US-u-ca-islamic" : "id-ID-u-ca-islamic";
      const formatter = new Intl.DateTimeFormat(loc, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const locationText = locale === "ar" ? "سلاهونج فونوروجو" : locale === "en" ? "Slahung Ponorogo" : "Slahung Ponorogo";
      setHijriDate(`${formatter.format(today)} • ${locationText}`);
    } catch {
      setHijriDate("1447 H • Slahung Ponorogo");
    }
  }, [locale]);

  const current = MAHFUZHAT_DAILY[mahfuzhatIdx];

  const nextWisdom = () => {
    setMahfuzhatIdx((prev) => (prev + 1) % MAHFUZHAT_DAILY.length);
  };

  return (
    <div className="daily-wisdom-banner">
      {/* Authentic Washi / Masking Tape on Desk Memo */}
      <div className="memo-masking-tape" title="Selotip Secarik Memo"></div>
      {/* Dog-Ear Paper Fold (Lipatan Pembatas Kertas Memo) */}
      <div className="memo-dog-ear" title="Lipatan Pembatas Memo Santri"></div>
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
            title={locale === "ar" ? "حكمة أخرى" : locale === "en" ? "Next Wisdom" : "Ganti Mutiara Mahfuzhat Berikutnya"}
          >
            <i className="fa-solid fa-shuffle"></i>
            <span>{locale === "ar" ? "حكمة أخرى" : locale === "en" ? "Next Wisdom" : "Hikmah Lain"}</span>
          </button>

          <Link href="/mahfuzhat" className="btn-explore-mahfuzhat">
            <i className="fa-solid fa-book-open"></i>
            <span>{locale === "ar" ? "تصفح المحفوظات" : locale === "en" ? "Explore Mahfuzhat" : "Buka 100+ Mahfuzhat"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
