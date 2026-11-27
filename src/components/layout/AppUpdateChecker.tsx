"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAndroidNativeApp, isIosNativeApp } from "@/lib/notificationHelper";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useDialogEscape } from "@/hooks/useDialogEscape";
import { evaluateAppUpdate, type AppVersionData } from "@/lib/appUpdateLogic";

export default function AppUpdateChecker() {
  const pathname = usePathname();
  const { locale, isRTL } = useLanguage();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [versionData, setVersionData] = useState<AppVersionData | null>(null);
  const [currentVersion, setCurrentVersion] = useState({ code: 1, name: "1.0.0" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastCheckAtRef = useRef(0);
  const retryResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isApk =
      isAndroidNativeApp() ||
      Boolean((window as any).ExpedientNativeBridge) ||
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      /wv|Capacitor|Expedient/i.test(navigator.userAgent);

    // Only prompt native app shells with an out-of-date build; never interrupt web visitors with an update wall.
    if (!isApk) return;

    setIsNativeApp(true);

    let active = true;

    const readInstalledVersion = () => {
      let installedCode = 1;
      let installedName = "1.0.0";

      if ((window as any).ExpedientNativeBridge?.getAppVersionCode) {
        try {
          installedCode = Number((window as any).ExpedientNativeBridge.getAppVersionCode()) || 1;
          installedName = String((window as any).ExpedientNativeBridge.getAppVersionName?.() || "1.0.0");
        } catch (e) {
          console.warn("Could not read native app version code:", e);
        }
      } else {
        const uaMatch = navigator.userAgent.match(/ExpedientNativeApp\/([\d.]+)/i);
        if (uaMatch?.[1]) {
          installedName = uaMatch[1];
        }
      }

      return { installedCode, installedName };
    };

    const checkUpdate = async () => {
      try {
        lastCheckAtRef.current = Date.now();
        const { installedCode, installedName } = readInstalledVersion();
        if (!active) return;

        setCurrentVersion({ code: installedCode, name: installedName });

        const res = await fetch("/api/app-version", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data: AppVersionData = await res.json();
        if (!active) return;

        let dismissedSession = false;
        try {
          dismissedSession =
            sessionStorage.getItem(`dismissed_update_session_v${data.latestVersionCode}`) === "1";
        } catch {}

        const evaluation = evaluateAppUpdate(data, installedCode, dismissedSession);

        if (evaluation.shouldShowPrompt) {
          setVersionData(data);
          setUpdateAvailable(true);
          setIsDismissed(false);
        } else if (!evaluation.needsUpdate) {
          setVersionData(null);
          setUpdateAvailable(false);
        }
      } catch (err) {
        console.warn("Update check error:", err);
      }
    };

    const timer = setTimeout(() => {
      void checkUpdate();
    }, 800);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheckAtRef.current >= 60_000) {
        void checkUpdate();
      }
    };

    const handleOnline = () => {
      void checkUpdate();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      clearTimeout(timer);
      if (retryResetTimerRef.current) {
        clearTimeout(retryResetTimerRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const isMandatoryUpdate = Boolean(
    versionData && evaluateAppUpdate(versionData, currentVersion.code).isMandatory
  );

  const handleUpdate = () => {
    if (!versionData) return;
    setIsUpdating(true);

    if (retryResetTimerRef.current) {
      clearTimeout(retryResetTimerRef.current);
      retryResetTimerRef.current = null;
    }

    if (!isMandatoryUpdate) {
      try {
        sessionStorage.setItem(`dismissed_update_session_v${versionData.latestVersionCode}`, "1");
        localStorage.setItem("dismissed_update_version", String(versionData.latestVersionCode));
      } catch {}
    }

    if (isNativeApp && (window as any).ExpedientNativeBridge?.installApk) {
      try {
        (window as any).ExpedientNativeBridge.installApk(versionData.apkUrl);
        // Reset spinner so user can retry or use /download if system installer is cancelled
        retryResetTimerRef.current = setTimeout(() => {
          setIsUpdating(false);
        }, 6000);
        return;
      } catch (e) {
        console.error("Native installApk error:", e);
      }
    }

    if (isIosNativeApp() || /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = versionData.ipaUrl || "/download";
      retryResetTimerRef.current = setTimeout(() => {
        if (!isMandatoryUpdate) {
          setUpdateAvailable(false);
        }
        setIsUpdating(false);
      }, 2500);
      return;
    }

    window.location.href = versionData.apkUrl;

    retryResetTimerRef.current = setTimeout(() => {
      if (!isMandatoryUpdate) {
        setUpdateAvailable(false);
      }
      setIsUpdating(false);
    }, 2500);
  };

  const handleDismiss = useCallback(() => {
    if (isMandatoryUpdate) return;
    setIsDismissed(true);
    setUpdateAvailable(false);
    try {
      if (versionData) {
        sessionStorage.setItem(`dismissed_update_session_v${versionData.latestVersionCode}`, "1");
        localStorage.setItem("dismissed_update_version", String(versionData.latestVersionCode));
      }
    } catch {}
  }, [isMandatoryUpdate, versionData]);

  const shouldRender =
    isNativeApp &&
    pathname !== "/download" &&
    !pathname?.startsWith("/download/") &&
    updateAvailable &&
    !isDismissed &&
    Boolean(versionData);

  useDialogEscape(shouldRender, handleDismiss, isMandatoryUpdate);

  if (!shouldRender || !versionData) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "var(--surface-scrim, rgba(6, 11, 20, 0.76))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-update-title"
        dir={isRTL ? "rtl" : "ltr"}
        className="update-dialog-card"
        style={{
          width: "100%",
          maxWidth: "490px",
          background: "var(--bg-card, #0f141e)",
          border: "1px solid var(--border-strong, rgba(242, 239, 233, 0.19))",
          borderRadius: "20px",
          padding: "1.75rem 1.55rem",
          boxShadow: "var(--glass-shadow, 0 24px 48px rgba(0, 0, 0, 0.7))",
          color: "var(--text-primary, #f2efe9)",
          fontFamily: isRTL ? "var(--font-amiri, serif), sans-serif" : "var(--font-sans, inherit)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "var(--surface-raised, #171e2c)",
              border: "1px solid var(--gold-border, rgba(212, 175, 55, 0.35))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold-main, #d4af37)",
              fontSize: "1.35rem",
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            <i className="fa-solid fa-cloud-arrow-down" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 id="app-update-title" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary, #f2efe9)" }}>
                {isMandatoryUpdate
                  ? (locale === "ar" ? "تحديث إلزامي للتطبيق" : locale === "en" ? "Required App Update" : "Pembaruan Wajib Aplikasi")
                  : (locale === "ar" ? "يتوفر تحديث للتطبيق" : locale === "en" ? "App Update Available" : "Pembaruan Aplikasi Tersedia")}
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "8px",
                  background: "var(--surface-raised, #171e2c)",
                  color: "var(--gold-main, #d4af37)",
                  border: "1px solid var(--gold-border, rgba(212, 175, 55, 0.35))",
                }}
              >
                v{versionData.latestVersionName} (Build {versionData.latestVersionCode})
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "var(--text-secondary, #a1a8b5)" }}>
              {locale === "ar" ? "الإصدار المثبت حالياً: " : locale === "en" ? "Installed version: " : "Versi terpasang saat ini: "}
              <strong style={{ color: "var(--ruby-gem, #f87171)" }}>
                v{currentVersion.name} (Build {currentVersion.code})
              </strong>
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "12px",
            background: "var(--surface-raised, #171e2c)",
            border: "1px solid var(--gold-border, rgba(212, 175, 55, 0.35))",
            color: "var(--text-primary, #f2efe9)",
            fontSize: "0.85rem",
            lineHeight: 1.5,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <i
            className={`fa-solid ${isMandatoryUpdate ? "fa-triangle-exclamation" : "fa-circle-info"}`}
            aria-hidden="true"
            style={{ color: isMandatoryUpdate ? "var(--ruby-gem, #f87171)" : "var(--gold-main, #d4af37)", marginTop: "3px", flexShrink: 0 }}
          />
          <span>
            {isMandatoryUpdate
              ? (locale === "ar"
                  ? `لم يعد هذا الإصدار مدعوماً. يجب التحديث إلى v${versionData.latestVersionName} لمواصلة استخدام التطبيق ومزامنة البيانات بأمان.`
                  : locale === "en"
                  ? `Your installed version is no longer supported. Updating to v${versionData.latestVersionName} is required to keep using all features and cloud sync.`
                  : `Versi aplikasi Anda sudah usang dan wajib diperbarui ke v${versionData.latestVersionName} agar seluruh fitur, sinkronisasi cloud, dan keamanan berjalan normal.`)
              : versionData.title}
          </span>
        </div>

        <div
          style={{
            background: "var(--surface-inset, #090d16)",
            border: "1px solid var(--glass-border, rgba(242, 239, 233, 0.11))",
            borderRadius: "14px",
            padding: "1rem 1.15rem",
            marginBottom: "1.4rem",
          }}
        >
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "var(--gold-main, #d4af37)",
              marginBottom: "0.6rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <i className="fa-solid fa-list-check" aria-hidden="true" style={{ fontSize: "0.8rem" }} />
            <span>
              {locale === "ar"
                ? `ملاحظات الإصدار v${versionData.latestVersionName}:`
                : locale === "en"
                ? `Release Notes v${versionData.latestVersionName}:`
                : `Catatan Pembaruan Rilis v${versionData.latestVersionName}:`}
            </span>
          </div>
          <ul style={{ margin: 0, paddingInlineStart: "1.2rem", fontSize: "0.84rem", color: "var(--text-secondary, #a1a8b5)", lineHeight: 1.6 }}>
            {versionData.releaseNotes.map((note, idx) => (
              <li key={idx} style={{ marginBottom: idx === versionData.releaseNotes.length - 1 ? 0 : "5px" }}>
                {note}
              </li>
            ))}
          </ul>
        </div>

        {isUpdating ? (
          <div
            style={{
              padding: "1.2rem",
              background: "var(--surface-raised, #171e2c)",
              border: "1px solid var(--gold-border, rgba(212, 175, 55, 0.35))",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" style={{ color: "var(--gold-main, #d4af37)", fontSize: "1.35rem", marginBottom: "0.5rem" }} />
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #f2efe9)" }}>
              {locale === "ar" ? "جاري تحضير التحديث" : locale === "en" ? "Preparing Update" : "Menyiapkan Pembaruan"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #a1a8b5)", marginTop: "4px" }}>
              {locale === "ar"
                ? "إذا لم يبدأ التنزيل تلقائياً، افتح صفحة التنزيل."
                : locale === "en"
                ? "If the download does not start automatically, open the download page below."
                : "Jika pengunduhan tidak mulai otomatis, buka halaman unduhan di bawah."}
            </div>
            <Link
              href="/download"
              onClick={() => {
                if (!isMandatoryUpdate) {
                  setUpdateAvailable(false);
                }
              }}
              className="btn-gold"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "12px",
                padding: "9px 16px",
                borderRadius: "10px",
                fontSize: "0.84rem",
                textDecoration: "none",
              }}
            >
              <i className="fa-solid fa-download" aria-hidden="true" />
              <span>{locale === "ar" ? "فتح مركز التنزيل" : locale === "en" ? "Open Download Page" : "Buka Pusat Unduhan"}</span>
            </Link>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {!isMandatoryUpdate && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    flex: "1",
                    minHeight: "44px",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "12px",
                    background: "var(--surface-raised, #171e2c)",
                    border: "1px solid var(--border-strong, rgba(242, 239, 233, 0.19))",
                    color: "var(--text-secondary, #a1a8b5)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background-color 0.2s ease, color 0.2s ease",
                  }}
                >
                  {locale === "ar" ? "لاحقاً" : locale === "en" ? "Later" : "Nanti Saja"}
                </button>
              )}
              <button
                type="button"
                onClick={handleUpdate}
                className="btn-gold"
                style={{
                  flex: "2",
                  minHeight: "44px",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <i className="fa-solid fa-cloud-arrow-down" aria-hidden="true" />
                <span>
                  {locale === "ar"
                    ? `تحديث الآن (v${versionData.latestVersionName})`
                    : locale === "en"
                    ? `Update Now (v${versionData.latestVersionName})`
                    : `Perbarui Sekarang (v${versionData.latestVersionName})`}
                </span>
              </button>
            </div>
            {isMandatoryUpdate && (
              <div style={{ marginTop: "0.75rem", textAlign: "center" }}>
                <Link
                  href="/download"
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-secondary, #a1a8b5)",
                    textDecoration: "underline",
                  }}
                >
                  {locale === "ar"
                    ? "أو افتح صفحة التنزيل اليدوي (/download)"
                    : locale === "en"
                    ? "Or open manual download page (/download)"
                    : "Atau unduh manual lewat halaman (/download)"}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
