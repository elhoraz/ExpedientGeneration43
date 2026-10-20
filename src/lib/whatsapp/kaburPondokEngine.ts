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
  status: "idle" | "lobby" | "active" | "escaped" | "caught";
  chapter: number; // 0: Lobby/Briefing, 1: Rayon Asrama, 2: Dapur & Tembok Belakang, 3: Luar Pagar, 4: Rental PS
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
  isProcessing?: boolean; // Mutex lock untuk mencegah klik beruntun / race condition saat AI generate
  turnTimer?: NodeJS.Timeout; // Timer 1 menit otomatis untuk auto-expire
}

// In-Memory store per group
const activeSessions = new Map<string, KaburGameState>();

// Durasi timeout sesi (1 menit tanpa ada yang memilih = auto close & kedaluwarsa)
export const SESSION_TIMEOUT_MS = 60 * 1000;

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
export type KaburExpireCallback = (groupId: string, message: string) => Promise<void> | void;
let kaburExpireHandler: KaburExpireCallback | null = null;

export function setKaburExpireHandler(handler: KaburExpireCallback): void {
  kaburExpireHandler = handler;
}

export function armKaburTurnTimer(groupId: string): void {
  const session = activeSessions.get(groupId);
  if (!session) return;
  if (session.turnTimer) {
    clearTimeout(session.turnTimer);
    session.turnTimer = undefined;
  }

  session.turnTimer = setTimeout(async () => {
    const s = activeSessions.get(groupId);
    if (s && (s.status === "active" || s.status === "lobby")) {
      activeSessions.delete(groupId);
      groupFinishCooldown.set(groupId, Date.now());
      if (kaburExpireHandler) {
        try {
          await kaburExpireHandler(
            groupId,
            `⌛ *WAKTU HABIS (1 MENIT KEDALUWARSA)!* 🌙\n\n` +
            `Karena tim santri kelamaan hening berbisik dan ragu-ragu menentukan langkah selama 60 detik:\n` +
            `_Kalian ketiduran di lantai lorong sampai adzan Subuh berkumandang! Operasi kabur malam ini resmi gagal._ 😴\n\n` +
            `Ketik *!kabur* kapan saja untuk mengulang misi baru bareng anak-anak grup!`
          );
        } catch (_) {}
      }
    }
  }, 60 * 1000);
}

export function clearKaburTurnTimer(groupId: string): void {
  const session = activeSessions.get(groupId);
  if (session?.turnTimer) {
    clearTimeout(session.turnTimer);
    session.turnTimer = undefined;
  }
}

export function removeKaburPoll(pollMsgId: string): void {
  activePollMap.delete(pollMsgId);
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

export const LOBBY_OPTIONS: KaburOption[] = [
  {
    key: "A",
    label: "GAS MULAI MISI",
    archetype: "PARKOUR",
    description: "Bismillah, masuki Chapter 1 dan mulai menyelinap keluar asrama!",
  },
  {
    key: "B",
    label: "TIPS SURVIVAL",
    archetype: "ALIBI",
    description: "Pelajari hierarki musuh (Jasus, Keamanan, Ri'ayah) dan fungsi bekal santri.",
  },
  {
    key: "C",
    label: "BATALKAN OPERASI",
    archetype: "DIPLOMASI",
    description: "Tidur nyenyak di kasur asrama, takut digundul licin 0 cm.",
  },
];

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

  // 3. Cek Game yang Sedang Aktif / Sedang di Lobby (dengan proteksi Anti-Spam Warning)
  const existing = activeSessions.get(groupId);
  if (existing && (existing.status === "active" || existing.status === "lobby") && now - existing.lastUpdatedAt < SESSION_TIMEOUT_MS) {
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

    if (existing.status === "lobby") {
      return {
        success: false,
        silent: false,
        message:
          `📢 *Misi Kabur sudah disiapkan oleh sahabat ${existing.starterName}!* 🏃‍♂️💨\n\n` +
          `Kalian saat ini ada di ruang *Briefing & Instruksi*.\n` +
          `Silakan klik tombol *🚀 [BISMILLAH] Gas Mulai Misi!* pada Polling di atas atau balas dengan huruf *A* untuk mulai Chapter 1!`,
      };
    }

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
    status: "lobby",
    chapter: 0,
    stealth: 100,
    stamina: 100,
    inventory: [...DEFAULT_INVENTORY],
    history: ["Misi diinisiasi di ruang briefing asrama."],
    lastStory: "Briefing dan Instruksi Misi Kabur dari Pondok",
    lastOptions: LOBBY_OPTIONS,
    starterName: senderName || "Sahabat Santri",
    startedAt: now,
    lastUpdatedAt: now,
  };

  activeSessions.set(groupId, newState);
  armKaburTurnTimer(groupId);

  const message =
    `🎮 *[MINI-GAME ALUMNI: OPERASI KABUR DARI PONDOK]* 🏃‍♂️💨\n\n` +
    `📢 _Diinisiasi oleh sahabat: *${senderName}*_\n\n` +
    `*APAAN NIH MIN? KOK TIBA-TIBA MUNCUL?*\n` +
    `Tenang sahabat! Ini game petualangan interaktif santai buat seru-seruan bareng di grup alumni. Seluruh anggota grup ini resmi menjadi *Satu Tim Santri* yang punya misi menyelinap keluar asrama malam-malam demi seporsi *Indomie Dok-dok & Rental PS* di luar komplek pondok! 🍜🎮\n\n` +
    `📜 *CARA BERMAIN (GAMPANG BANGET):*\n` +
    `1. Bot bakal ngirim adegan cerita seru dan situasi darurat santri per babak.\n` +
    `2. *Siapa saja di grup bebas memilih:* Tinggal *klik/tap tombol Polling WhatsApp* di bawah (atau balas huruf A, B, C, D).\n` +
    `3. ⏳ *BATAS WAKTU 1 MENIT:* Tim punya waktu *60 detik* untuk menentukan langkah! Jika 1 menit hening tanpa ada yang memilih, misi otomatis *KEDALUWARSA & BATAL*!\n` +
    `4. Awas jangan sampai terciduk:\n` +
    `   • 🕵️ *Jasus Santri:* Cepu junior yang suka ngintip jemuran.\n` +
    `   • 🔦 *Qism Keamanan:* Pengurus ronda pembawa senter SWAT & rotan.\n` +
    `   • 🛵 *Biro Ri'ayah (Final Boss):* Ustadz pengasuhan bermotor senyap (Hukuman: Digundul licin 0 cm & kuras bak masjid! 😱)\n\n` +
    `🎒 *Bawaan Awal Tim:* Gayung Merah Sakti, Sarung Samarinda, Sandal Swallow Ukir Silet, Uang Kas Rp 25.000.\n\n` +
    `═══════════════════════════\n` +
    `⚡ *Kalian sudah siap memulai petualangan ini?*\n` +
    `_Klik Polling di bawah atau ketik *A* sekarang! (Waktu: 60 Detik)_`;

  const poll: KaburPollPayload = {
    name: "⚡ KONFIRMASI TIM SANTRI (KABUR DARI PONDOK):",
    values: [
      "🚀 [BISMILLAH] Gas Mulai Misi! (Masuk Ch. 1)",
      "📖 [TIPS SURVIVAL] Cara Selamat dari Ri'ayah",
      "🏳️ [BATAL] Tidur Aja Takut Digundul Licin",
    ],
    options: LOBBY_OPTIONS,
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
  if (!session || (session.status !== "active" && session.status !== "lobby")) return { handled: false };

  // Cegah race condition / double execution saat AI masih berpikir
  if (session.isProcessing) {
    return { handled: false };
  }

  // Cek timeout sesi (60 detik)
  if (Date.now() - session.lastUpdatedAt > SESSION_TIMEOUT_MS) {
    clearKaburTurnTimer(groupId);
    activeSessions.delete(groupId);
    groupFinishCooldown.set(groupId, Date.now());
    return {
      handled: true,
      replyText: `⌛ *WAKTU HABIS (1 MENIT KEDALUWARSA)!* 🌙\nKarena tim santri kelamaan hening berbisik dan tidak ada yang menentukan langkah selama 60 detik, kalian ketiduran di lantai lorong sampai adzan Subuh berkumandang! Operasi kabur malam ini resmi gagal. Ketik *!kabur* untuk coba lagi!`,
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

  // KUNCI SESI (MUTEX) & MATIKAN TIMER SEBELUMNYA
  session.isProcessing = true;
  clearKaburTurnTimer(groupId);

  try {
    // =========================================================================
    // PENANGANAN RESPON DI RUANG LOBBY / BRIEFING
    // =========================================================================
    if (session.status === "lobby") {
      // 1. Opsi A: Gas Mulai Misi (Masuk ke Chapter 1)
      if (selectedKey === "A") {
        session.status = "active";
        session.chapter = 1;
        session.stealth = 100;
        session.stamina = 100;
        session.lastStory = CHAPTER_1_PRESET.story;
        session.lastOptions = CHAPTER_1_PRESET.options;
        session.history = ["Misi resmi dimulai dari kamar rayon malam hari, berhadapan dengan patroli Qism Keamanan."];
        session.lastUpdatedAt = Date.now();
        session.lastActorName = senderName;

        const optionsText = CHAPTER_1_PRESET.options
          .map((opt) => `*${opt.key}.* 🏷️ *[${opt.label}]*\n   ${opt.description}`)
          .join("\n\n");

        const replyText =
          `📢 *TAKBIR! Sahabat ${senderName} memimpin tim santri memulai operasi kabur!*\n\n` +
          `${CHAPTER_1_PRESET.story}\n\n` +
          `${formatStatusBar(session)}\n\n` +
          `═══════════════════════════\n` +
          `⚡ *TENTUKAN LANGKAH PERTAMA (CHAPTER 1):* ⚡\n\n` +
          `${optionsText}\n\n` +
          `⏳ *Batas Waktu: 60 Detik* (Jika hening 1 menit, misi kedaluwarsa!)\n` +
          `🗳️ *Pilih langkah tim lewat Polling di bawah atau balas dengan A, B, C, atau D!*`;

        const poll: KaburPollPayload = {
          name: `⚡ LANGKAH TIM SANTRI (CH. 1):`,
          values: CHAPTER_1_PRESET.options.map(
            (opt) => `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`
          ),
          options: CHAPTER_1_PRESET.options,
        };

        armKaburTurnTimer(groupId);
        return { handled: true, replyText, poll };
      }

      // 2. Opsi B: Panduan Survival & Bekal Santri
      if (selectedKey === "B") {
        session.lastUpdatedAt = Date.now();
        session.lastOptions = [LOBBY_OPTIONS[0], LOBBY_OPTIONS[2]];
        const tipsText =
          `📖 *[BUKU PANDUAN SURVIVAL KABUR DARI PONDOK]* 🎒\n\n` +
          `1. 🤫 *Stealth (Ketenangan):* Jaga jangan sampai 0%! Kalau 0%, kalian langsung ketangkap dan digundul licin.\n` +
          `2. ⚡ *Stamina:* Berkurang tiap panjat tembok / lari sprint. Bisa dihemat lewat taktik cerdik.\n` +
          `3. 🔴 *Gayung Merah Sakti:* Senjata alibi legendaris! Kalau ketemu mudabbir, pura-pura mules mau ke kamar mandi.\n` +
          `4. 🧣 *Sarung Samarinda:* Bisa dipakai nyaru jadi jemuran sarung basah atau tali panjat kawat duri.\n` +
          `5. 🩴 *Sandal Swallow Ukir:* Awas dighosob santri lain! Kalau hilang, lari nyeker bikin stamina jebol.\n` +
          `6. 🛵 *Radar Ri'ayah:* Ustadz pengasuhan suka ronda malam naik Astrea Grand mesin senyap tanpa lampu!\n\n` +
          `⏳ *Batas Waktu:* 60 Detik untuk menentukan konfirmasi!\n` +
          `_Sudah paham taktiknya? Klik Polling di bawah untuk langsung Gas Mulai!_ 🏃‍♂️💨`;

        const poll: KaburPollPayload = {
          name: "⚡ KONFIRMASI TIM SANTRI (KABUR DARI PONDOK):",
          values: [
            "🚀 [BISMILLAH] Gas Mulai Misi! (Masuk Ch. 1)",
            "🏳️ [BATAL] Tidur Aja Takut Digundul Licin",
          ],
          options: [LOBBY_OPTIONS[0], LOBBY_OPTIONS[2]],
        };

        armKaburTurnTimer(groupId);
        return { handled: true, replyText: tipsText, poll };
      }

      // 3. Opsi C: Batalkan
      if (selectedKey === "C") {
        clearKaburTurnTimer(groupId);
        activeSessions.delete(groupId);
        groupFinishCooldown.set(groupId, Date.now());
        groupWarningCooldown.delete(groupId);
        return {
          handled: true,
          replyText: `🏳️ *Misi Dibatalkan oleh Sahabat ${senderName}!*\nKalian memilih tidur pulas di kasur rayon masing-masing demi keselamatan rambut. Besok bangun shubuh tepat waktu ya! 😇`,
        };
      }

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
      clearKaburTurnTimer(groupId);
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
      clearKaburTurnTimer(groupId);
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

    const replyText =
      `📢 *Aksi Diterima dari Sahabat ${senderName}: [${chosenOption.key} - ${chosenOption.label}]*\n\n` +
      `${nextScene.storyNarration}\n\n` +
      `${formatStatusBar(session)}\n\n` +
      `═══════════════════════════\n` +
      `⏳ *Batas Waktu: 60 Detik* (Jika hening 1 menit, misi otomatis kedaluwarsa!)\n` +
      `💬 *Balas dengan Polling di bawah atau ketik A, B, C, D untuk lanjut!*`;

    const poll: KaburPollPayload = {
      name: `⚡ LANGKAH TIM SANTRI (CH. ${session.chapter}):`,
      values: nextScene.options.map(
        (opt) =>
          `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`
      ),
      options: nextScene.options,
    };

    armKaburTurnTimer(groupId);
    return { handled: true, replyText, poll };
  } finally {
    session.isProcessing = false;
  }
}

/**
 * Status permainan saat ini
 */
export function getKaburGameStatus(groupId: string): string {
  const session = activeSessions.get(groupId);
  if (!session || (session.status !== "active" && session.status !== "lobby")) {
    return (
      `🛌 *Tidak ada operasi kabur yang sedang berjalan!*\n\n` +
      `Asrama sedang aman dan damai. Ingin memulai misi kabur menembus penjagaan Qism Keamanan & Ri'ayah?\n\n` +
      `👉 Ketik *!kabur* untuk memulai petualangan seru ini!`
    );
  }

  if (session.status === "lobby") {
    return (
      `🎮 *MISI KABUR DARI PONDOK (STATUS: LOBBY & BRIEFING)* 🏃‍♂️💨\n\n` +
      `📢 _Diinisiasi oleh sahabat: *${session.starterName}*_\n\n` +
      `Seluruh tim sedang berada di ruang briefing asrama sebelum turun ke lorong.\n` +
      `👉 Silakan klik tombol *🚀 [BISMILLAH] Gas Mulai Misi!* di Polling atau balas dengan huruf *A* untuk mulai Chapter 1!`
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
  clearKaburTurnTimer(groupId);
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
  pollCreatorLid?: string;
  pollEncKey?: Uint8Array;
  options: { key: "A" | "B" | "C" | "D"; label: string; text: string; hashes: string[] }[];
}

const activePollMap = new Map<string, KaburPollTracker>();

export function registerKaburPoll(
  pollMsgId: string,
  groupId: string,
  pollCreatorJid: string,
  pollEncKey?: Uint8Array,
  options: KaburOption[] = [],
  pollValues: string[] = [],
  pollCreatorLid?: string
): void {
  const trackedOptions = options.map((opt, idx) => {
    const rawValue = pollValues[idx] || "";
    const constructedText = `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`;

    const hashes: string[] = [];
    if (rawValue) {
      hashes.push(crypto.createHash("sha256").update(Buffer.from(rawValue)).digest("hex").toLowerCase());
      hashes.push(crypto.createHash("sha256").update(Buffer.from(rawValue.trim())).digest("hex").toLowerCase());
    }
    hashes.push(crypto.createHash("sha256").update(Buffer.from(constructedText)).digest("hex").toLowerCase());
    hashes.push(crypto.createHash("sha256").update(Buffer.from(constructedText.trim())).digest("hex").toLowerCase());

    return {
      key: opt.key,
      label: opt.label,
      text: rawValue || constructedText,
      hashes,
    };
  });

  activePollMap.set(pollMsgId, {
    groupId,
    pollMsgId,
    pollCreatorJid,
    pollCreatorLid,
    pollEncKey,
    options: trackedOptions,
  });
}

export function findOptionKeyByHash(pollMsgId: string, optionHashHex: string): "A" | "B" | "C" | "D" | null {
  const tracker = activePollMap.get(pollMsgId);
  if (!tracker) return null;
  const target = optionHashHex.toLowerCase();
  const match = tracker.options.find((o) => o.hashes.includes(target));
  return match ? match.key : null;
}

export function getActiveKaburPoll(pollMsgId: string): KaburPollTracker | undefined {
  return activePollMap.get(pollMsgId);
}

