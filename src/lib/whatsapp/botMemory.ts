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
 * AI Reflex: Menganalisis apakah pesan pengguna merupakan fakta baru, koreksi, atau instruksi untuk mengingat sesuatu
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
  const lower = messageText.trim().toLowerCase();

  // Pemicu cepat: kata kunci eksplisit untuk mengingat atau mengoreksi
  const isExplicitNote =
    lower.includes("catat") ||
    lower.includes("ingat") ||
    lower.includes("fyi") ||
    lower.includes("koreksi") ||
    lower.includes("salah min") ||
    lower.includes("salah bot") ||
    lower.includes("bukan bot") ||
    lower.includes("bukan min") ||
    lower.startsWith("info baru:") ||
    lower.startsWith("note:") ||
    lower.includes("sekarang kerja di") ||
    lower.includes("sekarang kuliah di") ||
    lower.includes("udah nikah") ||
    lower.includes("sudah menikah") ||
    lower.includes("pindah ke");

  if (!isExplicitNote) {
    return { hasLearned: false };
  }

  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  if (!geminiApiKey) {
    return { hasLearned: false };
  }

  const prompt = `
You are the Cognitive Memory Engine for the Expedient Generation 43 WhatsApp Bot.
A user sent a message that may contain a NEW FACT, AN UPDATE, or A CORRECTION about an alumni member, event, business, or cohort activity.

MESSAGE: "${messageText}"
CONTRIBUTOR: "${contributor}"

TASK:
Analyze if this message contains a concrete, valuable factual update worth remembering for future alumni questions.
Examples of valuable facts:
- Job updates ("Budi sekarang kerja di Pertamina") -> topic: "Budi", fact: "Budi sekarang bekerja di Pertamina"
- Education updates ("Danang lanjut S2 di ITB") -> topic: "Danang", fact: "Danang sedang menempuh studi S2 di ITB"
- Location updates ("Auzan pindah ke Jakarta bukan Bandung lagi") -> topic: "Auzan", fact: "Auzan saat ini berdomisili/dinas di Jakarta (sebelumnya di Bandung)"
- Marriage/Family updates ("Fulan sudah menikah") -> topic: "Fulan", fact: "Fulan sudah menikah"
- Business updates ("Rian buka warkop di Slahung") -> topic: "Rian", fact: "Rian memiliki usaha warkop di Slahung"

OUTPUT FORMAT (JSON ONLY):
{
  "isFact": true | false,
  "topic": "Name or subject (1-3 words, e.g. 'Danang' or 'Auzan')",
  "fact": "Clear, concise fact statement in Indonesian",
  "acknowledgment": "Warm, polite Indonesian confirmation (1 sentence) acknowledging that the bot has saved this fact to its permanent memory."
}
If it is just casual chatter or an insult without concrete fact, return {"isFact": false}.
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
        `Siap Sahabat *${contributor}*! Sudah kuingat dan kucatat di memori angkatan: *${parsed.fact}*. Terima kasih informasinya! 📝✨`;

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
