"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function DailyWisdomWidget() {
  const { t, locale } = useLanguage();
  const proverbs = t.daily_proverbs && t.daily_proverbs.length > 0 ? t.daily_proverbs : [];
  const [mahfuzhatIdx, setMahfuzhatIdx] = useState(0);
  const [hijriDate, setHijriDate] = useState<string>("Bumi Slahung • Ponorogo");
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopActiveAudio = () => {
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current.currentTime = 0;
      } catch {}
      activeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
  };

  useEffect(() => {
    return () => {
      stopActiveAudio();
    };
  }, [mahfuzhatIdx]);

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
    stopActiveAudio();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
    if (proverbs.length > 0) {
      setMahfuzhatIdx((prev) => (prev + 1) % proverbs.length);
    }
  };

  const copyWisdom = () => {
    if (typeof navigator !== "undefined") {
      if (navigator.vibrate) navigator.vibrate(10);
      const textToCopy = `*Secarik Mahfuzhat Santri Arrisalah* 📜\n\n${current.arabic}\n"${current.latin}"\n\n_Artinya:_ ${current.arti}\n\n— Expedient Generation 43`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2200);
      }).catch(() => {});
    }
  };

  const shareToWhatsApp = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://expedientgeneration.vercel.app";
    const textToShare = `*Secarik Mahfuzhat Santri Arrisalah* 📜\n\n${current.arabic}\n"${current.latin}"\n\n_${current.arti}_\n\n🔗 ${siteUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const fallbackWebSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeaking(false);
      setIsLoadingAudio(false);
      return;
    }

    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(current.arabic);
      utterance.lang = "ar-SA";
      utterance.rate = 0.85;

      utterance.onstart = () => {
        setIsLoadingAudio(false);
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsLoadingAudio(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsLoadingAudio(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
      setIsLoadingAudio(false);
    }
  };

  const speakArabic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);

    if (isSpeaking || isLoadingAudio) {
      stopActiveAudio();
      return;
    }

    setIsLoadingAudio(true);

    try {
      // 1. High-fidelity native Arabic audio stream from server API (Option A engine)
      const audioUrl = `/api/audio/tts?text=${encodeURIComponent(current.arabic)}&lang=ar`;
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      audio.onplay = () => {
        setIsLoadingAudio(false);
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setIsLoadingAudio(false);
        activeAudioRef.current = null;
      };

      audio.onerror = () => {
        console.warn("Server TTS playback failed, falling back to Web Speech Synthesis");
        activeAudioRef.current = null;
        fallbackWebSpeech();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio play promise error, trying Web Speech fallback:", err);
          fallbackWebSpeech();
        });
      }
    } catch {
      fallbackWebSpeech();
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

          <div className="wisdom-arabic-row">
            <div className="wisdom-arabic-text" dir="rtl">
              {current.arabic}
            </div>

            {/* Listen Audio Pronunciation Button */}
            <button
              type="button"
              className={`btn-listen-arabic ${isSpeaking ? "speaking" : ""} ${isLoadingAudio ? "loading" : ""}`}
              onClick={speakArabic}
              title={isSpeaking ? "Hentikan Suara" : isLoadingAudio ? "Memuat Suara..." : "Dengarkan Pelafalan Bahasa Arab"}
              aria-label="Dengarkan Lafal Arab"
            >
              <i className={`fa-solid ${isLoadingAudio ? "fa-spinner fa-spin" : isSpeaking ? "fa-volume-high live-audio-pulse" : "fa-volume-low"}`}></i>
            </button>
          </div>

          <div className="wisdom-translation-row">
            <span className="wisdom-latin">&ldquo;{current.latin}&rdquo;</span>
            <span className="wisdom-divider">—</span>
            <span className="wisdom-meaning">{current.arti}</span>
          </div>
        </div>

        <div className="wisdom-banner-actions">
          {/* Quick Action: Shuffle Next Wisdom */}
          <button
            type="button"
            className="btn-next-wisdom"
            onClick={nextWisdom}
            title={t.daily_wisdom.next_btn}
          >
            <i className="fa-solid fa-shuffle"></i>
            <span>{t.daily_wisdom.next_btn}</span>
          </button>

          {/* Quick Action: Copy to Clipboard */}
          <button
            type="button"
            className={`btn-wisdom-action ${isCopied ? "copied" : ""}`}
            onClick={copyWisdom}
            title={isCopied ? "Tersalin!" : "Salin Teks Hikmah"}
          >
            <i className={`fa-solid ${isCopied ? "fa-check" : "fa-copy"}`}></i>
            <span>{isCopied ? (locale === "ar" ? "تم النسخ!" : locale === "en" ? "Copied!" : "Tersalin!") : (locale === "ar" ? "نسخ" : locale === "en" ? "Copy" : "Salin")}</span>
          </button>

          {/* Quick Action: Share to WhatsApp Story / Chat */}
          <button
            type="button"
            className="btn-wisdom-action btn-wisdom-wa"
            onClick={shareToWhatsApp}
            title="Bagikan ke WhatsApp Status"
          >
            <i className="fa-brands fa-whatsapp"></i>
            <span>{locale === "ar" ? "مشاركة" : locale === "en" ? "Share" : "Status WA"}</span>
          </button>

          {/* Link to Full Mahfuzhat Hub */}
          <Link href="/mahfuzhat" className="btn-explore-mahfuzhat">
            <i className="fa-solid fa-book-open"></i>
            <span>{t.daily_wisdom.explore_btn}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
