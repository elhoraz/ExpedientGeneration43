"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { getAvatarFallback, getAvatarUrl } from "@/lib/avatar";
import { getGelar, getGelarIcon } from "@/lib/gamification";
import { ProfileItem, buildVCardPayload, buildWhatsAppLink } from "../types";

interface AlumniDetailSheetProps {
  user: ProfileItem | null;
  isClosing: boolean;
  isLoggedIn: boolean;
  currentUserId: string | null;
  failedPhotos: Record<string, boolean>;
  onPhotoError: (userId: string) => void;
  onClose: () => void;
  onOpenQr: (user: ProfileItem) => void;
  triggerHaptic: (duration?: number) => void;
  locale: string;
  t: any;
}

export function AlumniDetailSheet({
  user,
  isClosing,
  isLoggedIn,
  currentUserId,
  failedPhotos,
  onPhotoError,
  onClose,
  onOpenQr,
  triggerHaptic,
  locale,
  t,
}: AlumniDetailSheetProps) {
  const [sheetTab, setSheetTab] = useState<"biodata" | "kontak" | "visi">("biodata");
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  useEffect(() => {
    setSheetTab("biodata");
    setDragY(0);
    setIsDragging(false);
  }, [user?.id]);

  if (!user) return null;

  const formatDisplayPhone = (target: ProfileItem) => {
    if (!isLoggedIn) return t.direktori.wa_locked;
    const isOwner = Boolean(currentUserId && currentUserId === target.id);
    const isPublic = target.privacy_settings?.show_whatsapp !== false;

    if (!target.no_whatsapp) return "-";
    if (!isPublic && !isOwner) {
      const raw = target.no_whatsapp.replace(/\D/g, "");
      return raw.length > 6 ? `+${raw.slice(0, 4)} ••••-••• (Privat)` : t.direktori.wa_private;
    }
    return target.no_whatsapp;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = performance.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || e.touches.length !== 1) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (delta > 0) {
      setDragY(delta);
    } else {
      // Elastic resistance when pulling upward
      setDragY(delta * 0.15);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null) return;
    const elapsed = Math.max(1, performance.now() - touchStartTimeRef.current);
    const velocity = dragY / elapsed;
    setIsDragging(false);
    touchStartYRef.current = null;

    if (dragY > 95 || (dragY > 36 && velocity > 0.45)) {
      triggerHaptic(10);
      setDragY(0);
      onClose();
    } else {
      setDragY(0);
    }
  };

  const waLink = buildWhatsAppLink(user, isLoggedIn, currentUserId);
  const points = user.prestise_points || 0;
  const backdropOpacity = isDragging && dragY > 0 ? Math.max(0.25, 1 - dragY / 360) : undefined;

  return (
    <div
      className={`sheet-backdrop ${isClosing ? "closing" : ""}`}
      style={backdropOpacity !== undefined ? { opacity: backdropOpacity } : undefined}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={user.nama_lengkap}
    >
      <div
        className={`alumni-bottom-sheet ${isClosing ? "closing" : ""}`}
        style={{
          transform: dragY !== 0 ? `translateY(${Math.max(0, dragY)}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Real Swipeable Drag Header Zone */}
        <div
          className="sheet-drag-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <span className="drag-pill" aria-hidden="true" />
        </div>

        {/* Sheet Header */}
        <div className="sheet-header">
          <button
            type="button"
            className="sheet-close-btn"
            onClick={onClose}
            aria-label={t.common.close}
            title={t.common.close}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <div className="sheet-hero-row">
            <div className="sheet-avatar-ring">
              <Image
                src={
                  failedPhotos[user.id]
                    ? getAvatarFallback(user.nama_panggilan || user.nama_lengkap)
                    : getAvatarUrl(user.foto_profil, user.nama_panggilan || user.nama_lengkap)
                }
                width={80}
                height={80}
                className="sheet-avatar-img"
                alt={user.nama_panggilan || user.nama_lengkap}
                sizes="80px"
                onError={() => onPhotoError(user.id)}
                unoptimized
              />
            </div>

            <div className="sheet-hero-info">
              <h2 className="sheet-user-name">{user.nama_lengkap}</h2>
              <div className="sheet-user-panggilan">
                {user.nama_panggilan || "Alumni 43"}
              </div>
              <div className="sheet-badges-container">
                <span className="sheet-gelar-badge">
                  <i className={getGelarIcon(points)}></i> {getGelar(points)}
                </span>
                {user.kelas && (
                  <span className="sheet-class-badge">
                    {t.direktori_extra.filter_class_prefix} {user.kelas}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Action Dock */}
        <div className="sheet-action-dock">
          {!isLoggedIn ? (
            <Link href="/login" className="dock-action-btn dock-disabled" title={t.direktori.wa_locked}>
              <i className="fa-solid fa-lock"></i>
              <span>{t.direktori.wa_locked}</span>
            </Link>
          ) : waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="dock-action-btn dock-whatsapp"
              title={t.direktori.contact_wa}
              onClick={() => triggerHaptic(15)}
            >
              <i className="fa-brands fa-whatsapp"></i>
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="dock-action-btn dock-disabled"
              title="Nomor WhatsApp disembunyikan"
            >
              <i className="fa-solid fa-lock"></i>
              <span>{t.direktori.wa_private}</span>
            </button>
          )}

          {isLoggedIn ? (
            <a
              href={`/api/vcard/${user.id}`}
              download={`Expedient_${(user.nama_panggilan || user.nama_lengkap || "Kontak").replace(/[^a-zA-Z0-9_-]/g, "_")}.vcf`}
              className="dock-action-btn dock-vcard"
              onClick={() => triggerHaptic(12)}
            >
              <i className="fa-solid fa-address-card"></i>
              <span>{t.direktori.card_vcard_btn}</span>
            </a>
          ) : (
            <Link href="/login" className="dock-action-btn dock-disabled">
              <i className="fa-solid fa-lock"></i>
              <span>{t.direktori.card_vcard_btn}</span>
            </Link>
          )}

          <button
            type="button"
            className="dock-action-btn dock-qr"
            onClick={() => {
              triggerHaptic(10);
              onOpenQr(user);
            }}
          >
            <i className="fa-solid fa-qrcode"></i>
            <span>QR</span>
          </button>

          {isLoggedIn && (
            <Link
              href={`/chat/personal/${user.id}`}
              className="dock-action-btn dock-chat"
              onClick={() => triggerHaptic(12)}
            >
              <i className="fa-solid fa-comment-dots"></i>
              <span>Chat</span>
            </Link>
          )}
        </div>

        {/* Sheet Tabs */}
        <div className="sheet-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={sheetTab === "biodata"}
            className={`sheet-tab-btn ${sheetTab === "biodata" ? "active" : ""}`}
            onClick={() => {
              setSheetTab("biodata");
              triggerHaptic(8);
            }}
          >
            {t.direktori.modal_personal}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sheetTab === "kontak"}
            className={`sheet-tab-btn ${sheetTab === "kontak" ? "active" : ""}`}
            onClick={() => {
              setSheetTab("kontak");
              triggerHaptic(8);
            }}
          >
            {t.direktori.modal_social}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sheetTab === "visi"}
            className={`sheet-tab-btn ${sheetTab === "visi" ? "active" : ""}`}
            onClick={() => {
              setSheetTab("visi");
              triggerHaptic(8);
            }}
          >
            {t.direktori.modal_vision}
          </button>
        </div>

        {/* Sheet Body */}
        <div className="sheet-content-body">
          {sheetTab === "biodata" && (
            <div className="sheet-section-block">
              <div className="sheet-field-group">
                <span className="field-label">{t.direktori.field_birth}</span>
                <span className="field-value">
                  {user.tempat_lahir || "-"}
                  {user.tanggal_lahir
                    ? `, ${new Date(user.tanggal_lahir).toLocaleDateString(
                        locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "id-ID",
                        { day: "2-digit", month: "long", year: "numeric" }
                      )}`
                    : ""}
                </span>
              </div>

              <div className="sheet-field-group">
                <span className="field-label">{t.direktori.field_domicile}</span>
                <span className="field-value">
                  {user.alamat_lengkap ||
                    (locale === "ar"
                      ? "لم يُسجّل بعد"
                      : locale === "en"
                      ? "Not recorded yet"
                      : "Belum dicatat")}
                </span>
              </div>

              <div className="sheet-field-group">
                <span className="field-label">{t.direktori.field_aspiration}</span>
                <span className="field-value">
                  {user.cita_cita ||
                    (locale === "ar"
                      ? "أن أكون شخصاً نافعاً للأمة."
                      : locale === "en"
                      ? "To become a beneficial individual for society."
                      : "Menjadi pribadi yang berdaya guna bagi umat.")}
                </span>
              </div>
            </div>
          )}

          {sheetTab === "kontak" && (
            <div className="sheet-section-block">
              <div className="sheet-field-group">
                <span className="field-label">{t.direktori.field_phone}</span>
                <span className="field-value">{formatDisplayPhone(user)}</span>
                {!isLoggedIn ? (
                  <span className="privacy-shield-note">
                    <i className="fa-solid fa-lock"></i> {t.direktori.privacy_shield_guest}{" "}
                    <Link href="/login" className="privacy-login-link">
                      {locale === "ar" ? "دخول" : locale === "en" ? "Login" : "Masuk"}
                    </Link>
                  </span>
                ) : user.privacy_settings?.show_whatsapp === false && user.id !== currentUserId ? (
                  <span className="privacy-shield-note">
                    <i className="fa-solid fa-shield-halved"></i> {t.direktori.privacy_shield_member}
                  </span>
                ) : null}
              </div>

              <div className="sheet-field-group">
                <span className="field-label">{t.direktori.field_vcard}</span>
                <span className="field-value">
                  {isLoggedIn ? (
                    t.direktori.vcard_desc_member
                  ) : (
                    <span>
                      {t.direktori.vcard_desc_guest}{" "}
                      <Link href="/login" className="privacy-login-link">
                        {locale === "ar" ? "دخول" : locale === "en" ? "Login" : "Masuk"}
                      </Link>
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {sheetTab === "visi" && (
            <div className="sheet-section-block">
              <div className="sheet-field-group">
                <span className="field-label">{t.direktori.field_quote}</span>
                <blockquote className="sheet-quote">
                  &ldquo;
                  {user.motivasi_hidup ||
                    (locale === "ar"
                      ? "ابق مخلصاً، بسيطاً، ومعتمداً على النفس أينما خطوت."
                      : locale === "en"
                      ? "Stay sincere, simple, and self-reliant wherever you tread."
                      : "Tetap ikhlas, sederhana, dan berdikari di mana pun melangkah.")}
                  &rdquo;
                </blockquote>
              </div>

              <div className="sheet-field-group">
                <span className="field-label">{t.direktori.field_social}</span>
                <div className="sheet-social-links">
                  {user.akun_ig ? (
                    <a
                      href={`https://instagram.com/${user.akun_ig.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sheet-social-badge ig-badge"
                    >
                      <i className="fa-brands fa-instagram"></i> @{user.akun_ig.replace("@", "")}
                    </a>
                  ) : (
                    <span className="muted-inline-note">
                      {locale === "ar"
                        ? "إنستغرام لم يُسجّل بعد"
                        : locale === "en"
                        ? "Instagram not listed"
                        : "Instagram belum dicantumkan"}
                    </span>
                  )}

                  {user.akun_tiktok && (
                    <a
                      href={`https://tiktok.com/@${user.akun_tiktok.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sheet-social-badge tt-badge"
                    >
                      <i className="fa-brands fa-tiktok"></i> @{user.akun_tiktok.replace("@", "")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface QrContactModalProps {
  user: ProfileItem | null;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onClose: () => void;
  locale: string;
  t: any;
}

export function QrContactModal({
  user,
  isLoggedIn,
  currentUserId,
  onClose,
  locale,
  t,
}: QrContactModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setQrDataUrl("");
      return;
    }
    let active = true;
    const payload = buildVCardPayload(user, isLoggedIn, currentUserId);
    QRCode.toDataURL(payload, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl("");
      });
    return () => {
      active = false;
    };
  }, [user, isLoggedIn, currentUserId]);

  if (!user) return null;

  return (
    <div className="qr-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={t.direktori.field_vcard}>
      <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="qr-card-tag">{t.direktori.field_vcard}</div>
        <h3 className="qr-card-title">{user.nama_panggilan || user.nama_lengkap}</h3>
        <p className="qr-card-desc">
          {locale === "ar"
            ? "وجّه كاميرا هاتفك نحو رمز الاستجابة السريعة لحفظ جهة الاتصال."
            : locale === "en"
            ? "Scan this QR code with your phone camera to save the contact locally."
            : "Arahkan kamera smartphone untuk menyimpan kontak secara langsung."}
        </p>

        <div className="qr-frame">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={t.direktori.field_vcard} className="qr-img-canvas" />
          ) : (
            <div className="skeleton-shimmer" style={{ width: 200, height: 200, borderRadius: 10 }} />
          )}
        </div>

        <div className="qr-card-actions">
          {isLoggedIn && (
            <a
              href={`/api/vcard/${user.id}`}
              download={`Expedient_${(user.nama_panggilan || user.nama_lengkap || "Kontak").replace(/[^a-zA-Z0-9_-]/g, "_")}.vcf`}
              className="btn-download-vcf"
            >
              <i className="fa-solid fa-download"></i>{" "}
              {locale === "ar" ? "تنزيل .vcf" : locale === "en" ? "Download .vcf" : "Unduh File .vcf"}
            </a>
          )}
          <button type="button" className="btn-close-qr" onClick={onClose}>
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}

