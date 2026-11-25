"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isAndroidNativeApp, isIosNativeApp } from "@/lib/notificationHelper";

interface AppVersionData {
  latestVersionCode: number;
  latestVersionName: string;
  releaseDate: string;
  apkUrl: string;
  ipaUrl?: string;
  title: string;
  releaseNotes: string[];
  forceUpdate?: boolean;
  minSupportedVersionCode?: number;
}

export default function AppUpdateChecker() {
  const pathname = usePathname();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [versionData, setVersionData] = useState<AppVersionData | null>(null);
  const [currentVersion, setCurrentVersion] = useState({ code: 1, name: "1.0.0" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkUpdate = async () => {
      try {
        const isApk =
          isAndroidNativeApp() ||
          Boolean((window as any).ExpedientNativeBridge) ||
          Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
          /wv|Capacitor|Expedient/i.test(navigator.userAgent);

        setIsNativeApp(isApk);

        let installedCode = 1;
        let installedName = "1.0.0";

        if ((window as any).ExpedientNativeBridge?.getAppVersionCode) {
          try {
            installedCode = Number((window as any).ExpedientNativeBridge.getAppVersionCode()) || 1;
            installedName = String((window as any).ExpedientNativeBridge.getAppVersionName?.() || "1.0.0");
          } catch (e) {
            console.warn("Could not read native app version code:", e);
          }
        }

        setCurrentVersion({ code: installedCode, name: installedName });

        const res = await fetch("/api/app-version", { cache: "no-store" });
        if (!res.ok) return;
        const data: AppVersionData = await res.json();

        if (isApk) {
          // Native APK User
          if (data.latestVersionCode > installedCode) {
            const dismissedSession = sessionStorage.getItem(`dismissed_update_session_v${data.latestVersionCode}`);
            if (dismissedSession === "1" && !data.forceUpdate) {
              return;
            }
            setVersionData(data);
            setUpdateAvailable(true);
          }
        } else {
          // Web / PWA Browser User (Imbauan pembaruan APK v1.2.3)
          const dismissedWeb = localStorage.getItem(`dismissed_web_update_v${data.latestVersionCode}`);
          const dismissedSession = sessionStorage.getItem("dismissed_web_update_session");
          if (dismissedWeb === "1" || dismissedSession === "1") {
            return;
          }
          setVersionData(data);
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.warn("Update check error:", err);
      }
    };

    // Run check promptly when user enters the app
    const timer = setTimeout(checkUpdate, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    if (!versionData) return;
    setIsUpdating(true);

    try {
      if (isNativeApp) {
        sessionStorage.setItem(`dismissed_update_session_v${versionData.latestVersionCode}`, "1");
        localStorage.setItem("dismissed_update_version", String(versionData.latestVersionCode));
      } else {
        localStorage.setItem(`dismissed_web_update_v${versionData.latestVersionCode}`, "1");
        sessionStorage.setItem("dismissed_web_update_session", "1");
      }
    } catch {}

    if (isNativeApp && (window as any).ExpedientNativeBridge?.installApk) {
      try {
        (window as any).ExpedientNativeBridge.installApk(versionData.apkUrl);
        return;
      } catch (e) {
        console.error("Native installApk error:", e);
      }
    }

    if (isIosNativeApp() || /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = versionData.ipaUrl || "/download";
      setTimeout(() => {
        setUpdateAvailable(false);
        setIsUpdating(false);
      }, 2500);
      return;
    }

    // Direct download or navigate to download page
    window.location.href = versionData.apkUrl;

    setTimeout(() => {
      setUpdateAvailable(false);
      setIsUpdating(false);
    }, 2500);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setUpdateAvailable(false);
    try {
      if (versionData) {
        if (isNativeApp) {
          sessionStorage.setItem(`dismissed_update_session_v${versionData.latestVersionCode}`, "1");
          localStorage.setItem("dismissed_update_version", String(versionData.latestVersionCode));
        } else {
          localStorage.setItem(`dismissed_web_update_v${versionData.latestVersionCode}`, "1");
          sessionStorage.setItem("dismissed_web_update_session", "1");
        }
      }
    } catch {}
  };

  // Jangan tampilkan jika sudah di halaman download
  if (
    pathname === "/download" ||
    pathname?.startsWith("/download/") ||
    !updateAvailable ||
    isDismissed ||
    !versionData
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(3, 7, 18, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
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
          fontFamily: "var(--font-sans, inherit)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header Icon & Title */}
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
          >
            <i className="fa-solid fa-cloud-arrow-down" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary, #f2efe9)" }}>
                {versionData.forceUpdate
                  ? "Pembaruan Wajib Aplikasi"
                  : isNativeApp
                  ? "Pembaruan Aplikasi Tersedia"
                  : "Aplikasi Resmi Expedient 43"}
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "var(--surface-raised, #171e2c)",
                  color: "var(--gold-main, #d4af37)",
                  border: "1px solid var(--gold-border, rgba(212, 175, 55, 0.35))",
                }}
              >
                v{versionData.latestVersionName} (Build {versionData.latestVersionCode})
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "var(--text-secondary, #a1a8b5)" }}>
              {isNativeApp ? (
                <>
                  Versi terpasang saat ini:{" "}
                  <strong style={{ color: "var(--ruby-gem, #f87171)" }}>
                    v{currentVersion.name} (Build {currentVersion.code})
                  </strong>
                </>
              ) : (
                "Telah dirilis versi APK terbaru dengan fitur Adzan Mode Hening & DND Mutlak."
              )}
            </p>
          </div>
        </div>

        {/* Feature Highlights Banner */}
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
          <i className="fa-solid fa-bell-slash" style={{ color: "var(--gold-main, #d4af37)", marginTop: "3px", flexShrink: 0 }} />
          <span>
            {isNativeApp
              ? "Pembaruan rilis v1.2.3 memperbaiki bug suara adzan ganda serta menjamin suara adzan tidak bersuara saat HP di mode hening atau Jangan Ganggu."
              : "Untuk pengalaman notifikasi offline, alarm adzan akurat, dan direktori alumni yang lebih cepat, pasang aplikasi mobile resmi Expedient 43 di smartphone Anda."}
          </span>
        </div>

        {/* Release Notes */}
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
            <i className="fa-solid fa-list-check" style={{ fontSize: "0.8rem" }} />
            Catatan Pembaruan Rilis v{versionData.latestVersionName}:
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.84rem", color: "var(--text-secondary, #a1a8b5)", lineHeight: 1.6 }}>
            {versionData.releaseNotes.map((note, idx) => (
              <li key={idx} style={{ marginBottom: idx === versionData.releaseNotes.length - 1 ? 0 : "5px" }}>
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress or Actions */}
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
            <i className="fa-solid fa-spinner fa-spin" style={{ color: "var(--gold-main, #d4af37)", fontSize: "1.35rem", marginBottom: "0.5rem" }} />
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #f2efe9)" }}>
              Menyiapkan Pembaruan APK...
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary, #a1a8b5)", marginTop: "4px" }}>
              Mengalihkan ke unduhan APK terbaru... Jika tidak terbuka otomatis, ketuk tombol di bawah:
            </div>
            <a
              href="/download"
              onClick={() => setUpdateAvailable(false)}
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
              <i className="fa-solid fa-download" />
              <span>Buka Pusat Unduhan APK</span>
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
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
              Nanti Saja
            </button>
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
              <i className="fa-solid fa-cloud-arrow-down" />
              <span>
                {isNativeApp
                  ? `Perbarui Sekarang (v${versionData.latestVersionName})`
                  : `Unduh APK (v${versionData.latestVersionName})`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
