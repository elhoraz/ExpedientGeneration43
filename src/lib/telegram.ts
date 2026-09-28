/**
 * Telegram Bot API Utility for Aegis Sentinel DevOps & Autonomous AI Engineer
 */

export interface TelegramButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface SendTelegramOptions {
  chatId?: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
  inlineKeyboard?: TelegramButton[][];
  disable_web_page_preview?: boolean;
}

/**
 * Mengirim pesan ke Telegram Admin via Official Bot API
 */
export async function sendTelegramMessage(
  text: string,
  options: SendTelegramOptions = {}
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const defaultChatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();
  const chatId = options.chatId || defaultChatId;

  if (!token || !chatId) {
    console.warn("[TELEGRAM-WARN] TELEGRAM_BOT_TOKEN atau TELEGRAM_ADMIN_CHAT_ID belum diset.");
    return { success: false, error: "Credentials missing" };
  }

  try {
    const body: Record<string, any> = {
      chat_id: chatId,
      text: text,
      parse_mode: options.parse_mode || "HTML",
      disable_web_page_preview: options.disable_web_page_preview ?? false,
    };

    if (options.inlineKeyboard && options.inlineKeyboard.length > 0) {
      body.reply_markup = {
        inline_keyboard: options.inlineKeyboard,
      };
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error("[TELEGRAM-SEND-ERROR]:", data);
      return { success: false, error: data.description || "Send failed" };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err: any) {
    console.error("[TELEGRAM-EXCEPTION]:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Merespons tombol interaktif Telegram (Callback Query)
 */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token || !callbackQueryId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Mengedit teks pesan Telegram yang sudah ada (misal setelah tombol ditekan)
 */
export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  options: { parse_mode?: "HTML" | "Markdown"; inlineKeyboard?: TelegramButton[][] } = {}
): Promise<boolean> {
  const token = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return false;

  try {
    const body: Record<string, any> = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: options.parse_mode || "HTML",
    };

    if (options.inlineKeyboard) {
      body.reply_markup = { inline_keyboard: options.inlineKeyboard };
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
