"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { triggerHaptic } from "@/lib/haptic";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface RealKtaCardProps {
  standalone?: boolean;
}

export default function RealKtaCard({ standalone = false }: RealKtaCardProps) {
  const { locale } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -14;
    const rotY = ((x - centerX) / centerX) * 14;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.65,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const rect = cardRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -16;
    const rotY = ((x - centerX) / centerX) * 16;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: Math.max(0, Math.min(100, (x / rect.width) * 100)),
      y: Math.max(0, Math.min(100, (y / rect.height) * 100)),
      opacity: 0.65,
    });
  };

  const handleTouchEnd = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleFlip = () => {
    triggerHaptic([20, 30]);
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className={`real-kta-showcase-container ${standalone ? "standalone" : ""}`}>
      {/* 3D Perspective Card Wrapper */}
      <div
        className="real-kta-card-perspective"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleFlip}
        title={locale === "ar" ? "انقر لقلب البطاقة" : locale === "en" ? "Click to flip card" : "Klik untuk membalik kartu (Depan / Belakang)"}
      >
        <div
          ref={cardRef}
          className={`real-kta-card-inner ${isFlipped ? "is-flipped" : ""}`}
          style={{
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
          }}
        >
          {/* =========================================================
              MUKA DEPAN (FRONT FACE - PHYSICAL OBSIDIAN GOLD PVC)
              ========================================================= */}
          <div className="real-kta-face real-kta-front">
            {/* Holographic Rainbow Light Dispersion Overlay */}
            <div
              className="real-kta-holographic-glare"
              style={{
                background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 215, 0, 0.45) 0%, rgba(56, 189, 248, 0.25) 30%, rgba(236, 72, 153, 0.2) 50%, transparent 75%)`,
                opacity: glarePos.opacity,
              }}
            />

            {/* Glossy Specular Reflection Beam */}
            <div
              className="real-kta-gloss-shine"
              style={{
                transform: `translateX(${(glarePos.x - 50) * 1.5}%) translateY(${(glarePos.y - 50) * 1.5}%) rotate(25deg)`,
              }}
            />

            {/* Background Guilloche Security Pattern */}
            <div className="real-kta-guilloche-bg" />

            {/* Top Header: Brand & Institution */}
            <div className="real-kta-header">
              <div className="real-kta-brand-left">
                <div className="real-kta-logo-emblem">
                  <Image
                    src="/images/logo-utuh.webp"
                    alt="Logo Expedient"
                    width={28}
                    height={28}
                    className="kta-logo-img"
                  />
                </div>
                <div>
                  <div className="real-kta-sovereign-title">EXPEDIENT SOVEREIGN</div>
                  <div className="real-kta-institution-sub">ARRISALAH ISLAMIC BOARDING SCHOOL • 2025</div>
                </div>
              </div>
              <div className="real-kta-contactless-mark">
                <svg viewBox="0 0 24 24" width="20" height="20" className="nfc-waves-svg">
                  <path d="M12 4c4.4 0 8 3.6 8 8" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 8c2.2 0 4 1.8 4 4" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="1.5" fill="#d4af37" />
                </svg>
              </div>
            </div>

            {/* Smart EMV Microchip & Hologram Security Seal Row */}
            <div className="real-kta-chip-row">
              {/* Ultra-realistic Gold Smart Chip with circuit pads */}
              <div className="real-emv-chip">
                <div className="emv-pad-lines">
                  <span className="emv-pad pad-tl" />
                  <span className="emv-pad pad-tr" />
                  <span className="emv-pad pad-bl" />
                  <span className="emv-pad pad-br" />
                  <span className="emv-core-circle" />
                </div>
              </div>

              {/* Prismatic Hologram Security Seal */}
              <div className="real-kta-hologram-seal" title="Segel Hologram Keaslian Resmi">
                <div className="hologram-seal-inner">
                  <span className="hologram-seal-star">⚜️</span>
                  <span className="hologram-seal-text">AUTHENTIC • 43</span>
                </div>
              </div>
            </div>

            {/* Embossed Thermal Card Number */}
            <div className="real-kta-embossed-num">
              <span>4325</span>
              <span>2025</span>
              <span>0043</span>
              <span className="gold-highlight">088</span>
            </div>

            {/* Cardholder Details & Verified Alumni Photo */}
            <div className="real-kta-footer">
              <div className="real-kta-bio">
                <div className="bio-field-group">
                  <span className="bio-label">
                    {locale === "ar" ? "اسم الخريج" : locale === "en" ? "MEMBER NAME" : "NAMA LENGKAP"}
                  </span>
                  <span className="bio-value">AHMAD ARRISALAH</span>
                </div>

                <div className="bio-meta-row">
                  <div className="bio-field-group">
                    <span className="bio-label">
                      {locale === "ar" ? "الدفعة" : locale === "en" ? "COHORT" : "ANGKATAN"}
                    </span>
                    <span className="bio-value-small">43 • EXPEDIENT</span>
                  </div>
                  <div className="bio-field-group">
                    <span className="bio-label">
                      {locale === "ar" ? "الصلاحية" : locale === "en" ? "EXPIRES" : "MASA BERLAKU"}
                    </span>
                    <span className="bio-value-small gold">PERPETUAL</span>
                  </div>
                </div>
              </div>

              {/* Alumni Photo Frame with Gold Bevel */}
              <div className="real-kta-photo-box">
                <div className="photo-inner-wrapper">
                  <Image
                    src="/assets/foto_putra/Hal 21.webp"
                    alt="Foto Alumni"
                    width={64}
                    height={76}
                    className="alumni-portrait-img"
                  />
                  <div className="photo-watermark-stamp">EXP-43</div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================
              MUKA BELAKANG (BACK FACE - MAGNETIC STRIPE & VERIFICATION)
              ========================================================= */}
          <div className="real-kta-face real-kta-back">
            {/* Full-width Black Magnetic Stripe */}
            <div className="real-kta-magnetic-stripe">
              <div className="mag-gloss-sweep" />
            </div>

            {/* White Signature Strip & Security Guilloche */}
            <div className="real-kta-signature-section">
              <div className="real-kta-signature-strip">
                <span className="sig-security-pattern">EXPEDIENT43 OFFICIAL SIGNATURE ONLY</span>
                <span className="sig-handwritten">Ahmad Arrisalah</span>
                <span className="sig-cvv">438</span>
              </div>
              <span className="sig-notice">NOT VALID WITHOUT SIGNATURE</span>
            </div>

            {/* Institutional Verification Notice & QR Code */}
            <div className="real-kta-back-body">
              <div className="back-info-col">
                <p className="institution-legal-text">
                  Kartu ini adalah identitas resmi anggota kehormatan Ikatan Alumni Pondok Modern Arrisalah
                  Slahung Ponorogo Angkatan 43 (Expedient Generation 2025). Segala hak akses portal,
                  kehadiran reuni akbar, dan fasilitas ekosistem melekat pada pemegang kartu ini.
                </p>
                <div className="institution-address">
                  <strong>PONDOK MODERN ARRISALAH</strong>
                  <span>Gundik, Slahung, Kabupaten Ponorogo, Jawa Timur 63463</span>
                </div>
              </div>

              {/* Crisp Official Verification QR Code */}
              <div className="real-kta-qr-wrap" title="Pindai untuk verifikasi status anggota resmi">
                <div className="qr-code-box">
                  {/* SVG Crisp QR Simulation */}
                  <svg viewBox="0 0 100 100" width="46" height="46" className="real-qr-svg">
                    <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                    {/* Corner 1 */}
                    <rect x="8" y="8" width="28" height="28" fill="#000000" />
                    <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="18" width="8" height="8" fill="#000000" />
                    {/* Corner 2 */}
                    <rect x="64" y="8" width="28" height="28" fill="#000000" />
                    <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                    <rect x="74" y="18" width="8" height="8" fill="#000000" />
                    {/* Corner 3 */}
                    <rect x="8" y="64" width="28" height="28" fill="#000000" />
                    <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                    <rect x="18" y="74" width="8" height="8" fill="#000000" />
                    {/* Data patterns */}
                    <rect x="42" y="14" width="8" height="8" fill="#000000" />
                    <rect x="42" y="30" width="16" height="8" fill="#000000" />
                    <rect x="14" y="42" width="8" height="16" fill="#000000" />
                    <rect x="30" y="42" width="16" height="8" fill="#000000" />
                    <rect x="52" y="42" width="8" height="8" fill="#000000" />
                    <rect x="70" y="42" width="16" height="16" fill="#000000" />
                    <rect x="42" y="56" width="16" height="16" fill="#000000" />
                    <rect x="64" y="64" width="8" height="16" fill="#000000" />
                    <rect x="78" y="70" width="14" height="8" fill="#000000" />
                    <rect x="42" y="78" width="12" height="14" fill="#000000" />
                  </svg>
                </div>
                <span className="qr-caption">VERIFIED 43</span>
              </div>
            </div>

            {/* Back Bottom Barcode Strip */}
            <div className="real-kta-barcode-row">
              <div className="barcode-bars">
                <span className="b-bar b-1" /><span className="b-bar b-2" /><span className="b-bar b-1" /><span className="b-bar b-3" />
                <span className="b-bar b-2" /><span className="b-bar b-1" /><span className="b-bar b-2" /><span className="b-bar b-3" />
                <span className="b-bar b-1" /><span className="b-bar b-3" /><span className="b-bar b-2" /><span className="b-bar b-1" />
                <span className="b-bar b-3" /><span className="b-bar b-2" /><span className="b-bar b-1" /><span className="b-bar b-2" />
                <span className="b-bar b-1" /><span className="b-bar b-3" /><span className="b-bar b-2" /><span className="b-bar b-3" />
                <span className="b-bar b-1" /><span className="b-bar b-2" /><span className="b-bar b-1" /><span className="b-bar b-3" />
              </div>
              <span className="barcode-num">4300-2025-088-EXP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Action Control Toolbar */}
      <div className="real-kta-controls">
        <button
          type="button"
          className="btn-kta-flip"
          onClick={handleFlip}
          aria-label="Putar Kartu KTA"
        >
          <i className="fa-solid fa-arrows-rotate"></i>
          <span>
            {isFlipped
              ? locale === "ar" ? "عرض الوجه الأمامي" : locale === "en" ? "View Front Face" : "Lihat Muka Depan"
              : locale === "ar" ? "عرض الوجه الخلفي" : locale === "en" ? "View Back Face" : "Putar Kartu (Muka Belakang)"}
          </span>
        </button>

        <Link href="/sovereign" className="btn-kta-explore">
          <i className="fa-solid fa-cube"></i>
          <span>{locale === "ar" ? "استوديو 3D الكامل" : locale === "en" ? "Open 3D Studio" : "Buka Studio 3D (KTA Penuh)"}</span>
        </Link>
      </div>
    </div>
  );
}
