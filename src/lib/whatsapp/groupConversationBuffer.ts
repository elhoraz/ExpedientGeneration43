import { createAdminClient } from "@/lib/supabase/admin";

export interface GroupChatMessageItem {
  id?: string;
  senderPhone: string;
  senderName: string;
  messageText: string;
  quotedText?: string;
  quotedSender?: string;
  timestamp: number;
  isFromBot?: boolean;
}

const MAX_BUFFER_SIZE = 25;
const IN_MEMORY_CACHE = new Map<string, { at: number; list: GroupChatMessageItem[] }>();

/**
 * Normalisasi Group ID agar aman dijadikan content_key Supabase
 */
function getBufferKey(groupId: string): string {
  const cleanId = String(groupId || "default")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
  return `group_chat_buffer_${cleanId}`;
}

/**
 * Mencatat pesan masuk di grup WhatsApp ke dalam rolling buffer percakapan (maksimal 25 pesan terbaru).
 * Berfungsi untuk seluruh pesan grup (obrolan santai maupun reply) agar bot memiliki konteks diskusi.
 */
export async function recordGroupChatMessage(
  groupId: string,
  item: Omit<GroupChatMessageItem, "id"> & { id?: string }
): Promise<void> {
  if (!groupId || !item.messageText) return;

  const cleanText = item.messageText.trim();
  // Abaikan pesan jika hanya whitespace atau karakter sistem kosong
  if (!cleanText) return;

  const contentKey = getBufferKey(groupId);
  const now = Date.now();

  const msgEntry: GroupChatMessageItem = {
    id: item.id || `msg_${now}_${Math.random().toString(36).substring(2, 7)}`,
    senderPhone: String(item.senderPhone || "").replace(/\D/g, ""),
    senderName: String(item.senderName || "Sahabat").trim(),
    messageText: cleanText.slice(0, 500),
    quotedText: item.quotedText ? item.quotedText.trim().slice(0, 300) : undefined,
    quotedSender: item.quotedSender ? item.quotedSender.trim().slice(0, 60) : undefined,
    timestamp: item.timestamp || now,
    isFromBot: Boolean(item.isFromBot),
  };

  // 1. Perbarui In-Memory Cache lebih dulu untuk respons ultra-cepat
  const cached = IN_MEMORY_CACHE.get(contentKey);
  let updatedList: GroupChatMessageItem[] = [];

  if (cached && Array.isArray(cached.list)) {
    // Hindari duplikasi pesan kembar dalam selang 2 detik
    const isDuplicate = cached.list.some(
      (m) =>
        m.senderPhone === msgEntry.senderPhone &&
        m.messageText === msgEntry.messageText &&
        Math.abs(m.timestamp - msgEntry.timestamp) < 2000
    );
    if (!isDuplicate) {
      updatedList = [...cached.list, msgEntry].slice(-MAX_BUFFER_SIZE);
    } else {
      updatedList = cached.list;
    }
  } else {
    updatedList = [msgEntry];
  }

  IN_MEMORY_CACHE.set(contentKey, { at: now, list: updatedList });

  // 2. Simpan secara asinkron ke database Supabase (site_content)
  try {
    const supabase = createAdminClient();
    await supabase.from("site_content").upsert(
      {
        content_key: contentKey,
        content_value: JSON.stringify(updatedList),
        content_type: "json",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "content_key" }
    );
  } catch (err: any) {
    console.warn("[GROUP-BUFFER-PERSIST-WARN]:", err.message);
  }
}

/**
 * Mengambil riwayat pesan obrolan terbaru di grup dari cache / Supabase
 * Diurutkan secara kronologis (pesan lama ke pesan terbaru)
 */
export async function getRecentGroupChatHistory(
  groupId: string,
  limit = 20
): Promise<GroupChatMessageItem[]> {
  if (!groupId) return [];

  const contentKey = getBufferKey(groupId);
  const now = Date.now();

  // 1. Cek memory cache (berlaku 5 menit)
  const cached = IN_MEMORY_CACHE.get(contentKey);
  if (cached && now - cached.at < 5 * 60 * 1000 && Array.isArray(cached.list) && cached.list.length > 0) {
    return cached.list.slice(-limit);
  }

  // 2. Baca dari Supabase jika memory cache kosong/expired
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", contentKey)
      .maybeSingle();

    if (!error && data?.content_value) {
      const parsed = JSON.parse(data.content_value);
      if (Array.isArray(parsed)) {
        IN_MEMORY_CACHE.set(contentKey, { at: now, list: parsed });
        return parsed.slice(-limit);
      }
    }
  } catch (err: any) {
    console.warn("[GROUP-BUFFER-FETCH-WARN]:", err.message);
  }

  return cached?.list ? cached.list.slice(-limit) : [];
}

/**
 * Format riwayat percakapan grup ke dalam string kronologis yang mudah dipahami oleh LLM / Gemini
 */
export function formatChatHistoryForSummary(messages: GroupChatMessageItem[]): string {
  if (!messages || messages.length === 0) return "";

  return messages
    .map((m, idx) => {
      const timeStr = new Date(m.timestamp).toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      });

      const senderLabel = m.isFromBot ? "🤖 Bot Expedient" : m.senderName || "Sahabat";
      let replyContext = "";
      if (m.quotedText) {
        const qSender = m.quotedSender ? ` ke ${m.quotedSender}` : "";
        replyContext = ` [Membalas${qSender}: "${m.quotedText.slice(0, 80)}"]`;
      }

      return `[${idx + 1}] (${timeStr} WIB) ${senderLabel}${replyContext}: "${m.messageText}"`;
    })
    .join("\n");
}

/**
 * Deteksi apakah pengguna sedang meminta rangkuman, topik, atau kesimpulan dari obrolan grup
 */
export function isConversationSummaryIntent(messageText: string): boolean {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Pertanyaan langsung tentang apa yang diobrolkan / dibahas
  const topicQueries = [
    "apa yang diomongin",
    "apa yg diomongin",
    "apa yg di bahas",
    "apa yang dibahas",
    "apa yg dibahas",
    "ngomongin apa",
    "lagi ngomongin apa",
    "lagi bahas apa",
    "bahas apa",
    "bahas apa sih",
    "tadi ngomongin apa",
    "tadi bahas apa",
    "pada ngomongin apa",
    "ada bahasan apa",
    "topik apa",
    "topiknya apa",
  ];

  if (topicQueries.some((q) => lower.includes(q))) {
    return true;
  }

  // 2. Pertanyaan kesimpulan / intinya
  const conclusionQueries = [
    "kesimpulannya apa",
    "apa kesimpulannya",
    "kesimpulan obrolan",
    "kesimpulan diskusi",
    "kesimpulan dari",
    "intinya apa",
    "intinya gimana",
    "poin utamanya",
    "poinnya apa",
    "dapat kesimpulan apa",
    "hasil diskusinya apa",
    "hasil obrolannya apa",
  ];

  if (conclusionQueries.some((q) => lower.includes(q))) {
    return true;
  }

  // 3. Perintah merangkum / me-rekap / summary
  const summaryCommands = [
    "rangkum",
    "rangkumkan",
    "rangkuman",
    "simpulkan",
    "simpulkan obrolan",
    "rekap obrolan",
    "rekap diskusi",
    "rekap dong",
    "recap dong",
    "summary",
    "!rangkum",
    "!kesimpulan",
    "!rekap",
    "/summary",
    "/rekap",
  ];

  if (summaryCommands.some((c) => lower.includes(c))) {
    return true;
  }

  return false;
}
