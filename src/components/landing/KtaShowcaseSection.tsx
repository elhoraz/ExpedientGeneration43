"use client";

import Link from "next/link";
import RealKtaCard from "./RealKtaCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function KtaShowcaseSection() {
  const { locale } = useLanguage();

  return (
    <section className="kta-showcase-section" id="kta">
      {/* Ambient Radial Luxury Gold Glow Behind Showcase */}
      <div className="kta-showcase-ambient-glow" aria-hidden="true" />

      <div className="section-header">
        <div className="landing-prestige-badge" style={{ marginBottom: "14px" }}>
          <i className="fa-solid fa-id-card"></i>
          <span>{locale === "ar" ? "الهوية الرسمية • بطاقة الخريج 3D" : locale === "en" ? "OFFICIAL IDENTITY • 3D ALUMNI CARD" : "IDENTITAS RESMI • KTA DIGITAL FISIK"}</span>
        </div>
        <h2 className="section-title">
          {locale === "ar" ? "بطاقة السيادة: بطاقة الهوية الرقمية ثلاثية الأبعاد" : locale === "en" ? "The Sovereign: Ultra-HD Physical Alumni Card" : "The Sovereign: Kartu Identitas Fisik Digital 3D"}
        </h2>
        <p className="section-lead">
          {locale === "ar"
            ? "بطاقة هوية رسمية مصممة بمعايير بطاقات ID-1 الدقيقة، مزودة بشريحة ذكية، ختم هولوجرام ثلاثي الأبعاد، ورمز استجابة سريعة للتحقق الفوري."
            : locale === "en"
            ? "Official credential card engineered to ISO ID-1 physical card standards, featuring an authentic EMV microchip, chromatic 3D hologram seal, and live verification QR code."
            : "Kartu Tanda Anggota (KTA) resmi berstandar presisi fisik ID-1 ISO/IEC 7810. Dilengkapi simulasi chip EMV emas, segel hologram prismatik pelangi anti-pemalsuan, penomoran timbul termal, dan QR Code verifikasi anggota."}
        </p>
      </div>

      <div className="kta-showcase-grid">
        {/* Left Column: Physical Specs & Interactive Benefits */}
        <div className="kta-specs-col">
          <div className="kta-spec-pill">
            <span className="live-pulse-dot" />
            <span>{locale === "ar" ? "محاكاة ثلاثية الأبعاد تفاعلية" : locale === "en" ? "Interactive 3D Simulation" : "Simulasi Fisik Interaktif 3D"}</span>
          </div>

          <h3 className="kta-specs-headline">
            {locale === "ar" ? "دقة بصرية فائقة • كأنها بين يديك" : locale === "en" ? "Photorealistic Precision In Your Hands" : "Presisi Visual Nyata Layaknya Kartu Asli"}
          </h3>

          <p className="kta-specs-desc">
            {locale === "ar"
              ? "حرك المؤشر أو شاشة اللمس لمشاهدة انعكاس الضوء على اللوح البلاستيكي الفاخر، وانقر لقلب البطاقة لمشاهدة الشريط المغناطيسي وبيانات التوثيق الرسمية."
              : locale === "en"
              ? "Move your cursor or touch display to witness dynamic specular glare sweep across the obsidian PVC surface. Click or tap to flip and inspect the magnetic stripe and verification details."
              : "Gerakkan kursor atau usap layar untuk melihat pantulan berkas cahaya kaca di atas permukaan Obsidian PVC. Klik kartu untuk membalik 180° dan memeriksa pita magnetik serta panel tanda tangan sah."}
          </p>

          {/* 4 Authentic Physical Specifications */}
          <div className="kta-specs-list">
            <div className="kta-spec-item">
              <div className="spec-icon-box">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <div className="spec-text">
                <strong>{locale === "ar" ? "شريحة EMV الذهبية الذكية" : locale === "en" ? "Gold-Plated EMV Chip" : "Smart Chip EMV Emas Asli"}</strong>
                <span>{locale === "ar" ? "مصفوفة تلامس 8-pad بدقة متناهية تحاكي الدوائر النحاسية" : locale === "en" ? "Micro-etched 8-pad contact pad simulating genuine circuit traces" : "Kontak 8-pad presisi dengan jalur etching sirkuit mikro tembaga"}</span>
              </div>
            </div>

            <div className="kta-spec-item">
              <div className="spec-icon-box">
                <i className="fa-solid fa-certificate"></i>
              </div>
              <div className="spec-text">
                <strong>{locale === "ar" ? "ختم هولوجرام موشوري ملون" : locale === "en" ? "Prismatic Hologram Seal" : "Segel Hologram Prismatik Pelangi"}</strong>
                <span>{locale === "ar" ? "تشتت لوني ديناميكي يغير ألوان الطيف مع زاوية ميلان البطاقة" : locale === "en" ? "Iridescent rainbow spectrum dispersion shifting dynamically with card angle" : "Dispersi spektrum warna pelangi yang membiaskan cahaya saat kartu dimiringkan"}</span>
              </div>
            </div>

            <div className="kta-spec-item">
              <div className="spec-icon-box">
                <i className="fa-solid fa-barcode"></i>
              </div>
              <div className="spec-text">
                <strong>{locale === "ar" ? "شريط مغناطيسي ورمز التحقق QR" : locale === "en" ? "Magnetic Stripe & QR Verification" : "Pita Magnetik & QR Verifikasi"}</strong>
                <span>{locale === "ar" ? "شريط أسود كلاسيكي ورمز QR متصل بقاعدة بيانات الأرشيف" : locale === "en" ? "Integrated magnetic stripe & QR code connected to live cohort registry" : "Pita magnetik pekat dan QR Code yang terhubung langsung ke basis data alumni"}</span>
              </div>
            </div>

            <div className="kta-spec-item">
              <div className="spec-icon-box">
                <i className="fa-solid fa-fingerprint"></i>
              </div>
              <div className="spec-text">
                <strong>{locale === "ar" ? "أرقام نافرة بارزة حرارياً" : locale === "en" ? "Thermal Embossed Typography" : "Nomor Kartu Thermal Embossed Timbul"}</strong>
                <span>{locale === "ar" ? "أرقام بطاقة نافرة بظلال واقعية تشبه بطاقات الائتمان الحقيقية" : locale === "en" ? "Embossed raised numbers with 3D tactile drop shadows and metallic bevels" : "Angka timbul fisik dengan bayangan nyata layaknya kartu cetak timbul resmi"}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="kta-action-group">
            <Link href="/sovereign" className="btn-primary" id="btnExploreSovereignStudio">
              <i className="fa-solid fa-cube"></i>
              <span>{locale === "ar" ? "دخول استوديو 3D الكامل" : locale === "en" ? "Open Full 3D Studio" : "Buka Studio 3D (KTA Penuh)"}</span>
            </Link>
            <Link href="/login" className="btn-secondary">
              <i className="fa-solid fa-id-card"></i>
              <span>{locale === "ar" ? "تحميل بطاقتي الشخصية" : locale === "en" ? "Claim My Alumni Card" : "Klaim Kartu Saya"}</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Giant Ultra-HD 3D Physical Card Display */}
        <div className="kta-card-display-col">
          <div className="giant-card-stage">
            <div className="giant-card-glow-halo" />
            <RealKtaCard standalone={true} />
            <div className="giant-card-hint">
              <i className="fa-solid fa-hand-pointer"></i>
              <span>{locale === "ar" ? "حرك الماوس للميلان ثلاثي الأبعاد • انقر لقلب البطاقة" : locale === "en" ? "Move mouse to tilt in 3D • Click or tap card to flip" : "Gerakkan mouse untuk 3D tilt • Klik kartu untuk memutar muka depan/belakang"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
