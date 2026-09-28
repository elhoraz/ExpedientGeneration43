import { NextResponse } from "next/server";
import {
  sendTelegramMessage,
  answerTelegramCallbackQuery,
} from "@/lib/telegram";
import { executeAutoFix, executeStatusCheck } from "@/lib/sentinel/autoRemediator";
import { executeAutonomousAiFix } from "@/lib/sentinel/aiCodeFixer";
import { handleAdminConversationalMessage } from "@/lib/sentinel/conversationalAgent";

/**
 * Webhook Telegram Bot API Resmi untuk Aegis Sentinel DevOps & Autonomous AI Engineer
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminChatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "8455610044").trim();
    const adminWaPhone = (process.env.ADMIN_WA_PHONE || "6282142877426").trim();

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
        const result = await executeAutoFix(adminWaPhone, "PERBAIKI");

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

        const aiResult = await executeAutonomousAiFix(adminWaPhone, "Perbaiki bug yang dilaporkan pada insiden terakhir");
        await sendTelegramMessage(aiResult.message.replace(/\*/g, "<b>").replace(/\*/g, "</b>"), {
          parse_mode: "HTML",
        });
        return NextResponse.json({ ok: true });
      }

      // C. Tombol: Cek Status Server
      if (actionData === "check_status") {
        await answerTelegramCallbackQuery(cb.id, "📊 Memeriksa kondisi server live...");
        const statusRes = await executeStatusCheck(adminWaPhone);
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
          `Halo Admin! Bot ini khusus memantau kesehatan server 24 jam, melakukan perbaikan kode, dan menambahkan fitur baru di website <b>Expedient Generation 43</b>.\n\n` +
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

      // Jalankan Otak Conversational AI (Gemini 3.8 Flash High)
      // Yang memahami obrolan santai, perbaikan bug, penambahan fitur, dan query database!
      const convResult = await handleAdminConversationalMessage(adminWaPhone, text);

      return NextResponse.json({ ok: true, processed: convResult.success });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[TELEGRAM-WEBHOOK-ERROR]:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
