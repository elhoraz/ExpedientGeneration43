import * as crypto from "crypto";
import { callGeminiResilient } from "@/lib/geminiResilient";
import { createAdminClient } from "@/lib/supabase/admin";

export interface KaburOption {
  key: "A" | "B" | "C" | "D";
  label: string;
  archetype: "ALIBI" | "NINJA" | "PARKOUR" | "DIPLOMASI";
  description: string;
}

export interface KaburPollPayload {
  name: string;
  values: string[];
  options: KaburOption[];
}

export interface KaburGameState {
  groupId: string;
  status: "idle" | "active" | "escaped" | "caught";
  chapter: number; // 1: Rayon Asrama, 2: Dapur & Tembok Belakang, 3: Luar Pagar & Jalan Desa, 4: Rental PS / Warkop
  stealth: number; // 0 - 100
  stamina: number; // 0 - 100
  inventory: string[];
  history: string[]; // Ringkasan adegan sebelumnya
  lastStory: string;
  lastOptions: KaburOption[];
  starterName: string;
  lastActorName?: string;
  caughtBy?: "JASUS" | "QISM_KEAMANAN" | "RIAYAH" | null;
  startedAt: number;
  lastUpdatedAt: number;
}

// In-Memory store per group
const activeSessions = new Map<string, KaburGameState>();

// Durasi timeout sesi (15 menit tanpa interaksi = auto close)
const SESSION_TIMEOUT_MS = 15 * 60 * 1000;

// Anti-Spam & Cooldown Maps
const groupWarningCooldown = new Map<string, number>(); // groupId -> timestamp last warning sent
const groupFinishCooldown = new Map<string, number>(); // groupId -> timestamp last game ended
const userSpamThrottle = new Map<string, { count: number; windowStart: number; blockedUntil: number }>();

export const WARNING_COOLDOWN_MS = 25 * 1000; // 25s cooldown before repeating "Game sudah aktif"
export const RESTART_COOLDOWN_MS = 15 * 1000; // 15s cooldown after game ends before restarting

export function resetKaburCooldowns(groupId?: string): void {
  if (groupId) {
    groupWarningCooldown.delete(groupId);
    groupFinishCooldown.delete(groupId);
    for (const key of userSpamThrottle.keys()) {
      if (key.startsWith(`${groupId}:`)) userSpamThrottle.delete(key);
    }
  } else {
    groupWarningCooldown.clear();
    groupFinishCooldown.clear();
    userSpamThrottle.clear();
  }
}

const DEFAULT_INVENTORY = [
  "Gayung Merah Sakti",
  "Sarung Samarinda",
  "Sandal Swallow Ukir Silet",
  "Uang Kas Rp 25.000",
];

/**
 * Format status bar untuk pesan WhatsApp
 */
function formatStatusBar(state: KaburGameState): string {
  const stealthBar = getVisualBar(state.stealth);
  const staminaBar = getVisualBar(state.stamina);

  return (
    `📊 *STATUS TIM SANTRI*\n` +
    `🤫 *Stealth:* ${stealthBar} ${state.stealth}%\n` +
    `⚡ *Stamina:* ${staminaBar} ${state.stamina}%\n` +
    `🎒 *Inventaris:* ${state.inventory.join(", ")}`
  );
}

function getVisualBar(value: number): string {
  const blocks = Math.round(Math.max(0, Math.min(100, value)) / 20);
  return "🟩".repeat(blocks) + "⬜".repeat(5 - blocks);
}

/**
 * Skenario Awal Pembuka (Chapter 1)
 */
const CHAPTER_1_PRESET: { story: string; options: KaburOption[] } = {
  story:
    `🌙 *[OPERASI KABUR DARI PONDOK: CHAPTER 1 - RAYON ASRAMA]*\n\n` +
    `Pukul *00:20 WIB*. Lonceng tidur malam sudah padam sejak sejam lalu. Lorong rayon gelap gulita dan sunyi, hanya ada dengkuran santri-santri yang kelelahan.\n\n` +
    `Kalian sudah siap di dekat pintu rayon dengan sarung terikat kencang di pinggang. Target malam ini jelas: *Menembus tembok belakang pondok demi seporsi mie dok-dok & rental PS di warkop depan!*\n\n` +
    `Tiba-tiba... ***Sreeek... tek... tek...***\n` +
    `Cahaya senter SWAT berputar-putar di dinding lorong! Dari ujung tangga, terdengar derap langkah pantofel **Qism Keamanan (Bagian Keamanan)** yang lagi sidak ronda malam. Tinggal 10 meter lagi mereka lewat depan pintu rayon kalian!`,
  options: [
    {
      key: "A",
      label: "ALIBI GAYUNG",
      archetype: "ALIBI",
      description:
        "Tenteng gayung merah, jalan santai pura-pura mau mules ke kamar mandi sambil baca doa masuk WC lantang.",
    },
    {
      key: "B",
      label: "NINJA SARUNG",
      archetype: "NINJA",
      description:
        "Tarik sarung menutupi kepala, jongkok tiarap di bawah jemuran baju basah di lorong.",
    },
    {
      key: "C",
      label: "DISTRAKSI KUCING",
      archetype: "PARKOUR",
      description:
        "Timpuk sandal swallow ke arah tong sampah ujung lorong biar ada suara gaduh pengalih perhatian.",
    },
    {
      key: "D",
      label: "SOGOKAN INDOMIE",
      archetype: "DIPLOMASI",
      description:
        "Buka pintu pelan-pelan, bisikin jasus junior di pojokan dengan iming-iming 1 bungkus mie sedap goreng.",
    },
  ],
};

/**
 * Memulai game baru di grup
 */
export async function startKaburGame(
  groupId: string,
  senderName: string,
  senderPhone?: string
): Promise<{ success: boolean; message: string; silent?: boolean; poll?: KaburPollPayload }> {
  const now = Date.now();

  // 1. Cek Throttle User Spamming (>3x dalam 8 detik)
  const userKey = `${groupId}:${senderPhone || senderName}`;
  const userRecord = userSpamThrottle.get(userKey);
  if (userRecord && now < userRecord.blockedUntil) {
    return { success: false, silent: true, message: "" };
  }

  if (!userRecord || now - userRecord.windowStart > 8000) {
    userSpamThrottle.set(userKey, { count: 1, windowStart: now, blockedUntil: 0 });
  } else {
    userRecord.count++;
    if (userRecord.count >= 4) {
      userRecord.blockedUntil = now + 20000;
      return {
        success: false,
        silent: false,
        message: `🤫 *Hussh ${senderName}!* Antum terlalu berisik teriak-teriak di lorong asrama. Nanti kedengeran Qism Keamanan! Diam dulu 20 detik ya!`,
      };
    }
  }

  // 2. Cek Cooldown Restart Game yang Baru Selesai
  const lastFinished = groupFinishCooldown.get(groupId) || 0;
  if (now - lastFinished < RESTART_COOLDOWN_MS) {
    const remainingSec = Math.ceil((RESTART_COOLDOWN_MS - (now - lastFinished)) / 1000);
    return {
      success: false,
      silent: false,
      message: `⏳ *Santri lagi atur napas!* Tunggu *${remainingSec} detik* lagi sebelum memulai operasi kabur baru ya sahabat!`,
    };
  }

  // 3. Cek Game yang Sedang Aktif (dengan proteksi Anti-Spam Warning)
  const existing = activeSessions.get(groupId);
  if (existing && existing.status === "active" && now - existing.lastUpdatedAt < SESSION_TIMEOUT_MS) {
    const lastWarning = groupWarningCooldown.get(groupId) || 0;
    if (now - lastWarning < WARNING_COOLDOWN_MS) {
      // Abaikan secara senyap agar bot tidak ikut-ikutan nyampah di grup!
      return {
        success: false,
        silent: true,
        message: "",
      };
    }

    groupWarningCooldown.set(groupId, now);
    return {
      success: false,
      silent: false,
      message:
        `⚠️ *Operasi kabur sudah aktif di grup ini sahabat!*\n\n` +
        `Kalian saat ini ada di *Chapter ${existing.chapter}*.\n` +
        `Ketik *!kabur status* untuk melihat kondisi terakhir atau langsung reply pilihan [A/B/C/D] / Polling!\n` +
        `*(Ketik !kabur stop jika ingin menyerah)*`,
    };
  }

  const newState: KaburGameState = {
    groupId,
    status: "active",
    chapter: 1,
    stealth: 100,
    stamina: 100,
    inventory: [...DEFAULT_INVENTORY],
    history: ["Memulai misi dari kamar rayon malam hari, berhadapan dengan patroli Qism Keamanan."],
    lastStory: CHAPTER_1_PRESET.story,
    lastOptions: CHAPTER_1_PRESET.options,
    starterName: senderName || "Sahabat Santri",
    startedAt: now,
    lastUpdatedAt: now,
  };

  activeSessions.set(groupId, newState);

  const optionsText = newState.lastOptions
    .map((opt) => `*${opt.key}.* 🏷️ *[${opt.label}]*\n   ${opt.description}`)
    .join("\n\n");

  const message =
    `${newState.lastStory}\n\n` +
    `${formatStatusBar(newState)}\n\n` +
    `═══════════════════════════\n` +
    `⚡ *PILIH TINDAKAN TIM KALIAN:* ⚡\n\n` +
    `${optionsText}\n\n` +
    `🗳️ *Pilih jawaban antum lewat Polling di bawah ini, atau langsung balas dengan A, B, C, atau D!*\n` +
    `_Diprakarsai oleh sahabat *${senderName}*._ Bismillah, jangan sampai botak licin! 🏃‍♂️💨`;

  const poll: KaburPollPayload = {
    name: `⚡ LANGKAH TIM SANTRI (CH. ${newState.chapter}):`,
    values: newState.lastOptions.map(
      (opt) =>
        `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`
    ),
    options: newState.lastOptions,
  };

  return { success: true, message, poll };
}

/**
 * Memproses respon pemain (A/B/C/D)
 */
export async function handleKaburAnswer(
  groupId: string,
  rawInput: string,
  senderName: string
): Promise<{ handled: boolean; replyText?: string; poll?: KaburPollPayload }> {
  const session = activeSessions.get(groupId);
  if (!session || session.status !== "active") return { handled: false };

  // Cek timeout sesi
  if (Date.now() - session.lastUpdatedAt > SESSION_TIMEOUT_MS) {
    activeSessions.delete(groupId);
    return {
      handled: true,
      replyText: `⌛ *Misi Kabur Kedaluwarsa!*\nKarena terlalu lama hening di kegelapan malam, kalian ketiduran di lantai dan adzan Subuh keburu berkumandang. Ketik *!kabur* untuk coba lagi!`,
    };
  }

  // Normalisasi input
  const clean = rawInput.trim().toUpperCase();
  let selectedKey: "A" | "B" | "C" | "D" | null = null;

  if (clean === "A" || clean === "🅰️" || clean.startsWith("A.") || clean.startsWith("A ")) selectedKey = "A";
  else if (clean === "B" || clean === "🅱️" || clean.startsWith("B.") || clean.startsWith("B ")) selectedKey = "B";
  else if (clean === "C" || clean === "🅲" || clean.startsWith("C.") || clean.startsWith("C ")) selectedKey = "C";
  else if (clean === "D" || clean === "🅳" || clean.startsWith("D.") || clean.startsWith("D ")) selectedKey = "D";

  if (!selectedKey) {
    return { handled: false };
  }

  const chosenOption = session.lastOptions.find((o) => o.key === selectedKey);
  if (!chosenOption) {
    return { handled: false };
  }

  // Eksekusi jalan cerita berikutnya dengan Gemini
  const nextScene = await generateNextSceneWithAI(session, chosenOption, senderName);

  // Update session state
  session.chapter = nextScene.newChapter;
  session.stealth = Math.max(0, Math.min(100, session.stealth + nextScene.stealthDelta));
  session.stamina = Math.max(0, Math.min(100, session.stamina + nextScene.staminaDelta));
  session.lastActorName = senderName;
  session.lastUpdatedAt = Date.now();

  if (nextScene.inventoryLost) {
    session.inventory = session.inventory.filter((item) => !nextScene.inventoryLost?.includes(item));
  }
  if (nextScene.inventoryGained) {
    session.inventory.push(...nextScene.inventoryGained);
  }

  session.history.push(`[Ch.${session.chapter}] ${senderName} memilih [${chosenOption.key} - ${chosenOption.label}]: ${nextScene.narrationSummary}`);

  // Cek kondisi kalah (tertangkap)
  if (session.stealth <= 0 || nextScene.outcome === "CAUGHT") {
    session.status = "caught";
    session.caughtBy = nextScene.caughtBy || (session.chapter >= 3 ? "RIAYAH" : "QISM_KEAMANAN");
    activeSessions.delete(groupId);
    groupFinishCooldown.set(groupId, Date.now());
    groupWarningCooldown.delete(groupId);

    const takzirMessage =
      session.caughtBy === "RIAYAH"
        ? `🚨 *TERTANGKAP BASAH OLEH BIRO RIAYAH!* 🚨\n\n` +
          `Dari balik bayangan pohon palem, muncul *Ustadz Ri'ayah* dengan sorotan mata elang dan tasbih kayu di tangan. Beliau menghela napas panjang:\n` +
          `_"Subhanallah... jam 1 malam masih bergentayangan di luar asrama antum semua? Besok ba'da Subuh kumpul di depan kantor pengasuhan!"_\n\n` +
          `💥 *TAKZIR AKBAR:* Seluruh tim digundul licin 0 cm tanpa sisa, dijemur di tengah lapangan membawa gayung, dan dapat tugas tambahan menguras bak mandi masjid selama 2 minggu!\n\n` +
          `💀 *GAME OVER.* Ketik *!kabur* untuk mengulang nasib!`
        : `🚨 *TERCIDUK QISM KEAMANAN!* 🚨\n\n` +
          `Senter SWAT langsung menyorot muka kalian! Pengurus keamanan langsung mengepung sambil mengetuk-ngetukkan rotan ke telapak tangan:\n` +
          `_"Hayoo mau kabur kemana antum?! Nama rayon apa, mudabbirnya siapa?!"_\n\n` +
          `💥 *TAKZIR:* Berdiri satu kaki di depan kantor keamanan sampai adzan Subuh sambil menghafal 50 bait Alfiyyah Ibnu Malik!\n\n` +
          `💀 *GAME OVER.* Ketik *!kabur* untuk mencoba lagi!`;

    return {
      handled: true,
      replyText:
        `📢 *Pilihan Sahabat ${senderName}: [${chosenOption.key}. ${chosenOption.label}]*\n\n` +
        `${nextScene.storyNarration}\n\n` +
        `═══════════════════════════\n` +
        `${takzirMessage}`,
    };
  }

  // Cek kondisi menang (berhasil lolos ke warkop/rental PS)
  if (session.chapter >= 4 || nextScene.outcome === "ESCAPED") {
    session.status = "escaped";
    activeSessions.delete(groupId);
    groupFinishCooldown.set(groupId, Date.now());
    groupWarningCooldown.delete(groupId);

    const victoryMessage =
      `🎉🏆 *MISI KABUR DARI PONDOK BERHASIL TOTAL!* 🏆🎉\n\n` +
      `Kalian melompati parit sawah terakhir dan mendadak terdengar alunan musik dari warung kopi dan gemerlap lampu neon rental PS!\n\n` +
      `Kalian duduk santai di bangku kayu panjang warkop, memesan satu porsi *Indomie Kuah Kari Dobel Telor + Es Teh Manis Jumbo*, sambil nonton pertandingan bola liga Inggris dan mabar PES!\n\n` +
      `✨ *Pahlawan Penentu:* Sahabat *${senderName}*\n` +
      `🎒 *Sisa Bawaan:* ${session.inventory.join(", ")}\n` +
      `🤫 *Sisa Stealth:* ${session.stealth}% | ⚡ *Stamina:* ${session.stamina}%\n\n` +
      `_Selamat rekan-rekan! Angkatan kalian resmi menorehkan legenda baru di asrama!_ 🎮🍜`;

    return {
      handled: true,
      replyText:
        `📢 *Pilihan Sahabat ${senderName}: [${chosenOption.key}. ${chosenOption.label}]*\n\n` +
        `${nextScene.storyNarration}\n\n` +
        `═══════════════════════════\n` +
        `${victoryMessage}`,
    };
  }

  // Lanjut ke adegan berikutnya
  session.lastStory = nextScene.storyNarration;
  session.lastOptions = nextScene.options;

  const nextOptionsText = nextScene.options
    .map((opt) => `*${opt.key}.* 🏷️ *[${opt.label}]*\n   ${opt.description}`)
    .join("\n\n");

  const replyText =
    `📢 *Aksi Diterima dari Sahabat ${senderName}: [${chosenOption.key} - ${chosenOption.label}]*\n\n` +
    `${nextScene.storyNarration}\n\n` +
    `${formatStatusBar(session)}\n\n` +
    `═══════════════════════════\n` +
    `💬 *Balas dengan Polling di bawah atau ketik A, B, C, D untuk lanjut!*`;

  const poll: KaburPollPayload = {
    name: `⚡ LANGKAH TIM SANTRI (CH. ${session.chapter}):`,
    values: nextScene.options.map(
      (opt) =>
        `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`
    ),
    options: nextScene.options,
  };

  return { handled: true, replyText, poll };
}

/**
 * Status permainan saat ini
 */
export function getKaburGameStatus(groupId: string): string {
  const session = activeSessions.get(groupId);
  if (!session || session.status !== "active") {
    return (
      `🛌 *Tidak ada operasi kabur yang sedang berjalan!*\n\n` +
      `Asrama sedang aman dan damai. Ingin memulai misi kabur menembus penjagaan Qism Keamanan & Ri'ayah?\n\n` +
      `👉 Ketik *!kabur* untuk memulai petualangan seru ini!`
    );
  }

  return (
    `🏃‍♂️ *MISI KABUR DARI PONDOK (CHAPTER ${session.chapter})*\n\n` +
    `${formatStatusBar(session)}\n\n` +
    `📜 *Rangkuman Jejak Terakhir:*\n` +
    session.history.slice(-2).map((h) => `• ${h}`).join("\n") +
    `\n\n_Ketik salah satu pilihan [A/B/C/D] dari adegan terakhir, atau ketik *!kabur stop* untuk membatalkan misi!_`
  );
}

/**
 * Menghentikan permainan secara manual
 */
export function stopKaburGame(groupId: string): string {
  const session = activeSessions.get(groupId);
  if (!session) {
    return "Tidak ada operasi kabur aktif yang bisa dihentikan sahabat.";
  }
  activeSessions.delete(groupId);
  groupFinishCooldown.set(groupId, Date.now());
  groupWarningCooldown.delete(groupId);
  return (
    `🏳️ *Operasi Kabur Dibatalkan!*\n` +
    `Kalian memutuskan balik ke kasur masing-masing, menarik selimut sarung, dan tidur pulas sebelum ketahuan mudabbir. Besok bangun shubuh tepat waktu ya! 😇`
  );
}

/**
 * Interface keluaran AI JSON dari Gemini
 */
interface AISceneOutput {
  storyNarration: string;
  narrationSummary: string;
  stealthDelta: number;
  staminaDelta: number;
  newChapter: number;
  outcome: "CONTINUE" | "CAUGHT" | "ESCAPED";
  caughtBy?: "JASUS" | "QISM_KEAMANAN" | "RIAYAH";
  inventoryLost?: string[];
  inventoryGained?: string[];
  options: KaburOption[];
}

/**
 * Generate Scene baru secara dinamis menggunakan Gemini Resilient
 */
async function generateNextSceneWithAI(
  state: KaburGameState,
  chosenOption: KaburOption,
  actorName: string
): Promise<AISceneOutput> {
  const currentChapter = state.chapter;
  const nextTargetChapter = currentChapter < 3 ? currentChapter + 1 : currentChapter;

  const systemPrompt = `Kamu adalah Game Master RPG interaktif bertema "Kabur dari Pondok Pesantren" untuk bot WhatsApp alumni angkatan pesantren (santri).
Gayamu: Sangat detail, sinematik, kocak, bernostalgia kental dengan kehidupan santri (istilah: sarung, sandal swallow ukir, jasus, qism keamanan / mudabbir, biro ri'ayah, takzir botak, ghosob, tasreh, matbakh, wirid, rental PS).

HIERARKI ANTAGONIS PONDOK:
1. Jasus: Santri junior/cepu yang suka cari muka.
2. Qism Keamanan: Pengurus santri senior pembawa senter SWAT, sidak lorong, bawa pentungan rotan.
3. Biro Ri'ayah (FINAL BOSS): Ustadz pengasuhan, wibawa tinggi, naik motor Astrea/Grand mesin senyap tanpa lampu, hafal semua jalur tikus. Takzir: Botak 0 cm licin & bersihin selokan/bak masjid.

PANDUAN ALUR CHAPTER:
- Chapter 1: Rayon Asrama & Lorong Jemuran (Hadapi Qism Keamanan ronda).
- Chapter 2: Dapur Umum (Matbakh) & Tembok Belakang Pondok (Penuh kawat duri & pohon kersen/mangga).
- Chapter 3: Luar Tembok, Kebun Belakang, Parit Sawah & Jalan Desa (Ronda Ustadz Ri'ayah bermotor).
- Chapter 4 / Menang: Rental PS / Warkop Indomie di luar jangkauan pondok.

STATUS SEKARANG:
- Chapter: ${state.chapter}
- Stealth: ${state.stealth}%
- Stamina: ${state.stamina}%
- Inventory: ${JSON.stringify(state.inventory)}
- Riwayat Aksi: ${JSON.stringify(state.history.slice(-3))}
- Aksi Baru dari ${actorName}: Pilihan [${chosenOption.key}] (${chosenOption.label}: ${chosenOption.description})

TUGASMU:
Buat kelanjutan cerita yang dramatis dan lucu. Berikan konsekuensi dari pilihan tersebut.
JIKA aksi sangat berisiko atau stealth mendekati 0, buat mereka tertangkap (outcome: "CAUGHT").
JIKA aksi berhasil di Chapter 3 menuju Chapter 4, buat mereka lolos (outcome: "ESCAPED").
JIKA lanjut, sediakan 4 pilihan baru (A, B, C, D) yang bervariasi (ALIBI, NINJA, PARKOUR, DIPLOMASI).

KEMBALIKAN OUTPUT HARUS VALID JSON SAJA (tanpa backtick markdown \`\`\`json):
{
  "storyNarration": "narasi lengkap adegan berikutnya (3-4 paragraf seru & detail)",
  "narrationSummary": "1 kalimat rangkuman konsekuensi",
  "stealthDelta": -15 (angka negatif/positif),
  "staminaDelta": -10 (angka negatif/positif),
  "newChapter": ${nextTargetChapter},
  "outcome": "CONTINUE" | "CAUGHT" | "ESCAPED",
  "caughtBy": "QISM_KEAMANAN" | "RIAYAH" | null,
  "inventoryLost": [],
  "inventoryGained": [],
  "options": [
    { "key": "A", "label": "NAMA_AKSI", "archetype": "ALIBI", "description": "penjelasan aksi" },
    { "key": "B", "label": "NAMA_AKSI", "archetype": "NINJA", "description": "penjelasan aksi" },
    { "key": "C", "label": "NAMA_AKSI", "archetype": "PARKOUR", "description": "penjelasan aksi" },
    { "key": "D", "label": "NAMA_AKSI", "archetype": "DIPLOMASI", "description": "penjelasan aksi" }
  ]
}`;

  try {
    const payload = {
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.85,
        maxOutputTokens: 1200,
      },
    };

    const aiResponse = await callGeminiResilient(payload, undefined, "gemini-3.8-flash");
    const rawText =
      aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ||
      aiResponse?.candidates?.[0]?.text ||
      "";

    if (rawText) {
      const cleanedJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed: AISceneOutput = JSON.parse(cleanedJson);
      if (parsed.storyNarration && parsed.options && parsed.options.length === 4) {
        return parsed;
      }
    }
  } catch (err: any) {
    console.warn("[KABUR-PONDOK-AI-WARN] Gagal AI generation, menggunakan fallback:", err.message);
  }

  // Fallback Deterministic Engine jika AI lambat / error
  return generateFallbackScene(state, chosenOption);
}

/**
 * Fallback Scenarios jika API bermasalah
 */
function generateFallbackScene(state: KaburGameState, chosen: KaburOption): AISceneOutput {
  if (state.chapter === 1) {
    return {
      storyNarration:
        `Aksi kalian berhasil mengelabui Qism Keamanan sesaat! Petugas melangkah menjauh karena mengira suara gesekan hanya kucing dapur.\n\n` +
        `Kalian merayap cepat melewati lorong rayon dan berhasil tiba di area **Dapur Umum (Matbakh)**. Di hadapan kalian terbentang dinding bata merah setinggi 2,5 meter dengan kawat berduri di atasnya.\n\n` +
        `Namun masalah baru muncul: Di samping tembok, ada **Ustadz Ri'ayah** yang sedang duduk tenang di pos ronda samping sambil memegang radio panggil HT!`,
      narrationSummary: "Lolos dari rayon asrama menuju dapur umum dan tembok belakang.",
      stealthDelta: -10,
      staminaDelta: -15,
      newChapter: 2,
      outcome: "CONTINUE",
      options: [
        {
          key: "A",
          label: "PANJAT POHON KERSEN",
          archetype: "PARKOUR",
          description: "Naik lewat dahan pohon kersen yang menjuntai di atas kawat berduri.",
        },
        {
          key: "B",
          label: "TIARAP DI PARIT AIR",
          archetype: "NINJA",
          description: "Merayap di dalam parit pembuangan air dapur yang kering di bawah lampu pos.",
        },
        {
          key: "C",
          label: "DOA BISMILLAH NGEBUT",
          archetype: "ALIBI",
          description: "Lari sprint secepat kilat sambil teriak takbir berharap gak terkejar.",
        },
        {
          key: "D",
          label: "LEMPAR GAYUNG MERAH",
          archetype: "DIPLOMASI",
          description: "Lempar gayung merah ke arah gerobak sayur untuk memancing Ustadz menoleh.",
        },
      ],
    };
  }

  // Chapter 2 -> Chapter 3
  if (state.chapter === 2) {
    return {
      storyNarration:
        `Dengan kerja sama tim yang solid, kalian berhasil melompati tembok belakang tanpa tersangkut kawat berduri!\n\n` +
        `Kalian mendarat di pematang sawah berlumpur di luar komplek pondok. Bau udara bebas tercium begitu harum. Di kejauhan, terlihat lampu jalan aspal desa dan warkop.\n\n` +
        `Namun, mendadak terdengar deru mesin motor bebek tua: ***Breeem... breeem...***\n` +
        `Sebuah motor Astrea Grand melaju pelan di pematang aspal. Lampu motor dimatikan... itu adalah **Patroli Khusus Biro Ri'ayah** yang sedang menyisir batas luar pondok!`,
      narrationSummary: "Berhasil melompati tembok belakang dan sampai di pematang sawah.",
      stealthDelta: -15,
      staminaDelta: -20,
      newChapter: 3,
      outcome: "CONTINUE",
      options: [
        {
          key: "A",
          label: "TIARAP DI LUMPUR SAWAH",
          archetype: "NINJA",
          description: "Rebahkan badan ke lumpur sawah, menyatu dengan rumpun padi.",
        },
        {
          key: "B",
          label: "MENYAMAR WARGA DESA",
          archetype: "ALIBI",
          description: "Pura-pura jadi pemuda kampung yang lagi nyari belut malam-malam.",
        },
        {
          key: "C",
          label: "SPRINT MENEMBUS SEMAK",
          archetype: "PARKOUR",
          description: "Lari zig-zag memotong kebun pisang menuju jalan raya.",
        },
        {
          key: "D",
          label: "KORBANKAN SANDAL",
          archetype: "DIPLOMASI",
          description: "Tinggalkan sandal swallow di pinggir parit lalu kabur ke arah sebaliknya.",
        },
      ],
    };
  }

  // Chapter 3 -> Victory
  return {
    storyNarration:
      `Manuver terakhir kalian sangat brilian! Motor Ustadz Ri'ayah meluncur lurus mengabaikan semak tempat kalian berteduh.\n\n` +
      `Kalian keluar dari kebun pisang, merapikan sarung, dan melangkah masuk ke pintu warkop yang terang benderang. Suara stik PS beradu dan aroma mie rebus langsung menyambut kemenangan kalian!`,
    narrationSummary: "Berhasil lolos dari kejaran patroli Ri'ayah dan tiba di rental PS.",
    stealthDelta: 10,
    staminaDelta: -10,
    newChapter: 4,
    outcome: "ESCAPED",
    options: [],
  };
}

/**
 * =============================================================================
 * REGISTRI & ENKRIPSI WHATSAPP POLLING "KABUR DARI PONDOK"
 * =============================================================================
 */
export interface KaburPollTracker {
  groupId: string;
  pollMsgId: string;
  pollCreatorJid: string;
  pollEncKey?: Uint8Array;
  options: { key: "A" | "B" | "C" | "D"; label: string; text: string; hash: string }[];
}

const activePollMap = new Map<string, KaburPollTracker>();

export function registerKaburPoll(
  pollMsgId: string,
  groupId: string,
  pollCreatorJid: string,
  pollEncKey?: Uint8Array,
  options: KaburOption[] = []
): void {
  const trackedOptions = options.map((opt) => {
    const text = `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`;
    const hash = crypto.createHash("sha256").update(Buffer.from(text)).digest("hex");
    return {
      key: opt.key,
      label: opt.label,
      text,
      hash,
    };
  });

  activePollMap.set(pollMsgId, {
    groupId,
    pollMsgId,
    pollCreatorJid,
    pollEncKey,
    options: trackedOptions,
  });
}

export function findOptionKeyByHash(pollMsgId: string, optionHashHex: string): "A" | "B" | "C" | "D" | null {
  const tracker = activePollMap.get(pollMsgId);
  if (!tracker) return null;
  const match = tracker.options.find((o) => o.hash.toLowerCase() === optionHashHex.toLowerCase());
  return match ? match.key : null;
}

export function getActiveKaburPoll(pollMsgId: string): KaburPollTracker | undefined {
  return activePollMap.get(pollMsgId);
}

