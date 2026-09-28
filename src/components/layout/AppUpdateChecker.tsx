"use client";

import { useEffect, useState } from "react";
import { isAndroidNativeApp } from "@/lib/notificationHelper";

interface AppVersionData {
  latestVersionCode: number;
  latestVersionName: string;
  releaseDate: string;
  apkUrl: string;
  title: string;
  releaseNotes: string[];
  forceUpdate?: boolean;
}

export default function AppUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [versionData, setVersionData] = useState<AppVersionData | null>(null);
  const [currentVersion, setCurrentVersion] = useState({ code: 1, name: "1.0.0" });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkUpdate = async () => {
      try {
        const isApk = isAndroidNativeApp();
        // Hanya tampilkan pop-up pembaruan APK jika sedang berjalan di dalam aplikasi APK
        if (!isApk) return;

        let installedCode = 1;
        let installedName = "1.0.0";

        if ((window as any).ExpedientNativeBridge?.getAppVersionCode) {
          try {
            installedCode = Number((window as any).ExpedientNativeBridge.getAppVersionCode()) || 1;
            installedName = String((window as any).ExpedientNativeBridge.getAppVersionName?.() || "1.0.0");
          } catch (e) {
            console.warn("Could not read app version code:", e);
          }
        }

        setCurrentVersion({ code: installedCode, name: installedName });

        const res = await fetch("/api/app-version", { cache: "no-store" });
        if (!res.ok) return;
        const data: AppVersionData = await res.json();

        // Check if there is a newer versionCode
        if (data.latestVersionCode > installedCode) {
          const dismissedVersion = sessionStorage.getItem("dismissed_update_version");
          if (!data.forceUpdate && dismissedVersion === String(data.latestVersionCode)) {
            return;
          }
          setVersionData(data);
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.warn("Update check error:", err);
      }
    };

    // Run check after initial load
    const timer = setTimeout(checkUpdate, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    if (!versionData) return;
    setIsUpdating(true);

    const isApk = isAndroidNativeApp();
    if (isApk && (window as any).ExpedientNativeBridge?.installApk) {
      try {
        (window as any).ExpedientNativeBridge.installApk(versionData.apkUrl);
        return;
      } catch (e) {
        console.error("Native installApk error:", e);
      }
    }

    // Jika APK versi lama belum memiliki bridge installApk, buka Pusat Unduhan langsung
    window.location.href = "/download";
  };

  const handleDismiss = () => {
    if (!versionData) return;
    sessionStorage.setItem("dismissed_update_version", String(versionData.latestVersionCode));
    setIsDismissed(true);
    setUpdateAvailable(false);
  };

  if (!updateAvailable || isDismissed || !versionData) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(3, 7, 18, 0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "linear-gradient(145deg, #0c1527 0%, #070e1c 100%)",
          border: "1px solid rgba(212, 175, 55, 0.4)",
          borderRadius: "24px",
          padding: "1.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.15)",
          color: "#e2e8f0",
          fontFamily: "var(--font-inter, sans-serif)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Golden top ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "100px",
            background: "radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, transparent 70%)",
            filter: "blur(20px)",
            pointerEvents: "none",
          }}
        />

        {/* Header Icon & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.05) 100%)",
              border: "1px solid rgba(212, 175, 55, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f3ba2f",
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-cloud-arrow-down" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
                Pembaruan Tersedia
              </h3>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "rgba(212, 175, 55, 0.2)",
                  color: "#f3ba2f",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                }}
              >
                v{versionData.latestVersionName}
              </span>
            </div>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.82rem", color: "#94a3b8" }}>
              Versi Anda saat ini: <strong style={{ color: "#cbd5e1" }}>v{currentVersion.name}</strong>
            </p>
          </div>
        </div>

        {/* Release Notes */}
        <div
          style={{
            background: "rgba(15, 23, 42, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            borderRadius: "16px",
            padding: "1rem 1.1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#f3ba2f", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "6px" }}>
            <i className="fa-solid fa-sparkles" style={{ fontSize: "0.8rem" }} />
            Catatan Pembaruan Rilis:
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#cbd5e1", lineHeight: 1.6 }}>
            {versionData.releaseNotes.map((note, idx) => (
              <li key={idx} style={{ marginBottom: idx === versionData.releaseNotes.length - 1 ? 0 : "4px" }}>
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
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "14px",
              textAlign: "center",
            }}
          >
            <i className="fa-solid fa-spinner fa-spin" style={{ color: "#f3ba2f", fontSize: "1.35rem", marginBottom: "0.5rem" }} />
            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>
              Menyiapkan Pembaruan APK...
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "4px" }}>
              Mengalihkan ke unduhan APK terbaru... Jika tidak terbuka otomatis, ketuk tombol di bawah:
            </div>
            <a
              href="/download"
              onClick={() => setUpdateAvailable(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "12px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #d4af37 0%, #f3ba2f 100%)",
                color: "#060b14",
                fontSize: "0.82rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <i className="fa-solid fa-download" />
              <span>Buka Pusat Unduhan APK</span>
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            {!versionData.forceUpdate && (
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  flex: "1",
                  padding: "0.8rem 1rem",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#94a3b8",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Nanti Saja
              </button>
            )}
            <button
              type="button"
              onClick={handleUpdate}
              style={{
                flex: "2",
                padding: "0.8rem 1.25rem",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #d4af37 0%, #f3ba2f 100%)",
                border: "none",
                color: "#060b14",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(212, 175, 55, 0.35)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "transform 0.15s ease",
              }}
            >
              <i className="fa-solid fa-bolt" />
              <span>Perbarui Sekarang</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
