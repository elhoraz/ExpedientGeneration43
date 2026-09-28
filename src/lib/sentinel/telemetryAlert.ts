import { sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";

export type AlertCategory =
  | "dead_click"
  | "js_crash"
  | "promise_rejection"
  | "react_error_boundary"
  | "ui_lag"
  | "fonnte_disconnect"
  | "api_failure";

export interface TelemetryEvent {
  category: AlertCategory;
  message: string;
  detail?: string;
  route?: string;
  selector?: string;
  stack?: string;
  deviceInfo?: {
    isMobile?: boolean;
    browser?: string;
    os?: string;
    viewport?: string;
    memory?: string;
    connection?: string;
  };
  userContext?: {
    userId?: string;
    name?: string;
    email?: string;
  };
  timestamp?: number;
}

// In-memory deduplication and rate-limiting cache (resets on process restart)
interface ThrottledItem {
  firstSeen: number;
  lastSent: number;
  count: number;
}

const errorThrottleCache = new Map<string, ThrottledItem>();
let lastGlobalWaDispatch = 0;
const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes deduplication
const GLOBAL_THROTTLE_MS = 25 * 1000;   // 25 seconds between WhatsApp messages

let lastIncident: TelemetryEvent | null = null;
const recentIncidents: TelemetryEvent[] = [];

export function getLastIncident(): TelemetryEvent | null {
  return lastIncident;
}

export function getRecentIncidents(): TelemetryEvent[] {
  return recentIncidents;
}

export function clearThrottleCache(): void {
  errorThrottleCache.clear();
  lastGlobalWaDispatch = 0;
}

function getCategoryBadge(category: AlertCategory): string {
  switch (category) {
    case "dead_click":
      return "👆 Tombol Tidak Merespon / Dead Click";
    case "js_crash":
      return "💥 Crash / Uncaught JavaScript Error";
    case "promise_rejection":
      return "⚡ Unhandled Promise Rejection";
    case "react_error_boundary":
      return "🛡️ White Screen / React Component Crash";
    case "ui_lag":
      return "🐢 Severe UI Freeze / Main Thread Stutter";
    case "fonnte_disconnect":
      return "🔌 Gateway WhatsApp Fonnte Terputus";
    case "api_failure":
      return "🚨 Server API 500 / Database Failure";
    default:
      return "⚠️ System Problem";
  }
}

function getFingerprint(event: TelemetryEvent): string {
  const normMsg = (event.message || "").slice(0, 100).replace(/\d+/g, "#");
  const normRoute = event.route || "/";
  const normElem = event.selector || "";
  return `${event.category}:${normRoute}:${normElem}:${normMsg}`;
}

export async function dispatchSystemAlert(event: TelemetryEvent): Promise<{
  success: boolean;
  throttled?: boolean;
  reason?: string;
  provider?: string;
}> {
  const now = Date.now();
  const fingerprint = getFingerprint(event);
  const existing = errorThrottleCache.get(fingerprint);

  // 1. Deduplication check (per-error)
  if (existing) {
    existing.count += 1;
    if (now - existing.lastSent < DEDUP_WINDOW_MS) {
      return {
        success: true,
        throttled: true,
        reason: `Deduplicated: error ${fingerprint} already reported. Count: ${existing.count}`,
      };
    }
  }

  // 2. Global throttling check (prevent flooding WhatsApp)
  if (now - lastGlobalWaDispatch < GLOBAL_THROTTLE_MS) {
    return {
      success: true,
      throttled: true,
      reason: "Global WA throttle active. Postponed to avoid WhatsApp rate limit.",
    };
  }

  const occurrenceCount = existing ? existing.count : 1;
  errorThrottleCache.set(fingerprint, {
    firstSeen: existing ? existing.firstSeen : now,
    lastSent: now,
    count: 1, // reset counter for next cycle
  });
  lastGlobalWaDispatch = now;

  // Build high-clarity notification
  const adminWa = (process.env.ADMIN_WA_PHONE || "6282142877426").trim();
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(now));

  const categoryBadge = getCategoryBadge(event.category);
  const route = event.route || "/";
  const deviceType = event.deviceInfo?.isMobile ? "Mobile / Smartphone" : "Desktop / PC";
  const browserInfo = event.deviceInfo?.browser ? `${event.deviceInfo.browser} on ${event.deviceInfo.os || "Unknown OS"}` : "Web Browser";
  const user = event.userContext?.name ? `${event.userContext.name} (${event.userContext.email || "Alumni"})` : "Pengunjung / Anonymous";

  let waMessage = `🚨 *[AEGIS SENTINEL - SYSTEM ALERT]* 🚨\n`;
  waMessage += `_Expedient Generation 43 Web App_\n\n`;
  waMessage += `🔴 *Kategori:* ${categoryBadge}\n`;
  waMessage += `📍 *Halaman:* ${route}\n`;
  waMessage += `⏱ *Waktu:* ${timeStr} WIB\n`;
  waMessage += `📱 *Perangkat:* ${deviceType} (${browserInfo})\n`;
  waMessage += `👤 *User:* ${user}\n\n`;
  waMessage += `⚠️ *Detail Masalah:*\n_${event.message.trim()}_\n\n`;

  if (event.selector) {
    waMessage += `🎯 *Elemen Terkait:*\n\`${event.selector.slice(0, 150)}\`\n\n`;
  }

  if (event.detail) {
    waMessage += `📋 *Info Tambahan:*\n${event.detail.slice(0, 200)}\n\n`;
  }

  if (event.stack) {
    const cleanStack = event.stack
      .split("\n")
      .slice(0, 4)
      .join("\n")
      .slice(0, 250);
    waMessage += `🔍 *Call Stack:*\n\`\`\`\n${cleanStack}\n\`\`\`\n\n`;
  }

  // Record incident for auto-remediation memory
  lastIncident = { ...event, timestamp: now };
  recentIncidents.unshift(lastIncident);
  if (recentIncidents.length > 20) recentIncidents.pop();

  if (occurrenceCount > 1) {
    waMessage += `🔁 *Frekuensi:* Terjadi ${occurrenceCount}x dalam beberapa menit terakhir.\n\n`;
  }

  waMessage += `----------------------------------------\n`;
  waMessage += `⚡ *AKSI CEPAT (Balas Chat Ini):*\n`;
  waMessage += `• Ketik *PERBAIKI* untuk pemulihan server & refresh cache instan\n`;
  waMessage += `• Ketik *PERBAIKI KODE* untuk perbaikan kode otomatis oleh Gemini 3.8 Flash & push ke GitHub\n`;
  waMessage += `• Ketik *!status* untuk cek kondisi server saat ini\n`;
  waMessage += `----------------------------------------\n`;
  waMessage += `_Sistem Pemantauan Otomatis 24 Jam Aegis Sentinel_`;

  // 1. PRIMARY DEVOPS & INCIDENT CHANNEL: Telegram (Official Bot API with Interactive Inline Buttons)
  const tgToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const tgChatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();

  if (tgToken && tgChatId) {
    let tgHtml = `🚨 <b>[AEGIS SENTINEL - SYSTEM ALERT]</b> 🚨\n`;
    tgHtml += `<i>Expedient Generation 43 Web App</i>\n\n`;
    tgHtml += `🔴 <b>Kategori:</b> ${categoryBadge}\n`;
    tgHtml += `📍 <b>Halaman:</b> <code>${route}</code>\n`;
    tgHtml += `⏱ <b>Waktu:</b> ${timeStr} WIB\n`;
    tgHtml += `📱 <b>Perangkat:</b> ${deviceType} (${browserInfo})\n`;
    tgHtml += `👤 <b>User:</b> ${user}\n\n`;
    tgHtml += `⚠️ <b>Detail Masalah:</b>\n<code>${event.message.trim()}</code>\n\n`;

    if (event.selector) {
      tgHtml += `🎯 <b>Elemen:</b> <code>${event.selector.slice(0, 150)}</code>\n\n`;
    }

    if (event.stack) {
      const cleanStack = event.stack.split("\n").slice(0, 4).join("\n").slice(0, 250);
      tgHtml += `🔍 <b>Call Stack:</b>\n<pre>${cleanStack}</pre>\n\n`;
    }

    if (occurrenceCount > 1) {
      tgHtml += `🔁 <b>Frekuensi:</b> Terjadi ${occurrenceCount}x dalam 10 menit terakhir.\n\n`;
    }

    tgHtml += `<i>Klik tombol di bawah untuk perbaikan instan:</i>`;

    const inlineKeyboard = [
      [
        { text: "🛠️ Perbaiki Cepat (Cache/DB)", callback_data: "fix_op" },
        { text: "🧠 AI Code Fix (Gemini 3.8 Flash)", callback_data: "fix_ai" },
      ],
      [
        { text: "📊 Cek Status Server", callback_data: "check_status" },
        { text: "🌐 Buka Web", url: `https://expedientgeneration.vercel.app${route}` },
      ],
    ];

    const { sendTelegramMessage } = await import("@/lib/telegram");
    const tgRes = await sendTelegramMessage(tgHtml, {
      parse_mode: "HTML",
      inlineKeyboard,
      disable_web_page_preview: true,
    });

    if (tgRes.success) {
      console.log(`[AEGIS-SENTINEL-DISPATCH] Alert ${event.category} terkirim via Telegram Bot ke admin!`);
      return { success: true, provider: "telegram" };
    }
  }

  // 2. SECONDARY CHANNEL: WhatsApp Gateway (Fonnte) with Meta WA fallback
  const waResult = await sendWhatsAppMessageWithDetail(adminWa, waMessage);

  if (waResult.success) {
    console.log(`[AEGIS-SENTINEL-DISPATCH] Alert ${event.category} terkirim via ${waResult.provider} ke ${adminWa}`);
    return { success: true, provider: waResult.provider };
  }

  // Fallback: If WhatsApp delivery failed (e.g. Fonnte device disconnected/token expired),
  // send emergency email so the problem is NEVER missed!
  console.warn(`[AEGIS-SENTINEL-FALLBACK] WhatsApp gagal (${waResult.reason}). Mengirimkan fallback email darurat...`);
  try {
    await sendEmail({
      to: "expedientgeneration43@gmail.com",
      subject: `🚨 [AEGIS SENTINEL ALERT] ${categoryBadge} - ${route}`,
      body: `${categoryBadge} pada ${route}: ${event.message}\nDetail: ${event.detail || "-"}\nDevice: ${deviceType} (${browserInfo})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060b14; color: #f1f5f9; padding: 30px; border-radius: 16px; border: 1px solid #d4af37;">
          <h2 style="color: #ef4444; margin-top: 0;">🚨 [AEGIS SENTINEL - SYSTEM ALERT]</h2>
          <p style="color: #ffd700; font-weight: bold;">Perhatian: Pengiriman WhatsApp otomatis gagal (${waResult.reason}). Email darurat ini dikirimkan sebagai fallback otomatis.</p>
          <hr style="border-color: rgba(212, 175, 55, 0.3); margin: 20px 0;" />
          <p><strong>Kategori:</strong> ${categoryBadge}</p>
          <p><strong>Halaman:</strong> ${route}</p>
          <p><strong>Waktu:</strong> ${timeStr} WIB</p>
          <p><strong>Perangkat:</strong> ${deviceType} (${browserInfo})</p>
          <p><strong>Pengguna:</strong> ${user}</p>
          <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 14px; margin: 20px 0;">
            <strong style="color: #ef4444;">Detail Masalah:</strong><br />
            <code>${event.message}</code>
          </div>
          ${event.selector ? `<p><strong>Elemen:</strong> <code>${event.selector}</code></p>` : ""}
          ${event.stack ? `<pre style="background: rgba(0,0,0,0.5); padding: 12px; border-radius: 8px; overflow-x: auto;">${event.stack}</pre>` : ""}
          <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 30px;">Aegis Sentinel Telemetry System 24/7</p>
        </div>
      `,
    });
    return { success: true, provider: "email-fallback", reason: waResult.reason };
  } catch (emailErr: any) {
    console.error("[AEGIS-SENTINEL-CRITICAL] Seluruh jalur notifikasi (WA & Email) gagal:", emailErr);
    return { success: false, reason: `WA: ${waResult.reason} | Email: ${emailErr.message}` };
  }
}

/**
 * Health check status perangkat Fonnte.
 * Jika status bukan 'connect' (misal: 'disconnect' atau 'pairing'),
 * otomatis kirimkan alert darurat ke WhatsApp/Email admin.
 */
let lastFonnteDisconnectAlert = 0;
export async function checkFonnteHealthAndAlert(): Promise<{
  ok: boolean;
  device?: string;
  status: string;
  quota?: string | number;
  reason?: string;
}> {
  const token = (process.env.FONNTE_TOKEN || "").trim();
  if (!token) {
    return { ok: false, status: "no_token", reason: "FONNTE_TOKEN tidak diset di environment" };
  }

  try {
    const res = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: { Authorization: token },
    });
    const data = await res.json().catch(() => ({}));
    const isConnected = Boolean(data.status && data.device_status === "connect");
    const device = data.device || "6289675010185";
    const status = data.device_status || "unknown";

    if (!isConnected) {
      const now = Date.now();
      // Jangan spam jika disconnect berkepanjangan (maks 1x per 30 menit)
      if (now - lastFonnteDisconnectAlert > 30 * 60 * 1000) {
        lastFonnteDisconnectAlert = now;
        await dispatchSystemAlert({
          category: "fonnte_disconnect",
          message: `Device WhatsApp Fonnte (${device}) TERPUTUS! Status terkini: ${status}. Segera login dan scan QR ulang di https://fonnte.com agar fitur notifikasi WA tetap beroperasi 24 jam.`,
          detail: `Reason dari server: ${data.reason || status}. Kuota tersisa: ${data.quota || "N/A"}`,
          route: "/api/admin/broadcast/diagnose",
        });
      }
    }

    return {
      ok: isConnected,
      device,
      status,
      quota: data.quota,
      reason: data.reason,
    };
  } catch (err: any) {
    return { ok: false, status: "network_error", reason: err?.message || "Gagal menghubungi Fonnte API" };
  }
}
