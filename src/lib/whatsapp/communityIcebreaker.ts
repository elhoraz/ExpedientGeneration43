import { createAdminClient } from "@/lib/supabase/admin";
import { getCommunityGroupId, sendWhatsAppGroupMessage } from "@/lib/whatsapp";
import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";

const LAST_ACTIVITY_KEY = "community_group_last_activity";
const LAST_ICEBREAKER_KEY = "community_group_last_icebreaker_sent";

// Batas waktu keheningan grup: Default 3 Jam (dapat diubah via env)
const INACTIVITY_THRESHOLD_MS = Number(process.env.COMMUNITY_INACTIVITY_HOURS || 3) * 60 * 60 * 1000;

// Cooldown minimum antar pemantik obrolan: Default 3 Jam
const ICEBREAKER_COOLDOWN_MS = Number(process.env.COMMUNITY_ICEBREAKER_COOLDOWN_HOURS || 3) * 60 * 60 * 1000;

export interface GroupActivityRecord {
  timestamp: number;
  lastMessage: string;
  senderName: string;
  senderPhone: string;
}

/**
 * Catat aktivitas pesan terbaru di grup angkatan non-resmi
 */
export async function recordCommunityGroupActivity(
  messageText: string,
  senderName: string,
  senderPhone: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const record: GroupActivityRecord = {
      timestamp: Date.now(),
      lastMessage: messageText.slice(0, 150),
      senderName: senderName || "Sahabat",
      senderPhone: senderPhone || "",
    };

    await supabase.from("site_content").upsert(
      {
        content_key: LAST_ACTIVITY_KEY,
        content_value: JSON.stringify(record),
        content_type: "json",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "content_key" }
    );
  } catch (err: any) {
    console.warn("[RECORD-GROUP-ACTIVITY-WARN]:", err.message);
  }
}

/**
 * Dapatkan waktu terakhir grup aktif dari database
 */
export async function getLastCommunityGroupActivity(): Promise<GroupActivityRecord | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_content")
      .select("content_value, updated_at")
      .eq("content_key", LAST_ACTIVITY_KEY)
      .maybeSingle();

    if (data?.content_value) {
      return JSON.parse(data.content_value);
    }

    if (data?.updated_at) {
      return {
        timestamp: new Date(data.updated_at).getTime(),
        lastMessage: "",
        senderName: "",
        senderPhone: "",
      };
    }
  } catch (err: any) {
    console.warn("[GET-LAST-ACTIVITY-WARN]:", err.message);
  }

  return null;
}

/**
 * Cek apakah jam saat ini masuk dalam Jam Istirahat / Hening (Quiet Hours)
 * Etika santri: Tidak memicu notifikasi grup antara pukul 23:00 - 06:30 WIB (tengah malam/tidur)
 */
function isQuietHoursWIB(): boolean {
  try {
    const now = new Date();
    // Konversi ke Waktu Indonesia Barat (WIB = UTC+7)
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hour12: false,
    });
    const currentHourWIB = parseInt(formatter.format(now), 10);
    // Jam hening: 23:00 malam s/d 06:30 pagi
    return currentHourWIB >= 23 || currentHourWIB < 7;
  } catch {
    return false;
  }
}

/**
 * Koleksi Pemantik Obrolan Khas Santri / Alumni Arrisalah 2025 (Fallback Curated)
 */
const CURATED_CATCHY_ICEBREAKERS = [
  // 1. Nostalgia Makanan & Kehidupan Asrama
  `Wah sepi banget nih grup, pada lagi sibuk apa kawan-kawan? ☕👀\n\nMumpung senggang, ana mau nanya hal paling krusial pas mondok dulu:\n*Antum tim yang kalo antre makan di dapur sukanya lauk telur dadar apa ayam suwir legendaris?* 😂👇`,

  // 2. Debat Kasur Asrama
  `Halo gaes, numpang lewat memecah keheningan... 🍃\n\nCoba jujur, pas di asrama dulu antum lebih suka kebagian *ranjang atas apa ranjang bawah?* Dan apa tragedi paling kocak yang pernah terjadi di lemari antum? 🛌🤣`,

  // 3. Absen Domisili & Kesibukan Sekarang
  `Sepi amat yaa, kayak lorong kelas pas jam tidur siang dulu... 😴🚪\n\nAbsen dulu dong sahabat The Successors 2025! Yang sekarang lagi di perantauan (kuliah/kerja), lagi pada berlabuh di kota mana aja nih? Ada yang sekota gak ya? 🙋‍♂️📍`,

  // 4. Nostalgia Jam Piket & Hukuman
  `Man jadda wajada... tapi kalau man jadda mager jadinya ketiduran. 😆\n\nSiapa di sini yang dulu punya rekor paling sering lolos dari pantauan bagian keamanan / jasus pas jam piket? Ngaku hayo! 🏃💨`,

  // 5. Kopi & Nongkrong
  `Tes 1 2 3... mic cek! 🎙️✨\n\nDaripada grupnya hening kayak perpustakaan, spill dong warung kopi atau tempat nongkrong favorit antum sekarang di kota masing-masing! Siapa tahu ada sahabat yang mau mampir silaturahmi. ☕🤝`,

  // 6. Guyonan Sandal Masjid
  `Sebuah misteri terbesar di dunia pesantren yang belum terpecahkan:\n*Ke mana perginya sandal jepit yang hilang di tangga masjid pas salat Jumat?* 🩴😂\n\nAda yang kangen momen rebutan sandal wudhu gak nih?`,

  // 7. Motivasi & Semangat
  `Assalamu'alaikum sahabat seperjuangan Expedient 43! 🌟\n\nCuma mau ngingetin: Semangat buat yang hari ini lagi ngerjain tugas kuliah, ngantor, ataupun merintis usaha. Semoga dilancarkan semua ikhtiar antum hari ini! Ada cerita seru apa minggu ini? 🤲🔥`,
];

/**
 * Hasilkan Pesan Pemantik Obrolan yang Catchy & Segar dengan Gemini AI
 */
async function generateCatchyIcebreakerWithAi(): Promise<string> {
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!geminiApiKey) {
    const randomIndex = Math.floor(Math.random() * CURATED_CATCHY_ICEBREAKERS.length);
    return CURATED_CATCHY_ICEBREAKERS[randomIndex];
  }

  const prompt = `
You are the witty, beloved, and friendly AI Mascot of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo, Class of 2025, known as "The Successors").
Currently, the alumni WhatsApp group (⚔️successors⚔️) has been completely quiet for more than 6 hours.

TASK:
Write a SHORT, SUPER CATCHY, WITTY, and WARM conversation starter in informal, natural Indonesian/Santri slang (campuran santun, akrab, sedikit bahasa pondok seperti: 'antum', 'ngabsen', 'asrama', 'ustadz', 'dapur', 'jasus', 'kopi').

REQUIREMENTS:
1. Length: 2 to 4 sentences maximum.
2. Tone: Warm, funny, relatable, inviting interaction (e.g., asking a fun choice, nostalgic memory, or asking where everyone is living/studying now).
3. Do NOT sound like an automated corporate bot. Sound like an old close classmate who suddenly drops a funny/nostalgic question to revive the chat!
4. Mention something relatable to alumni class of 2025 Arrisalah Slahung Ponorogo.
5. End with a light, engaging question or call to action so people naturally want to reply!
6. Output ONLY the WhatsApp message text (with emojis and formatting like *bold* where appropriate). No preamble.
`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
    },
  };

  try {
    const data = await callGeminiResilient(body, geminiApiKey, "gemini-3.5-flash");
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (aiText && aiText.length > 25) {
      return aiText;
    }
  } catch (err: any) {
    console.warn("[ICEBREAKER-AI-WARN]:", err.message);
  }

  const randomIndex = Math.floor(Math.random() * CURATED_CATCHY_ICEBREAKERS.length);
  return CURATED_CATCHY_ICEBREAKERS[randomIndex];
}

/**
 * Fungsi Utama: Cek apakah grup sudah sepi >= batas waktu, dan picu obrolan jika memenuhi syarat.
 * Mendukung customSender callback untuk pengiriman langsung via live Baileys socket!
 */
export async function checkAndTriggerCommunityIcebreaker(
  force = false,
  customSender?: (target: string, message: string) => Promise<{ success: boolean; reason?: string }>
): Promise<{
  triggered: boolean;
  reason: string;
  elapsedHours: number;
  message?: string;
}> {
  const supabase = createAdminClient();
  const communityGroupId = getCommunityGroupId();

  // 1. Cek Jam Hening (Quiet Hours: 23.00 - 06.30 WIB)
  if (!force && isQuietHoursWIB()) {
    return {
      triggered: false,
      reason: "Saat ini jam istirahat malam (Quiet Hours WIB: 23.00-06.30). Bot tidak mengganggu istirahat alumni.",
      elapsedHours: 0,
    };
  }

  // 2. Ambil Waktu Aktivitas Terakhir
  const lastActivity = await getLastCommunityGroupActivity();
  const now = Date.now();
  const lastActivityTimestamp = lastActivity?.timestamp;

  // Jika belum ada catatan sama sekali di database dan tidak dipaksa (force), inisialisasi baseline
  if (!force && !lastActivityTimestamp) {
    await recordCommunityGroupActivity("Inisialisasi sistem", "Sistem", "");
    return {
      triggered: false,
      reason: `Catatan aktivitas grup baru saja diinisialisasi. Menunggu pemantauan ${(INACTIVITY_THRESHOLD_MS / (1000 * 60 * 60)).toFixed(1)} jam ke depan.`,
      elapsedHours: 0,
    };
  }

  const elapsedMs = lastActivityTimestamp ? (now - lastActivityTimestamp) : INACTIVITY_THRESHOLD_MS;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const thresholdHours = INACTIVITY_THRESHOLD_MS / (1000 * 60 * 60);

  // 3. Cek apakah sudah sepi >= batas inaktivitas
  if (!force && elapsedMs < INACTIVITY_THRESHOLD_MS) {
    return {
      triggered: false,
      reason: `Grup baru aktif ${elapsedHours.toFixed(1)} jam yang lalu. Belum mencapai batas hening ${thresholdHours.toFixed(1)} jam.`,
      elapsedHours,
    };
  }

  // 4. Cek Cooldown Pemantik Terakhir (agar tidak dobel kirim dalam window cooldown)
  if (!force) {
    try {
      const { data: iceData } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("content_key", LAST_ICEBREAKER_KEY)
        .maybeSingle();

      if (iceData?.content_value) {
        const lastSent = parseInt(iceData.content_value, 10);
        if (now - lastSent < ICEBREAKER_COOLDOWN_MS) {
          const cooldownElapsedHours = (now - lastSent) / (1000 * 60 * 60);
          return {
            triggered: false,
            reason: `Pemantik obrolan sudah pernah dikirim ${cooldownElapsedHours.toFixed(1)} jam lalu. Masih cooldown.`,
            elapsedHours,
          };
        }
      }
    } catch {}
  }

  // 5. Generate Pesan yang Catchy & Menarik via AI
  const icebreakerMessage = await generateCatchyIcebreakerWithAi();

  // 6. Kirim ke Grup Non-Resmi
  console.log(`[ICEBREAKER-TRIGGER] Mengirim pemantik obrolan ke grup ${communityGroupId}...`);
  let sendRes: { success: boolean; reason?: string } = { success: false };

  if (customSender) {
    sendRes = await customSender(communityGroupId, icebreakerMessage);
  } else {
    sendRes = await sendWhatsAppGroupMessage(communityGroupId, icebreakerMessage);
  }

  if (sendRes.success) {
    // Perbarui waktu pengiriman pemantik obrolan & perbarui aktivitas terakhir grup ke pesan bot
    try {
      await supabase.from("site_content").upsert(
        {
          content_key: LAST_ICEBREAKER_KEY,
          content_value: String(now),
          content_type: "text",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "content_key" }
      );

      await recordCommunityGroupActivity(icebreakerMessage, "Expedient AI", "");

      // Catat ke whatsapp_queue
      await supabase.from("whatsapp_queue").insert([
        {
          no_whatsapp: communityGroupId.slice(0, 20),
          message: `[ICEBREAKER GRUP] "${icebreakerMessage.slice(0, 100)}..."`,
          status: "sent_group",
          error_message: `Pemicu keaktifan grup dikirim setelah hening ${elapsedHours.toFixed(1)} jam.`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return {
      triggered: true,
      reason: `Sukses memicu obrolan setelah grup hening ${elapsedHours.toFixed(1)} jam.`,
      elapsedHours,
      message: icebreakerMessage,
    };
  }

  return {
    triggered: false,
    reason: `Gagal mengirim ke grup WhatsApp: ${sendRes.reason || "Socket/Provider error"}`,
    elapsedHours,
  };
}

/**
 * Mengambil foto kenangan masa pondok ASLI dari arsip (tanpa crop & tanpa blur)
 * Dipasangkan dengan ajakan bernostalgia untuk memecah keheningan grup.
 */
export function getAuthenticNostalgiaPhoto(): {
  filePath: string;
  imageBuffer: Buffer;
  caption: string;
} | null {
  try {
    const fs = require("fs");
    const path = require("path");
    const assetsDir = path.join(process.cwd(), "public", "assets", "foto_putra");
    if (!fs.existsSync(assetsDir)) return null;

    // Pilih halaman kenangan acak antara Hal 4 sampai Hal 140 (arsip foto santri)
    const pageNum = Math.floor(Math.random() * 135) + 4;
    const targetFile = path.join(assetsDir, `Hal ${pageNum}.webp`);

    if (fs.existsSync(targetFile)) {
      const imageBuffer = fs.readFileSync(targetFile);
      const captions = [
        `📸 *[FLASHBACK NOSTALGIA SANTRI EXPEDIENT 43]*\n\nNemu arsip foto kenangan masa pondok kita nih sahabat! 😄\n\nAda yang masih ingat ini momen apa, tahun berapa, atau siapa aja yang kelihatan di foto ini? Coba spill ceritanya di bawah! 👇✨`,
        `📸 *[KILAS BALIK ARRISALAH 2025]*\n\nMasya Allah, waktu terasa cepat berlalu ya sahabat... 🍃\n\nCoba tebak siapa aja kawan sekamar / sekelas antum yang ada di foto kenangan asli ini? Masih hafal namanya gak nih? 😂👇`,
        `📸 *[MEMORI TAK TERLUPAKAN - THE SYNDICATE]*\n\nSatu foto, seribu cerita perjuangan di pondok tercinta. 🌟\n\nKira-kira apa tragedi atau kisah paling lucu di balik momen foto ini sahabat? Yuk nostalgia bareng! ☕🤲`,
      ];
      const caption = captions[Math.floor(Math.random() * captions.length)];
      return {
        filePath: targetFile,
        imageBuffer,
        caption,
      };
    }
  } catch (err: any) {
    console.warn("[NOSTALGIA-PHOTO-WARN]:", err.message);
  }
  return null;
}

