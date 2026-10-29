import { NextResponse } from "next/server";
import {
  sendTelegramMessage,
  answerTelegramCallbackQuery,
} from "@/lib/telegram";
import { executeAutoFix, executeStatusCheck } from "@/lib/sentinel/autoRemediator";
import { executeAutonomousAiFix } from "@/lib/sentinel/aiCodeFixer";
import { handleAdminConversationalMessage } from "@/lib/sentinel/conversationalAgent";
import { timingSafeEqualString } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

let lastWebhookUpgradeAttempt = 0;

async function getExpectedTelegramSecret(): Promise<string> {
  const explicitSecret = (process.env.TELEGRAM_WEBHOOK_SECRET || "").trim();
  if (explicitSecret) return explicitSecret;

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken) return "";

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(botToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("expedient-telegram-webhook-secret-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function autoUpgradeTelegramWebhookSecret(expectedSecret: string): Promise<void> {
  const now = Date.now();
  if (now - lastWebhookUpgradeAttempt < 10 * 60 * 1000) return;
  lastWebhookUpgradeAttempt = now;

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken || !expectedSecret) return;

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://expedientgeneration.vercel.app").replace(/\/+$/, "");
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `${siteUrl}/api/telegram/webhook`,
        secret_token: expectedSecret,
      }),
    });
  } catch (err) {
    console.warn("[TELEGRAM-WEBHOOK-UPGRADE-WARN]:", err);
  }
}

/**
 * Webhook Telegram Bot API Resmi untuk Aegis Sentinel DevOps & Autonomous AI Engineer
 */
export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rl = rateLimit(`tg-webhook:${clientIp}`, 30, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const adminChatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
    const expectedSecret = await getExpectedTelegramSecret();

    if (!adminChatId || !expectedSecret) {
      console.error("[TELEGRAM-WEBHOOK] TELEGRAM_ADMIN_CHAT_ID or TELEGRAM_BOT_TOKEN is not configured.");
      return NextResponse.json({ ok: false, error: "Webhook not configured" }, { status: 503 });
    }

    const providedSecret = (request.headers.get("x-telegram-bot-api-secret-token") || "").trim();
    if (!providedSecret || !timingSafeEqualString(providedSecret, expectedSecret)) {
      if (!providedSecret) {
        await autoUpgradeTelegramWebhookSecret(expectedSecret);
      }
      console.warn(`[TELEGRAM-WEBHOOK-UNAUTHORIZED] Invalid or missing secret token from IP ${clientIp}`);
      return NextResponse.json({ ok: false, error: "Unauthorized webhook signature" }, { status: 401 });
    }

    const body = await request.json();

    // 1. Menangani Klik Tombol Interaktif (Inline Keyboard Callback Query)
    if (body.callback_query) {
      const cb = body.callback_query;
      const senderId = String(cb.from?.id || "");
      const actionData = String(cb.data || "");

      // Verifikasi keamanan: Hanya Admin terdaftar
      if (senderId !== adminChatId) {
        await answerTelegramCallbackQuery(cb.id, "Akses ditolak: Anda bukan admin.", true);
        return NextResponse.json({ ok: true });
      }

      // A. Tombol: Perbaiki Operasional (Cache, DB, Queue)
      if (actionData === "fix_op") {
        await answerTelegramCallbackQuery(cb.id, "🛠️ Menjalankan pemulihan operasional...");
        const result = await executeAutoFix(senderId, "PERBAIKI", "telegram");

        let replyHtml = `🛠️ <b>[AEGIS SENTINEL - AUTO-REPAIR COMPLETED]</b>\n\n`;
        replyHtml += `Langkah yang telah dijalankan:\n`;
        if (result.details?.actionsTaken) {
          result.details.actionsTaken.forEach((act: string, idx: number) => {
            replyHtml += `${idx + 1}. ${act.replace(/\*/g, "")}\n`;
          });
        } else {
          replyHtml += `• Cache halaman telah dibersihkan.\n• Database & gateway telah disegarkan.\n`;
        }

        await sendTelegramMessage(replyHtml, { parse_mode: "HTML" });
        return NextResponse.json({ ok: true });
      }

      // B. Tombol: AI Code Fix via Gemini 3.8 Flash
      if (actionData === "fix_ai") {
        await answerTelegramCallbackQuery(cb.id, "🧠 Gemini 3.8 Flash sedang menganalisis kode...");
        await sendTelegramMessage(
          `🧠 <b>[GEMINI 3.8 FLASH HIGH]</b>\n\nSedang membaca file terkait di GitHub, menganalisis root cause, dan merevisi kode... Mohon tunggu ~10-15 detik.`,
          { parse_mode: "HTML" }
        );

        const aiResult = await executeAutonomousAiFix(senderId, "Perbaiki bug yang dilaporkan pada insiden terakhir", "telegram");
        await sendTelegramMessage(aiResult.message.replace(/\*/g, "<b>").replace(/\*/g, "</b>"), {
          parse_mode: "HTML",
        });
        return NextResponse.json({ ok: true });
      }

      // C. Tombol: Cek Status Server
      if (actionData === "check_status") {
        await answerTelegramCallbackQuery(cb.id, "📊 Memeriksa kondisi server live...");
        const statusRes = await executeStatusCheck(senderId, "telegram");
        await sendTelegramMessage(statusRes.message.replace(/\*/g, "<b>").replace(/\*/g, "</b>"), {
          parse_mode: "HTML",
        });
        return NextResponse.json({ ok: true });
      }

      await answerTelegramCallbackQuery(cb.id, "Perintah diproses.");
      return NextResponse.json({ ok: true });
    }

    // 2. Menangani Pesan Teks Masuk dari Admin di Telegram
    if (body.message) {
      const msg = body.message;
      const senderId = String(msg.from?.id || msg.chat?.id || "");
      const text = String(msg.text || "").trim();

      if (senderId !== adminChatId) {
        console.warn(`[TELEGRAM-UNAUTHORIZED] Pesan dari ID tidak dikenal: ${senderId}`);
        return NextResponse.json({ ok: true });
      }

      if (!text) {
        return NextResponse.json({ ok: true });
      }

      // Command: /start atau /help
      if (text === "/start" || text === "/help" || text.toLowerCase() === "menu") {
        const welcomeHtml =
          `🤖 <b>[AEGIS SENTINEL DEVOPS & AI ENGINEER]</b>\n\n` +
          `Halo Admin! Bot Telegram ini khusus memantau kesehatan server 24 jam, melakukan perbaikan kode, dan menambahkan fitur baru di website <b>Expedient Generation 43</b>.\n\n` +
          `<b>Perintah Cepat:</b>\n` +
          `• <code>/status</code> : Cek kesehatan server, Supabase, dan deployment\n` +
          `• <code>/fix</code> : Pemulihan server cepat (revalidate cache & reset error)\n` +
          `• <code>/aifix</code> : Perbaikan bug kode otomatis oleh Gemini 3.8 Flash\n\n` +
          `💬 <b>Atau ngobrol bebas dalam bahasa santai:</b>\n` +
          `<i>"Tolong tambahin tombol bagikan ke WA di galeri"</i>\n` +
          `<i>"Ubah warna header beranda jadi emas"</i>\n` +
          `<i>"Berapa alumni yang sudah terdaftar di database?"</i>`;

        await sendTelegramMessage(welcomeHtml, {
          parse_mode: "HTML",
          inlineKeyboard: [
            [
              { text: "🛠️ Perbaiki Server", callback_data: "fix_op" },
              { text: "📊 Status Server", callback_data: "check_status" },
            ],
            [{ text: "🧠 AI Code Fixer", callback_data: "fix_ai" }],
          ],
        });
        return NextResponse.json({ ok: true });
      }

      // Command cepat /status
      if (text === "/status") {
        const statusRes = await executeStatusCheck(senderId, "telegram");
        await sendTelegramMessage(statusRes.message.replace(/\*/g, "<b>").replace(/\*/g, "</b>"), {
          parse_mode: "HTML",
        });
        return NextResponse.json({ ok: true });
      }

      // Command cepat /fix
      if (text === "/fix") {
        const result = await executeAutoFix(senderId, "PERBAIKI", "telegram");
        let replyHtml = `🛠️ <b>[AEGIS SENTINEL - AUTO-REPAIR COMPLETED]</b>\n\n`;
        if (result.details?.actionsTaken) {
          result.details.actionsTaken.forEach((act: string, idx: number) => {
            replyHtml += `${idx + 1}. ${act.replace(/\*/g, "")}\n`;
          });
        }
        await sendTelegramMessage(replyHtml, { parse_mode: "HTML" });
        return NextResponse.json({ ok: true });
      }

      // Jalankan Otak Conversational AI (Gemini 3.8 Flash High)
      // Balasan dikirim langsung ke Telegram (bukan ke WhatsApp!)
      const convResult = await handleAdminConversationalMessage(senderId, text, "telegram");

      return NextResponse.json({ ok: true, processed: convResult.success });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[TELEGRAM-WEBHOOK-ERROR]:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
