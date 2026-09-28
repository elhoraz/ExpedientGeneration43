import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";
import {
  getLastIncident,
  clearThrottleCache,
  checkFonnteHealthAndAlert,
} from "@/lib/sentinel/telemetryAlert";
import { executeAutonomousAiFix } from "@/lib/sentinel/aiCodeFixer";

export interface AutoRemediationResult {
  action: string;
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

/**
 * Normalisasi nomor WhatsApp untuk pencocokan presisi (mengabaikan awalan 0 / 62 / tanda + / spasi)
 */
function isPhoneMatch(senderPhone: string, targetPhone: string): boolean {
  const norm1 = senderPhone.replace(/\D/g, "");
  const norm2 = targetPhone.replace(/\D/g, "");
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;
  // Periksa 9 digit terakhir untuk mencocokkan format 0821... dan 62821...
  const tail1 = norm1.slice(-9);
  const tail2 = norm2.slice(-9);
  return tail1 === tail2;
}

/**
 * Engine Utama Auto-Remediasi & Admin Command Center via WhatsApp
 */
export async function handleAdminAutoRemediation(
  senderPhone: string,
  rawMessage: string
): Promise<AutoRemediationResult> {
  const adminPhoneEnv = (process.env.ADMIN_WA_PHONE || "6282142877426").trim();

  // Validasi keamanan: Pastikan pengirim adalah Admin
  const isAuthorized = isPhoneMatch(senderPhone, adminPhoneEnv);

  if (!isAuthorized) {
    return {
      action: "unauthorized",
      success: false,
      message: "Sender bukan nomor admin yang terdaftar.",
    };
  }

  const cleanCmd = rawMessage.trim().toLowerCase();

  // 1. COMMAND: PERBAIKI KODE (Autonomous AI Code Repair via Gemini 3.8 Flash & GitHub)
  if (
    cleanCmd.includes("kode") ||
    cleanCmd.startsWith("!ai") ||
    cleanCmd.includes("ai-fix") ||
    cleanCmd.includes("aifix") ||
    cleanCmd === "fix code" ||
    cleanCmd.startsWith("fix code")
  ) {
    const aiResult = await executeAutonomousAiFix(adminPhoneEnv, rawMessage);
    return {
      action: "ai_code_fix",
      success: aiResult.success,
      message: aiResult.message,
    };
  }

  // 2. COMMAND: PERBAIKI / FIX (Operasional Server, Cache, Gateway, Queue)
  if (
    cleanCmd.startsWith("!fix") ||
    cleanCmd === "perbaiki" ||
    cleanCmd.startsWith("perbaiki") ||
    cleanCmd === "fix" ||
    cleanCmd === "repair" ||
    cleanCmd === "sembuhkan" ||
    cleanCmd === "bantu" ||
    cleanCmd.includes("perbaiki")
  ) {
    return await executeAutoFix(adminPhoneEnv, rawMessage);
  }

  // 2. COMMAND: STATUS / CEK
  if (
    cleanCmd === "!status" ||
    cleanCmd === "status" ||
    cleanCmd === "cek" ||
    cleanCmd === "cek server" ||
    cleanCmd === "health" ||
    cleanCmd === "!health"
  ) {
    return await executeStatusCheck(adminPhoneEnv);
  }

  // 3. COMMAND: REVALIDATE
  if (cleanCmd.startsWith("!revalidate") || cleanCmd.startsWith("revalidate")) {
    const parts = cleanCmd.split(/\s+/);
    const targetPath = parts[1] || "/";
    try {
      revalidatePath(targetPath);
      revalidatePath("/", "layout");
      const msg = `✅ *[REVALIDATE BERHASIL]*\n\nPath *${targetPath}* & root layout telah di-refresh pada edge server Vercel. Stale cache telah dibersihkan.`;
      await sendWhatsAppMessageWithDetail(adminPhoneEnv, msg);
      return { action: "revalidate", success: true, message: msg };
    } catch (err: any) {
      const msg = `❌ *[REVALIDATE GAGAL]*\nError: ${err.message}`;
      await sendWhatsAppMessageWithDetail(adminPhoneEnv, msg);
      return { action: "revalidate", success: false, message: msg };
    }
  }

  // 4. COMMAND: QUEUE RETRY
  if (cleanCmd === "!queue" || cleanCmd === "queue" || cleanCmd === "!retry") {
    return await executeRetryQueue(adminPhoneEnv);
  }

  // 5. COMMAND: BANTUAN / HELP
  if (
    cleanCmd === "!help" ||
    cleanCmd === "help" ||
    cleanCmd === "bantuan" ||
    cleanCmd === "menu" ||
    cleanCmd === "!bantuan"
  ) {
    const msg =
      `🤖 *[AEGIS SENTINEL COMMAND CENTER]*\n\n` +
      `Halo Admin! Perintah kendali otomatis yang dapat Anda ketik via WA:\n\n` +
      `• *PERBAIKI* : Pemulihan server cepat (revalidate cache, reset error, cek DB & Fonnte)\n` +
      `• *PERBAIKI KODE* / *!ai-fix* : Perbaikan kode otomatis oleh Gemini 3.8 Flash & push ke GitHub/Vercel!\n` +
      `• *STATUS* / *!status* : Cek kesehatan server, database Supabase, dan kuota Fonnte\n` +
      `• *!revalidate /path* : Bersihkan cache halaman spesifik (contoh: \`!revalidate /galeri\`)\n` +
      `• *!queue* : Cek & kirim ulang antrean pesan WhatsApp yang sempat tertunda\n\n` +
      `_Sistem aktif 24 jam memproses instruksi pemulihan secara real-time._`;
    await sendWhatsAppMessageWithDetail(adminPhoneEnv, msg);
    return { action: "help", success: true, message: msg };
  }

  return { action: "not_a_sentinel_command", success: false, message: "Bukan perintah Sentinel." };
}

/**
 * Eksekusi Perbaikan Otomatis Komprehensif
 */
export async function executeAutoFix(adminPhone: string, rawCmd: string): Promise<AutoRemediationResult> {
  const startTime = Date.now();
  const lastIncident = getLastIncident();
  const targetRoute = lastIncident?.route || "/";
  const actionsTaken: string[] = [];

  // 1. Revalidasi Cache ISR Halaman Terkait & Root
  try {
    revalidatePath(targetRoute);
    revalidatePath("/beranda");
    revalidatePath("/galeri");
    revalidatePath("/", "layout");
    actionsTaken.push(`🔄 *Purge & Revalidate Cache:* Halaman \`${targetRoute}\` & root layout dibersihkan.`);
  } catch (err: any) {
    actionsTaken.push(`⚠️ *Revalidate:* Gagal (${err.message}).`);
  }

  // 2. Health check Supabase DB & Query Latency
  let dbLatency = 0;
  let dbOk = false;
  try {
    const dbStart = Date.now();
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);
    dbLatency = Date.now() - dbStart;
    dbOk = !error;
    if (dbOk) {
      actionsTaken.push(`🗄️ *Database Supabase:* Terhubung prima (${dbLatency}ms latency).`);
    } else {
      actionsTaken.push(`⚠️ *Database Supabase:* Terkendala (${error?.message}).`);
    }
  } catch (err: any) {
    actionsTaken.push(`⚠️ *Database Supabase:* Exception (${err.message}).`);
  }

  // 3. Status Gateway WhatsApp (Fonnte)
  let fonnteOk = false;
  let fonnteInfo = "";
  try {
    const fonnteRes = await checkFonnteHealthAndAlert();
    fonnteOk = fonnteRes.ok;
    fonnteInfo = fonnteRes.ok
      ? `Terhubung (Device: ${fonnteRes.device || "Aktif"}, Sisa Kuota: ${fonnteRes.quota ?? "OK"})`
      : `Perhatian: ${fonnteRes.reason || fonnteRes.status}`;
    actionsTaken.push(`🔌 *Gateway Fonnte:* ${fonnteInfo}`);
  } catch (err: any) {
    actionsTaken.push(`⚠️ *Gateway Fonnte:* Exception (${err.message}).`);
  }

  // 4. Retry pesan gagal di whatsapp_queue
  try {
    const adminSupabase = createAdminClient();
    const { data: stuckMsgs } = await adminSupabase
      .from("whatsapp_queue")
      .select("id")
      .eq("status", "failed")
      .limit(10);

    if (stuckMsgs && stuckMsgs.length > 0) {
      await adminSupabase
        .from("whatsapp_queue")
        .update({ status: "pending", error_message: "Auto-retried by Sentinel" })
        .in("id", stuckMsgs.map((m) => m.id));
      actionsTaken.push(`📨 *Antrean WhatsApp:* ${stuckMsgs.length} pesan gagal diatur ulang ke 'pending'.`);
    } else {
      actionsTaken.push(`📨 *Antrean WhatsApp:* Seluruh antrean pesan dalam kondisi normal.`);
    }
  } catch {
    // Non-blocking
  }

  // 5. Reset Telemetry Throttle Cache
  clearThrottleCache();
  actionsTaken.push(`🧹 *Throttle Cache:* Memory cache di-reset untuk observasi baru.`);

  const durationMs = Date.now() - startTime;
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());

  let replyMsg = `🛠️ *[AEGIS SENTINEL - AUTO-REPAIR COMPLETED]* 🛠️\n\n`;
  replyMsg += `⏱️ *Waktu Eksekusi:* ${timeStr} WIB (${durationMs}ms)\n`;

  if (lastIncident) {
    replyMsg += `🎯 *Insiden Terakhir:* ${lastIncident.category} di \`${lastIncident.route}\`\n`;
    replyMsg += `💬 *Error:* _${lastIncident.message.slice(0, 120)}_\n\n`;
  } else {
    replyMsg += `🎯 *Target:* Pemulihan Kesehatan Sistem Global\n\n`;
  }

  replyMsg += `🚀 *Langkah Pemulihan yang Telah Berhasil Dieksekusi:*\n`;
  actionsTaken.forEach((act, idx) => {
    replyMsg += `${idx + 1}. ${act}\n`;
  });

  replyMsg += `\n----------------------------------------\n`;
  replyMsg += `💡 *Ingin AI Memperbaiki Kodenya Langsung?*\n`;
  replyMsg += `Balas: *PERBAIKI KODE* di WhatsApp ini!\n`;
  replyMsg += `Gemini 3.8 Flash akan otomatis menganalisis file, merevisi bug, dan men-deploy perbaikan ke GitHub & Vercel dalam 1 menit!`;

  await sendWhatsAppMessageWithDetail(adminPhone, replyMsg);
  return {
    action: "auto_fix",
    success: true,
    message: replyMsg,
    details: { durationMs, actionsTaken },
  };
}

/**
 * Pemeriksaan Status Real-time
 */
export async function executeStatusCheck(adminPhone: string): Promise<AutoRemediationResult> {
  const lastIncident = getLastIncident();
  const fonnteRes = await checkFonnteHealthAndAlert();

  let dbLatency = 0;
  let dbOk = false;
  try {
    const dbStart = Date.now();
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .limit(1);
    dbLatency = Date.now() - dbStart;
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  const timeStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date());

  let statusMsg = `📊 *[AEGIS SENTINEL - STATUS SISTEM 24 JAM]* 📊\n\n`;
  statusMsg += `⏱️ *Waktu Pengecekan:* ${timeStr} WIB\n\n`;
  statusMsg += `🌐 *Web Deployment:* Online (Vercel Edge Node)\n`;
  statusMsg += `🗄️ *Database Supabase:* ${dbOk ? `✅ Normal (${dbLatency}ms latency)` : `❌ Terkendala`}\n`;
  statusMsg += `🔌 *WhatsApp Fonnte:* ${
    fonnteRes.ok
      ? `✅ Terhubung (Device: ${fonnteRes.device || "Aktif"}, Sisa Kuota: ${fonnteRes.quota ?? "OK"})`
      : `⚠️ ${fonnteRes.status} (${fonnteRes.reason})`
  }\n`;

  if (lastIncident) {
    statusMsg += `\n⚠️ *Insiden Terakhir Tercatat:*\n`;
    statusMsg += `• Kategori: ${lastIncident.category}\n`;
    statusMsg += `• Halaman: ${lastIncident.route}\n`;
    statusMsg += `• Error: ${lastIncident.message.slice(0, 100)}\n`;
  } else {
    statusMsg += `\n✅ *Status Insiden:* Tidak ada masalah aktif yang terdeteksi.\n`;
  }

  statusMsg += `\n_Ketik *PERBAIKI* untuk menjalankan pemulihan otomatis kapan saja._`;

  await sendWhatsAppMessageWithDetail(adminPhone, statusMsg);
  return { action: "status_check", success: true, message: statusMsg };
}

/**
 * Pemrosesan Ulang Antrean WhatsApp
 */
async function executeRetryQueue(adminPhone: string): Promise<AutoRemediationResult> {
  try {
    const adminSupabase = createAdminClient();
    const { data: failedMsgs, count } = await adminSupabase
      .from("whatsapp_queue")
      .select("id", { count: "exact" })
      .eq("status", "failed");

    const totalFailed = count || failedMsgs?.length || 0;

    if (totalFailed > 0 && failedMsgs) {
      await adminSupabase
        .from("whatsapp_queue")
        .update({ status: "pending", error_message: "Manual retry from WA Admin" })
        .in("id", failedMsgs.map((m) => m.id));

      const msg = `✅ *[ANTREAN WA DIPULIHKAN]*\n\nSebanyak *${totalFailed} pesan* yang sempat gagal telah dikembalikan ke status 'pending' untuk segera dikirim ulang oleh sistem background cron.`;
      await sendWhatsAppMessageWithDetail(adminPhone, msg);
      return { action: "retry_queue", success: true, message: msg };
    }

    const msg = `ℹ️ *[ANTREAN WA BERSIH]*\n\nTidak ditemukan pesan dengan status 'failed' pada antrean database. Semua pesan telah terkirim normal.`;
    await sendWhatsAppMessageWithDetail(adminPhone, msg);
    return { action: "retry_queue", success: true, message: msg };
  } catch (err: any) {
    const msg = `❌ *[RETRY QUEUE GAGAL]*\nError: ${err.message}`;
    await sendWhatsAppMessageWithDetail(adminPhone, msg);
    return { action: "retry_queue", success: false, message: msg };
  }
}
