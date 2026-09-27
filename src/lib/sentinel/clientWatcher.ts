"use client";

import type { AlertCategory, TelemetryEvent } from "./telemetryAlert";

// Client-side cache to prevent sending duplicate requests from the same user session
const reportedSignatures = new Map<string, number>();
const CLIENT_DEDUP_MS = 5 * 60 * 1000; // 5 minutes

function getClientFingerprint(category: string, message: string, route: string, selector?: string): string {
  return `${category}|${route}|${selector || ""}|${message.slice(0, 80)}`;
}

function getDeviceInfo() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";

  let os = "OS";
  if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  const isMobile =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (window.innerWidth <= 1024 && window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

  const conn = (navigator as any).connection;
  const connectionType = conn ? `${conn.effectiveType || "online"}${conn.saveData ? " (Data Saver)" : ""}` : "online";
  const memory = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB RAM` : undefined;

  return {
    isMobile,
    browser,
    os,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    memory,
    connection: connectionType,
  };
}

function getUserContext() {
  if (typeof window === "undefined") return {};
  try {
    const rawUser = localStorage.getItem("expedient_user_profile");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      return {
        userId: parsed.id,
        name: parsed.nama_lengkap || parsed.nama_panggilan || parsed.nama,
        email: parsed.email || parsed.nisn,
      };
    }
  } catch {}
  return {};
}

/**
 * Mengirimkan laporan telemetry ke backend endpoint /api/telemetry/report
 */
export function sendTelemetryAlert(event: Omit<TelemetryEvent, "deviceInfo" | "userContext" | "timestamp">) {
  if (typeof window === "undefined") return;

  const currentRoute = window.location.pathname || "/";
  const sig = getClientFingerprint(event.category, event.message, currentRoute, event.selector);
  const now = Date.now();

  const lastSent = reportedSignatures.get(sig);
  if (lastSent && now - lastSent < CLIENT_DEDUP_MS) {
    return; // Skip duplicate within dedup window
  }
  reportedSignatures.set(sig, now);

  const payload: TelemetryEvent = {
    ...event,
    route: event.route || currentRoute,
    deviceInfo: getDeviceInfo(),
    userContext: getUserContext(),
    timestamp: now,
  };

  const jsonStr = JSON.stringify(payload);

  // Use sendBeacon if supported for high reliability during unload/crash
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([jsonStr], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/telemetry/report", blob);
      if (sent) return;
    } catch {}
  }

  // Fallback to fetch with keepalive
  fetch("/api/telemetry/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: jsonStr,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Inisialisasi Aegis Sentinel Watchdog di browser:
 * - Uncaught JS Exceptions
 * - Unhandled Promise Rejections
 * - Dead Click / Rage Clicking (tombol tidak merespon)
 * - UI Freeze / Main Thread Stalls (> 3.5s)
 */
let isInitialized = false;

export function initAegisSentinelWatcher() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // 1. Uncaught JS Runtime Errors
  window.addEventListener("error", (event: ErrorEvent) => {
    // Ignore harmless noise & browser extensions
    const filename = String(event.filename || "");
    const msg = String(event.message || "");

    if (
      filename.includes("extension://") ||
      filename.includes("chrome-extension") ||
      msg.includes("ResizeObserver loop") ||
      msg.includes("Script error.") ||
      msg.includes("Loading chunk") || // ChunkLoadError already handled by auto-reload
      msg.includes("Failed to load chunk")
    ) {
      return;
    }

    sendTelemetryAlert({
      category: "js_crash",
      message: msg || "Uncaught JavaScript Exception",
      detail: `File: ${filename}:${event.lineno}:${event.colno}`,
      stack: event.error?.stack || `at ${filename}:${event.lineno}`,
    });
  });

  // 2. Unhandled Promise Rejections (e.g. Failed Supabase fetch, broken API)
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const msg = String(reason?.message || reason || "Unhandled Promise Rejection");

    // Skip benign aborts & chunk load reloads
    if (
      msg.includes("AbortError") ||
      msg.includes("Failed to load chunk") ||
      msg.includes("ChunkLoadError") ||
      msg.includes("ResizeObserver loop")
    ) {
      return;
    }

    sendTelemetryAlert({
      category: "promise_rejection",
      message: msg,
      stack: reason?.stack || String(reason),
    });
  });

  // 3. Dead Click / Rage Click Detector ("Tombol Ga Bisa Dipencet")
  let lastClickTime = 0;
  let lastClickTarget: HTMLElement | null = null;
  let clickCountOnTarget = 0;

  document.addEventListener(
    "click",
    (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest(
        "button, a, [role='button'], input[type='submit'], .btn-primary, .btn-action"
      ) as HTMLElement | null;

      if (!target) return;

      const now = Date.now();
      const isSameElement = lastClickTarget === target;

      if (isSameElement && now - lastClickTime < 1500) {
        clickCountOnTarget += 1;
      } else {
        clickCountOnTarget = 1;
        lastClickTarget = target;
      }
      lastClickTime = now;

      // If user clicks 3 times consecutively on the same interactive element in < 1.5s
      if (clickCountOnTarget === 3) {
        const initialUrl = window.location.href;
        const elemTag = target.tagName.toLowerCase();
        const elemId = target.id ? `#${target.id}` : "";
        const elemClass = target.className ? `.${target.className.split(" ").slice(0, 3).join(".")}` : "";
        const elemText = (target.textContent || "").trim().slice(0, 40);
        const selectorStr = `<${elemTag}${elemId}${elemClass}> "${elemText}"`;

        // Check after 600ms if navigation or state change occurred
        setTimeout(() => {
          if (window.location.href === initialUrl && document.contains(target)) {
            // Element is still there, URL didn't change, user had to rage-click
            sendTelemetryAlert({
              category: "dead_click",
              message: `Tombol tidak merespon: Pengguna mengklik elemen ${clickCountOnTarget}x berturut-turut tanpa respon atau navigasi.`,
              selector: selectorStr,
              detail: `Elemen: ${selectorStr} pada halaman ${window.location.pathname}`,
            });
          }
        }, 700);
      }
    },
    { capture: true, passive: true }
  );

  // 4. UI Freeze & Lag Detector (Main Thread Stalls > 3500ms)
  let lastFrameTime = performance.now();
  let lagAlertCooldown = 0;

  function checkFrameStall() {
    const now = performance.now();
    const delta = now - lastFrameTime;

    // Only detect when tab is actively visible (not minimized or background tab)
    if (document.visibilityState === "visible") {
      if (delta > 3500 && now - lagAlertCooldown > 5 * 60 * 1000) {
        lagAlertCooldown = now;
        sendTelemetryAlert({
          category: "ui_lag",
          message: `Layar terdeteksi freeze/stutter berat selama ${(delta / 1000).toFixed(1)} detik (main thread terblokir).`,
          detail: `Frame delta: ${Math.round(delta)}ms di halaman ${window.location.pathname}`,
        });
      }
    }

    lastFrameTime = now;
    requestAnimationFrame(checkFrameStall);
  }

  requestAnimationFrame(checkFrameStall);
  console.log("[AEGIS-SENTINEL] 24/7 Automated Error Watchdog Aktif.");
}
