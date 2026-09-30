import { createAdminClient } from "@/lib/supabase/admin";
import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";

export interface LearnedMemoryItem {
  id: string;
  topic: string;
  fact: string;
  contributor: string;
  createdAt: string;
}

const MEMORY_CONTENT_KEY = "bot_learned_memories";

/**
 * Mengambil seluruh memori dinamis yang telah dipelajari bot dari database Supabase
 */
export async function getLearnedMemories(): Promise<LearnedMemoryItem[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("content_value")
      .eq("content_key", MEMORY_CONTENT_KEY)
      .maybeSingle();

    if (error || !data?.content_value) {
      return [];
    }

    const parsed = JSON.parse(data.content_value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    console.warn("[BOT-MEMORY-READ-WARN]:", err.message);
    return [];
  }
}

/**
 * Menyimpan fakta/memori baru ke Supabase
 */
export async function saveLearnedMemory(
  topic: string,
  fact: string,
  contributor: string
): Promise<{ success: boolean; memory: LearnedMemoryItem }> {
  const currentMemories = await getLearnedMemories();
  const id = `MEM-${Date.now().toString(36).toUpperCase()}`;

  const newMemory: LearnedMemoryItem = {
    id,
    topic: topic.trim(),
    fact: fact.trim(),
    contributor: contributor.trim() || "Sahabat",
    createdAt: new Date().toISOString(),
  };

  // Cek jika topik yang sama sudah ada (update atau tambahkan yang baru)
  const existingIdx = currentMemories.findIndex(
    (m) => m.topic.toLowerCase() === topic.trim().toLowerCase()
  );

  let updatedList: LearnedMemoryItem[] = [];
  if (existingIdx >= 0) {
    // Timpa fakta lama dengan fakta koreksi terbaru
    currentMemories[existingIdx] = newMemory;
    updatedList = currentMemories;
  } else {
    // Tambahkan memori baru (batasi 100 memori terbaru agar hemat context)
    updatedList = [newMemory, ...currentMemories].slice(0, 100);
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("site_content").upsert(
      {
        content_key: MEMORY_CONTENT_KEY,
        content_value: JSON.stringify(updatedList),
        content_type: "json",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "content_key" }
    );

    console.log(`[BOT-LEARNED-NEW-FACT] Topik: "${topic}" | Fakta: "${fact}" (Oleh: ${contributor})`);
    return { success: true, memory: newMemory };
  } catch (err: any) {
    console.error("[BOT-MEMORY-SAVE-ERR]:", err);
    return { success: false, memory: newMemory };
  }
}

/**
 * Memeriksa apakah suatu kalimat secara alami berpotensi mengandung kabar / fakta baru seputar alumni
 * TANPA memerlukan kata kunci kaku seperti "catat" atau "ingat".
 */
export function isPotentialFactStatement(messageText: string): boolean {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Abaikan pesan terlalu pendek (< 3 kata) atau tawa/salam biasa
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;
  if (/^(wkwk|haha|hehe|hihi|ckck|p|tes|ping|halo|hai|assalamu|wa'alaikum)/i.test(lower) && words.length < 5) {
    return false;
  }

  // 2. Abaikan jika kalimat adalah PERTANYAAN murni (mengandung tanda tanya atau kata tanya pembuka)
  if (
    messageText.includes("?") ||
    lower.startsWith("apakah ") ||
    lower.startsWith("siapa ") ||
    lower.startsWith("kapan ") ||
    lower.startsWith("dimana ") ||
    lower.startsWith("berapa ") ||
    lower.startsWith("kenapa ") ||
    lower.startsWith("mengapa ") ||
    lower.startsWith("bagaimana ")
  ) {
    return false;
  }

  // 3. Deteksi Predikat / Kabar Faktual Alami:
  // Karir, pekerjaan, pendidikan, domisili, usaha, pernikahan, prestasi, koreksi
  const factIndicators = [
    "kerja di", "bekerja di", "kantor di", "dinas di", "keterima di", "keterima kerja", "kerja",
    "kuliah di", "studi di", "jurusan", "kampus", "skripsi", "tesis", "wisuda", "lulus", "cumlaude", "yudisium",
    "pindah ke", "tinggal di", "sekarang di", "domisili di", "udah di", "merantau ke", "stay di",
    "buka usaha", "punya usaha", "buka toko", "buka warung", "buka kafe", "jualan", "bisnis", "toko",
    "udah nikah", "sudah nikah", "menikah dengan", "nikah sama", "punya anak", "tunangan", "lamaran",
    "menang lomba", "juara", "prestasi", "promosi jabatan", "naik jabatan", "pns", "asn", "bumn",
    "mondok", "nyantri", "ngabdi", "pengabdian", "guru di", "dosen di", "ustadz di",
    "aslinya anak", "sebenarnya", "bukan di", "koreksi", "salah min", "salah bot", "fyi", "kabar"
  ];

  if (factIndicators.some((indicator) => lower.includes(indicator))) {
    return true;
  }

  // 4. Kalimat deklaratif yang menyebut status terkini ("sekarang" / "udah" / "kemarin") dengan konteks
  if (
    (lower.includes("sekarang") || lower.includes("udah") || lower.includes("sudah") || lower.includes("kemarin") || lower.includes("baru")) &&
    words.length >= 4 &&
    !lower.startsWith("apa") &&
    !lower.startsWith("gimana")
  ) {
    return true;
  }

  return false;
}

/**
 * AI Reflex: Menganalisis apakah pesan pengguna merupakan fakta baru, koreksi, atau kabar alami tentang alumni
 */
export async function extractAndLearnFromMessage(
  messageText: string,
  contributor: string
): Promise<{
  hasLearned: boolean;
  topic?: string;
  fact?: string;
  acknowledgment?: string;
}> {
  // Hanya evaluasi pesan yang berpotensi mengandung fakta agar hemat kuota AI
  if (!isPotentialFactStatement(messageText)) {
    return { hasLearned: false };
  }

  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  if (!geminiApiKey) {
    return { hasLearned: false };
  }

  const prompt = `
You are the Cognitive Memory Engine for the Expedient Generation 43 WhatsApp Bot.
A user sent a natural message that may contain a NEW FACT, AN UPDATE, or A CORRECTION about an alumni member, event, business, or cohort activity.
Note: Users talk naturally like friends; they DO NOT need to say robotic words like "catat" or "ingat"!

MESSAGE: "${messageText}"
CONTRIBUTOR: "${contributor}"

TASK:
Analyze if this message contains a concrete, valuable factual update worth remembering for future alumni questions.
Examples of natural updates:
- "si Danang sekarang udah keterima kerja di Pertamina" -> topic: "Danang", fact: "Danang sekarang bekerja di Pertamina"
- "Auzan kemarin baru pindah dinas ke Jakarta" -> topic: "Auzan", fact: "Auzan saat ini berdinas/domisili di Jakarta"
- "Rizki baru buka kafe kopi di Ponorogo" -> topic: "Rizki", fact: "Rizki memiliki usaha kafe kopi di Ponorogo"
- "Ihya alhamdulillah kemarin wisuda S1 di Malang" -> topic: "Ihya", fact: "Ihya telah lulus S1 dari kampus di Malang"
- "bukan gitu bot, si Fulan aslinya anak Kediri" -> topic: "Fulan", fact: "Fulan berasal dari Kediri"

OUTPUT FORMAT (JSON ONLY):
{
  "isFact": true | false,
  "topic": "Name or subject (1-3 words, e.g. 'Danang' or 'Auzan')",
  "fact": "Clear, concise fact statement in Indonesian",
  "acknowledgment": "Warm, enthusiastic, natural Indonesian reply like a close friend (1 to 2 sentences max!). Express genuine happiness, congratulations, or gratitude for sharing the news. CRITICAL: Never say robotic phrases like 'sudah kucatat di database/memori' or mention keywords—just speak naturally like a friend who is glad to know this update!"
}
If it is just general chat, jokes, or does not contain a factual update about an alumni or activity, return {"isFact": false}.
`.trim();

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    const res = await callGeminiResilient(body, geminiApiKey, geminiModel);
    const textOutput = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const parsed = JSON.parse(textOutput);

    if (parsed.isFact && parsed.topic && parsed.fact) {
      await saveLearnedMemory(parsed.topic, parsed.fact, contributor);
      const ack =
        parsed.acknowledgment ||
        `Wah alhamdulillah, makasih infonya ya Sahabat *${contributor}*! Sekarang aku jadi tahu kalau *${parsed.fact}*. Sukses terus buat sahabat kita! 🙌✨`;

      return {
        hasLearned: true,
        topic: parsed.topic,
        fact: parsed.fact,
        acknowledgment: ack,
      };
    }
  } catch (err: any) {
    console.warn("[BOT-MEMORY-EXTRACT-WARN]:", err.message);
  }

  return { hasLearned: false };
}
