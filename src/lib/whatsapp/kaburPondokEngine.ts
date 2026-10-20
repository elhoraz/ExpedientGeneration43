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

export interface KaburVoteRecord {
  voterId: string;
  voterName: string;
  optionKey: "A" | "B" | "C" | "D";
  timestamp: number;
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
  isProcessing?: boolean; // Mutex lock untuk mencegah race condition saat AI generate
  inactivityTimer?: NodeJS.Timeout; // Timer 3 menit jika belum ada suara sama sekali
  votingTimer?: NodeJS.Timeout;     // Timer 1 menit voting begitu suara pertama masuk
  votingStartedAt?: number;         // Timestamp voting dimulai
  votes: Map<string, KaburVoteRecord>; // Kumpulan suara santri di turn ini (voterId -> vote)
}

// In-Memory store per group
const activeSessions = new Map<string, KaburGameState>();

// Aturan Waktu Baru Sesuai Permintaan User:
export const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 menit jika belum ada yang memilih sama sekali -> EXPIRED
export const VOTING_WINDOW_MS = 60 * 1000;         // 1 menit window voting begitu suara pertama masuk -> HITUNG TERBANYAK
export const SESSION_TIMEOUT_MS = INACTIVITY_TIMEOUT_MS;

// Anti-Spam & Cooldown Maps
const groupWarningCooldown = new Map<string, number>(); // groupId -> timestamp last warning sent
const groupFinishCooldown = new Map<string, number>(); // groupId -> timestamp last game ended
const userSpamThrottle = new Map<string, { count: number; windowStart: number; blockedUntil: number }>();

export const WARNING_COOLDOWN_MS = 25 * 1000; // 25s cooldown before repeating "Game sudah aktif"
export const RESTART_COOLDOWN_MS = 15 * 1000; // 15s cooldown after game ends before restarting

export type KaburSendCallback = (
  groupId: string,
  replyText: string,
  poll?: KaburPollPayload
) => Promise<void> | void;

let kaburMessenger: KaburSendCallback | null = null;

export function setKaburMessenger(handler: KaburSendCallback): void {
  kaburMessenger = handler;
}

export function setKaburExpireHandler(handler: (groupId: string, message: string) => Promise<void> | void): void {
  kaburMessenger = async (groupId, text) => {
    await handler(groupId, text);
  };
}

export function clearAllKaburTimers(session: KaburGameState): void {
  if (session.inactivityTimer) {
    clearTimeout(session.inactivityTimer);
    session.inactivityTimer = undefined;
  }
  if (session.votingTimer) {
    clearTimeout(session.votingTimer);
    session.votingTimer = undefined;
  }
}

export function armInactivityTimer(groupId: string): void {
  const session = activeSessions.get(groupId);
  if (!session) return;
  clearAllKaburTimers(session);

  session.inactivityTimer = setTimeout(async () => {
    const s = activeSessions.get(groupId);
    if (s && (s.status === "active" || s.status === "lobby")) {
      clearAllKaburTimers(s);
      activeSessions.delete(groupId);
      clearKaburPollsForGroup(groupId);
      groupFinishCooldown.set(groupId, Date.now());
      if (kaburMessenger) {
        try {
          await kaburMessenger(
            groupId,
            `⌛ *WAKTU HABIS (3 MENIT KEDALUWARSA)!* 🌙\n\n` +
            `Karena tidak ada santri yang mengambil keputusan selama 3 menit:\n` +
            `_Kalian ketiduran di lantai asrama dan patroli subuh keburu tiba! Operasi kabur malam ini resmi dibatalkan._ 😴\n\n` +
            `Ketik *!kabur* kapan saja untuk mengulang misi baru bareng anak-anak grup!`
          );
        } catch (_) {}
      }
    }
  }, INACTIVITY_TIMEOUT_MS);
}

export function armVotingTimer(groupId: string): void {
  const session = activeSessions.get(groupId);
  if (!session) return;
  if (session.votingTimer) {
    clearTimeout(session.votingTimer);
    session.votingTimer = undefined;
  }

  session.votingTimer = setTimeout(async () => {
    await resolveKaburTurn(groupId);
  }, VOTING_WINDOW_MS);
}

export function armKaburTurnTimer(groupId: string): void {
  armInactivityTimer(groupId);
}

export function clearKaburTurnTimer(groupId: string): void {
  const session = activeSessions.get(groupId);
  if (session) clearAllKaburTimers(session);
}

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

  // 3. Cek Game yang Sedang Aktif / Sedang di Lobby
  const existing = activeSessions.get(groupId);
  if (existing && (existing.status === "active" || existing.status === "lobby") && now - existing.lastUpdatedAt < INACTIVITY_TIMEOUT_MS) {
    const lastWarning = groupWarningCooldown.get(groupId) || 0;
    if (now - lastWarning < WARNING_COOLDOWN_MS) {
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
        `Ketik *!kabur status* untuk melihat kondisi terakhir atau langsung pilih di Polling!\n` +
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
    votes: new Map(),
  };

  activeSessions.set(groupId, newState);
  armInactivityTimer(groupId);

  const message =
    `🎮 *[MINI-GAME ALUMNI: OPERASI KABUR DARI PONDOK]* 🏃‍♂️💨\n\n` +
    `📢 _Diinisiasi oleh sahabat: *${senderName}*_\n\n` +
    `*APAAN NIH MIN? KOK TIBA-TIBA MUNCUL?*\n` +
    `Tenang sahabat! Ini game petualangan interaktif santai buat seru-seruan bareng di grup alumni. Seluruh anggota grup ini resmi menjadi *Satu Tim Santri* yang punya misi menyelinap keluar asrama malam-malam demi seporsi *Indomie Dok-dok & Rental PS* di luar komplek pondok! 🍜🎮\n\n` +
    `📜 *CARA BERMAIN & ATURAN VOTING:*\n` +
    `1. Bot bakal ngirim adegan cerita seru dan situasi darurat santri per babak.\n` +
    `2. ⏳ *Batas Waktu Menunggu: 3 Menit!* Jika dalam 3 menit tidak ada yang memilih sama sekali, misi otomatis *KEDALUWARSA & BATAL*!\n` +
    `3. ⏱️ *Voting Tim (1 Menit):* Begitu ada suara pertama masuk, countdown voting *1 MENIT* resmi dimulai!\n` +
    `4. 🔒 *Kunci Pilihan:* Pilihan yang sudah diklik *TIDAK BISA DIUBAH* lagi. Setelah 1 menit selesai, bot akan mengambil keputusan berdasarkan **SUARA TERBANYAK**!\n` +
    `5. Awas jangan sampai terciduk:\n` +
    `   • 🕵️ *Jasus Santri:* Cepu junior yang suka ngintip jemuran.\n` +
    `   • 🔦 *Qism Keamanan:* Pengurus ronda pembawa senter SWAT & rotan.\n` +
    `   • 🛵 *Biro Ri'ayah (Final Boss):* Ustadz pengasuhan bermotor senyap (Hukuman: Digundul licin 0 cm & kuras bak masjid! 😱)\n\n` +
    `🎒 *Bawaan Awal Tim:* Gayung Merah Sakti, Sarung Samarinda, Sandal Swallow Ukir Silet, Uang Kas Rp 25.000.\n\n` +
    `═══════════════════════════\n` +
    `⚡ *Kalian sudah siap memulai petualangan ini?*\n` +
    `_Klik Polling di bawah atau ketik *A*! (Batas Menunggu: 3 Menit)_`;

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
 * Mencatat suara santri dalam window voting 1 menit (tidak boleh ganti opsi)
 */
export function recordKaburVote(
  groupId: string,
  rawInput: string,
  voterId: string,
  voterName: string
): {
  recorded: boolean;
  firstVote?: boolean;
  alreadyVoted?: boolean;
  currentChoice?: string;
  message?: string;
} {
  const session = activeSessions.get(groupId);
  if (!session || (session.status !== "active" && session.status !== "lobby")) {
    return { recorded: false };
  }

  if (session.isProcessing) {
    return { recorded: false };
  }

  // Normalisasi input
  const clean = rawInput.trim().toUpperCase();
  let selectedKey: "A" | "B" | "C" | "D" | null = null;

  if (clean === "A" || clean === "🅰️" || clean.startsWith("A.") || clean.startsWith("A ")) selectedKey = "A";
  else if (clean === "B" || clean === "🅱️" || clean.startsWith("B.") || clean.startsWith("B ")) selectedKey = "B";
  else if (clean === "C" || clean === "🅲" || clean.startsWith("C.") || clean.startsWith("C ")) selectedKey = "C";
  else if (clean === "D" || clean === "🅳" || clean.startsWith("D.") || clean.startsWith("D ")) selectedKey = "D";

  if (!selectedKey) {
    return { recorded: false };
  }

  const chosenOption = session.lastOptions.find((o) => o.key === selectedKey);
  if (!chosenOption) {
    return { recorded: false };
  }

  // Cek apakah voter sudah pernah memilih sebelumnya (GAK BOLEH GANTI OPSI)
  const cleanVoterId = voterId.replace(/:\d+@/, "@");
  if (session.votes.has(cleanVoterId)) {
    const existing = session.votes.get(cleanVoterId)!;
    return {
      recorded: false,
      alreadyVoted: true,
      currentChoice: existing.optionKey,
    };
  }

  // Simpan suara
  session.votes.set(cleanVoterId, {
    voterId: cleanVoterId,
    voterName,
    optionKey: selectedKey,
    timestamp: Date.now(),
  });
  session.lastUpdatedAt = Date.now();

  // Jika ini suara pertama di babak ini:
  // Matikan timer 3 menit inactivity dan nyalakan timer 1 menit voting window!
  if (session.votes.size === 1) {
    if (session.inactivityTimer) {
      clearTimeout(session.inactivityTimer);
      session.inactivityTimer = undefined;
    }
    session.votingStartedAt = Date.now();
    armVotingTimer(groupId);

    const message =
      `🗳️ *VOTING TIM SANTRI RESMI DIMULAI!* ⏱️\n\n` +
      `Sahabat *${voterName}* telah memberikan suara pertama untuk opsi:\n` +
      `👉 *[${selectedKey}. ${chosenOption.label}]*\n\n` +
      `⏳ *WAKTU VOTING: 1 MENIT (60 Detik)* bagi seluruh santri di grup untuk menentukan suara terbanyak di Polling!\n\n` +
      `📌 _Catatan: Pilihan tidak dapat diubah setelah diklik. Bot akan mengambil keputusan berdasarkan suara terbanyak setelah waktu 1 menit habis!_`;

    return {
      recorded: true,
      firstVote: true,
      message,
    };
  }

  return {
    recorded: true,
    firstVote: false,
  };
}

/**
 * Eksekusi giliran setelah timer voting 1 menit habis (Hitung Suara Terbanyak)
 */
export async function resolveKaburTurn(groupId: string): Promise<void> {
  const session = activeSessions.get(groupId);
  if (!session || (session.status !== "active" && session.status !== "lobby")) return;
  if (session.isProcessing) return;

  session.isProcessing = true;
  clearAllKaburTimers(session);

  try {
    if (session.votes.size === 0) {
      // Tidak ada suara sama sekali
      activeSessions.delete(groupId);
      clearKaburPollsForGroup(groupId);
      groupFinishCooldown.set(groupId, Date.now());
      if (kaburMessenger) {
        await kaburMessenger(
          groupId,
          `⌛ *WAKTU HABIS!* Tidak ada suara yang masuk. Operasi kabur dibatalkan.`
        );
      }
      return;
    }

    // 1. Rekapitulasi perolehan suara
    const tally: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const votersPerOption: Record<string, string[]> = { A: [], B: [], C: [], D: [] };

    for (const vote of session.votes.values()) {
      tally[vote.optionKey] = (tally[vote.optionKey] || 0) + 1;
      votersPerOption[vote.optionKey].push(vote.voterName);
    }

    // Cari suara terbanyak (jika seri, prioritaskan yang mendapat vote lebih awal)
    let maxVotes = -1;
    let winningKey: "A" | "B" | "C" | "D" = "A";

    for (const opt of session.lastOptions) {
      const count = tally[opt.key] || 0;
      if (count > maxVotes) {
        maxVotes = count;
        winningKey = opt.key;
      }
    }

    const winningOption = session.lastOptions.find((o) => o.key === winningKey) || session.lastOptions[0];

    // Format rekap perolehan suara
    const tallyLines = session.lastOptions.map((opt) => {
      const count = tally[opt.key] || 0;
      const voters = votersPerOption[opt.key]?.length
        ? ` _(${votersPerOption[opt.key].join(", ")})_`
        : "";
      return `• *${opt.key}* [${opt.label}]: *${count} suara*${voters}`;
    }).join("\n");

    const headerText =
      `📊 *[HASIL VOTING TIM SANTRI (1 MENIT)]* 🗳️\n\n` +
      `${tallyLines}\n\n` +
      `👉 *Keputusan Terpilih (Suara Terbanyak):*\n` +
      `🎯 *[${winningOption.key}. ${winningOption.label}]*\n` +
      `═══════════════════════════\n\n`;

    // 2. Cabang Ruang LOBBY
    if (session.status === "lobby") {
      if (winningOption.key === "A") {
        session.status = "active";
        session.chapter = 1;
        session.stealth = 100;
        session.stamina = 100;
        session.lastStory = CHAPTER_1_PRESET.story;
        session.lastOptions = CHAPTER_1_PRESET.options;
        session.history = ["Misi resmi dimulai dari kamar rayon malam hari, berhadapan dengan patroli Qism Keamanan."];
        session.lastUpdatedAt = Date.now();
        session.votes.clear();

        const optionsText = CHAPTER_1_PRESET.options
          .map((opt) => `*${opt.key}.* 🏷️ *[${opt.label}]*\n   ${opt.description}`)
          .join("\n\n");

        const replyText =
          `${headerText}` +
          `📢 *TAKBIR! Suara terbanyak tim santri memutuskan untuk langsung gas misi!*\n\n` +
          `${CHAPTER_1_PRESET.story}\n\n` +
          `${formatStatusBar(session)}\n\n` +
          `═══════════════════════════\n` +
          `⚡ *TENTUKAN LANGKAH PERTAMA (CHAPTER 1):* ⚡\n\n` +
          `${optionsText}\n\n` +
          `⏳ *Batas Waktu: 3 Menit* (Voting 1 menit akan dimulai setelah ada suara pertama!)\n` +
          `🗳️ *Pilih langkah tim lewat Polling di bawah atau balas huruf A, B, C, D!*`;

        const poll: KaburPollPayload = {
          name: `⚡ LANGKAH TIM SANTRI (CH. 1):`,
          values: CHAPTER_1_PRESET.options.map(
            (opt) => `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`
          ),
          options: CHAPTER_1_PRESET.options,
        };

        armInactivityTimer(groupId);
        if (kaburMessenger) await kaburMessenger(groupId, replyText, poll);
        return;
      }

      if (winningOption.key === "B") {
        session.lastUpdatedAt = Date.now();
        session.lastOptions = [LOBBY_OPTIONS[0], LOBBY_OPTIONS[2]];
        session.votes.clear();

        const tipsText =
          `${headerText}` +
          `📖 *[BUKU PANDUAN SURVIVAL KABUR DARI PONDOK]* 🎒\n\n` +
          `1. 🤫 *Stealth (Ketenangan):* Jaga jangan sampai 0%! Kalau 0%, kalian langsung ketangkap dan digundul licin.\n` +
          `2. ⚡ *Stamina:* Berkurang tiap panjat tembok / lari sprint. Bisa dihemat lewat taktik cerdik.\n` +
          `3. 🔴 *Gayung Merah Sakti:* Senjata alibi legendaris! Kalau ketemu mudabbir, pura-pura mules mau ke kamar mandi.\n` +
          `4. 🧣 *Sarung Samarinda:* Bisa dipakai nyaru jadi jemuran sarung basah atau tali panjat kawat duri.\n` +
          `5. 🩴 *Sandal Swallow Ukir:* Awas dighosob santri lain! Kalau hilang, lari nyeker bikin stamina jebol.\n` +
          `6. 🛵 *Radar Ri'ayah:* Ustadz pengasuhan suka ronda malam naik Astrea Grand mesin senyap tanpa lampu!\n\n` +
          `⏳ *Batas Waktu: 3 Menit*\n` +
          `_Sudah paham taktiknya? Klik Polling di bawah untuk langsung Gas Mulai!_ 🏃‍♂️💨`;

        const poll: KaburPollPayload = {
          name: "⚡ KONFIRMASI TIM SANTRI (KABUR DARI PONDOK):",
          values: [
            "🚀 [BISMILLAH] Gas Mulai Misi! (Masuk Ch. 1)",
            "🏳️ [BATAL] Tidur Aja Takut Digundul Licin",
          ],
          options: [LOBBY_OPTIONS[0], LOBBY_OPTIONS[2]],
        };

        armInactivityTimer(groupId);
        if (kaburMessenger) await kaburMessenger(groupId, tipsText, poll);
        return;
      }

      // Winning key is C (Batal)
      activeSessions.delete(groupId);
      clearKaburPollsForGroup(groupId);
      groupFinishCooldown.set(groupId, Date.now());
      groupWarningCooldown.delete(groupId);
      const cancelText =
        `${headerText}` +
        `🏳️ *Misi Dibatalkan oleh Suara Terbanyak Tim Santri!*\n` +
        `Kalian memilih tidur pulas di kasur rayon masing-masing demi keselamatan rambut. Besok bangun shubuh tepat waktu ya! 😇`;
      if (kaburMessenger) await kaburMessenger(groupId, cancelText);
      return;
    }

    // 3. Cabang Game Aktif (Chapter 1, 2, 3) -> Generate AI Scene
    const nextScene = await generateNextSceneWithAI(
      session,
      winningOption,
      `Suara Terbanyak (${maxVotes} santri)`
    );

    session.chapter = nextScene.newChapter;
    session.stealth = Math.max(0, Math.min(100, session.stealth + nextScene.stealthDelta));
    session.stamina = Math.max(0, Math.min(100, session.stamina + nextScene.staminaDelta));
    session.lastUpdatedAt = Date.now();
    session.votes.clear();

    if (nextScene.inventoryLost) {
      session.inventory = session.inventory.filter((item) => !nextScene.inventoryLost?.includes(item));
    }
    if (nextScene.inventoryGained) {
      session.inventory.push(...nextScene.inventoryGained);
    }

    session.history.push(`[Ch.${session.chapter}] Tim memilih [${winningOption.key} - ${winningOption.label}]: ${nextScene.narrationSummary}`);

    // Cek Kondisi Kalah (Tertangkap)
    if (session.stealth <= 0 || nextScene.outcome === "CAUGHT") {
      session.status = "caught";
      session.caughtBy = nextScene.caughtBy || (session.chapter >= 3 ? "RIAYAH" : "QISM_KEAMANAN");
      activeSessions.delete(groupId);
      clearKaburPollsForGroup(groupId);
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

      const finalReply =
        `${headerText}` +
        `${nextScene.storyNarration}\n\n` +
        `═══════════════════════════\n` +
        `${takzirMessage}`;
      if (kaburMessenger) await kaburMessenger(groupId, finalReply);
      return;
    }

    // Cek Kondisi Menang (Berhasil Lolos ke Rental PS / Warkop)
    if (session.chapter >= 4 || nextScene.outcome === "ESCAPED") {
      session.status = "escaped";
      activeSessions.delete(groupId);
      clearKaburPollsForGroup(groupId);
      groupFinishCooldown.set(groupId, Date.now());
      groupWarningCooldown.delete(groupId);

      const victoryMessage =
        `🎉🏆 *MISI KABUR DARI PONDOK BERHASIL TOTAL!* 🏆🎉\n\n` +
        `Kalian melompati parit sawah terakhir dan mendadak terdengar alunan musik dari warung kopi dan gemerlap lampu neon rental PS!\n\n` +
        `Kalian duduk santai di bangku kayu panjang warkop, memesan satu porsi *Indomie Kuah Kari Dobel Telor + Es Teh Manis Jumbo*, sambil nonton pertandingan bola liga Inggris dan mabar PES!\n\n` +
        `🎒 *Sisa Bawaan:* ${session.inventory.join(", ")}\n` +
        `🤫 *Sisa Stealth:* ${session.stealth}% | ⚡ *Stamina:* ${session.stamina}%\n\n` +
        `_Selamat rekan-rekan! Angkatan kalian resmi menorehkan legenda baru di asrama!_ 🎮🍜`;

      const finalReply =
        `${headerText}` +
        `${nextScene.storyNarration}\n\n` +
        `═══════════════════════════\n` +
        `${victoryMessage}`;
      if (kaburMessenger) await kaburMessenger(groupId, finalReply);
      return;
    }

    // Lanjut ke adegan berikutnya
    session.lastStory = nextScene.storyNarration;
    session.lastOptions = nextScene.options;

    const replyText =
      `${headerText}` +
      `${nextScene.storyNarration}\n\n` +
      `${formatStatusBar(session)}\n\n` +
      `═══════════════════════════\n` +
      `⏳ *Batas Waktu: 3 Menit* (Voting 1 menit akan dimulai setelah ada suara pertama!)\n` +
      `💬 *Pilih lewat Polling di bawah atau balas huruf A, B, C, D!*`;

    const poll: KaburPollPayload = {
      name: `⚡ LANGKAH TIM SANTRI (CH. ${session.chapter}):`,
      values: nextScene.options.map(
        (opt) => `${opt.key === "A" ? "🅰️" : opt.key === "B" ? "🅱️" : opt.key === "C" ? "🅲" : "🅳"} [${opt.label}] ${opt.description.slice(0, 45)}`
      ),
      options: nextScene.options,
    };

    armInactivityTimer(groupId);
    if (kaburMessenger) await kaburMessenger(groupId, replyText, poll);
  } finally {
    session.isProcessing = false;
  }
}

/**
 * Helper langsung untuk pengujian unit & eksekusi cepat
 */
export async function handleKaburAnswer(
  groupId: string,
  rawInput: string,
  senderName: string
): Promise<{ handled: boolean; replyText?: string; poll?: KaburPollPayload }> {
  const session = activeSessions.get(groupId);
  if (!session) return { handled: false };

  const fakeId = `tester-${Date.now()}`;
  const voteRes = recordKaburVote(groupId, rawInput, fakeId, senderName);
  if (!voteRes.recorded) {
    return { handled: false };
  }

  let capturedReply: string | undefined;
  let capturedPoll: KaburPollPayload | undefined;

  const originalMessenger = kaburMessenger;
  kaburMessenger = (g, reply, poll) => {
    capturedReply = reply;
    capturedPoll = poll;
  };

  await resolveKaburTurn(groupId);

  kaburMessenger = originalMessenger;

  return {
    handled: !!capturedReply,
    replyText: capturedReply,
    poll: capturedPoll,
  };
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

  const voteCount = session.votes.size;
  const voteStatus = voteCount > 0
    ? `\n🗳️ *Voting Berlangsung:* Sudah ada *${voteCount} suara* masuk (menunggu countdown 1 menit selesai).`
    : `\n⏳ *Menunggu Suara:* Belum ada santri yang memilih (Batas waktu: 3 menit).`;

  if (session.status === "lobby") {
    return (
      `🎮 *MISI KABUR DARI PONDOK (STATUS: LOBBY & BRIEFING)* 🏃‍♂️💨\n\n` +
      `📢 _Diinisiasi oleh sahabat: *${session.starterName}*_\n\n` +
      `Seluruh tim sedang berada di ruang briefing asrama sebelum turun ke lorong.${voteStatus}\n` +
      `👉 Silakan klik tombol *🚀 [BISMILLAH] Gas Mulai Misi!* di Polling atau balas dengan huruf *A* untuk mulai Chapter 1!`
    );
  }

  return (
    `🏃‍♂️ *MISI KABUR DARI PONDOK (CHAPTER ${session.chapter})*\n\n` +
    `${formatStatusBar(session)}${voteStatus}\n\n` +
    `📜 *Rangkuman Jejak Terakhir:*\n` +
    session.history.slice(-2).map((h) => `• ${h}`).join("\n") +
    `\n\n_Pilih salah satu opsi di Polling terakhir, atau ketik *!kabur stop* untuk membatalkan misi!_`
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
  clearAllKaburTimers(session);
  activeSessions.delete(groupId);
  clearKaburPollsForGroup(groupId);
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
 * Dilengkapi Dynamic Twist Generator & Token Buffer 2500 tokens agar cerita tidak monoton
 */
async function generateNextSceneWithAI(
  state: KaburGameState,
  chosenOption: KaburOption,
  actorName: string
): Promise<AISceneOutput> {
  const currentChapter = state.chapter;
  const nextTargetChapter = currentChapter < 3 ? currentChapter + 1 : currentChapter;

  const RANDOM_TWISTS = [
    "Malam ini gerimis rintik-rintik, genteng seng asrama berisik dan tanah pematang sawah licin becek.",
    "Tiba-tiba ada kucing liar dapur yang melompat ke atas rak piring kaleng dan mengeong sangat kencang.",
    "Pengurus rayon di kamar sebelah mengigau membaca bait Alfiyyah Ibnu Malik dengan suara lantang dan mendengkur lagi.",
    "Tercium aroma tembakau rokok kretek dari pos satpam gerbang depan yang berjarak 30 meter.",
    "Lampu penerangan lorong berkedip-kedip redup karena korsleting kabel.",
    "Tali jepit sandal swallow salah satu santri mendadak putus dan harus diakali dengan peniti/pentul.",
    "Dari kejauhan terdengar suara gemerincing kunci gembok besar yang dibawa ronda mudabbir.",
    "Ada santri junior lain yang ternyata juga mengendap-endap mau masak mie di dapur.",
    "Ustadz Ri'ayah sedang duduk di teras pos ronda samping menyeduh kopi hitam tanpa suara.",
    "Terdengar deru mesin motor bebek tua Astrea Grand berpatroli pelan di jalan aspal luar tembok.",
    "Angin malam berhembus kencang membuat jemuran sarung basah berkibar-kibar menyeramkan seperti pocong.",
    "Salah satu santri di tim kalian mendadak tersedak ludah dan batuk-batuk kecil di kegelapan.",
  ];
  const twist = RANDOM_TWISTS[Math.floor(Math.random() * RANDOM_TWISTS.length)];

  const systemPrompt = `Kamu adalah Game Master RPG interaktif bertema "Kabur dari Pondok Pesantren" untuk bot WhatsApp alumni angkatan pesantren (santri).
Gayamu: Sangat hidup, penuh twist tak terduga, kocak, sinematik, bernostalgia kental dengan kehidupan santri Jawa/Nusantara (sarung, sandal swallow ukir, jasus, qism keamanan / mudabbir, biro ri'ayah, takzir botak, ghosob, tasreh, matbakh, wirid, rental PS).

KONDISI TAK TERDUGA MALAM INI (WAJIB DIMASUKKAN KE DALAM CERITA):
"${twist}"

HIERARKI ANTAGONIS PONDOK:
1. Jasus: Santri junior/cepu yang suka cari muka.
2. Qism Keamanan: Pengurus santri senior pembawa senter SWAT, sidak lorong, bawa pentungan rotan.
3. Biro Ri'ayah (FINAL BOSS): Ustadz pengasuhan, wibawa tinggi, naik motor Astrea/Grand mesin senyap tanpa lampu, hafal semua jalur tikus. Takzir: Botak 0 cm licin & bersihin selokan/bak masjid.

PANDUAN ALUR CHAPTER:
- Chapter 1: Rayon Asrama & Lorong Jemuran (Hadapi Qism Keamanan ronda).
- Chapter 2: Dapur Umum (Matbakh) & Tembok Belakang Pondok (Penuh kawat duri & pohon kersen/mangga).
- Chapter 3: Luar Tembok, Kebun Belakang, Parit Sawah & Jalan Desa (Ronda Ustadz Ri'ayah bermotor).
- Chapter 4 / Menang: Rental PS / Warkop Indomie di luar jangkauan pondok.

STATUS TIM SANTRI SEKARANG:
- Chapter: ${state.chapter}
- Stealth: ${state.stealth}%
- Stamina: ${state.stamina}%
- Inventory: ${JSON.stringify(state.inventory)}
- Riwayat Aksi Sebelumnya: ${JSON.stringify(state.history.slice(-3))}
- Keputusan Terpilih (${actorName}): Opsi [${chosenOption.key}] (${chosenOption.label}: ${chosenOption.description})

INSTRUKSI PENTING VARIASI ALUR:
- Cerita JANGAN PERNAH monoton atau klise. Hadirkan situasi tak terduga, dialog kocak santri, kepanikan realistis, dan reaksi spontan.
- Setiap pilihan A, B, C, D harus memberikan konsekuensi yang masuk akal terhadap Stealth & Stamina.
- Sediakan 4 pilihan baru yang benar-benar berbeda dari babak sebelumnya.
- JIKA aksi sangat berisiko atau stealth mendekati 0, buat mereka tertangkap (outcome: "CAUGHT").
- JIKA aksi berhasil di Chapter 3 menuju Chapter 4, buat mereka lolos (outcome: "ESCAPED").

KEMBALIKAN OUTPUT HARUS VALID JSON SAJA (tanpa pembuka/penutup markdown \`\`\`json):
{
  "storyNarration": "narasi lengkap adegan berikutnya (3-4 paragraf seru, detail, kocak)",
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
        temperature: 0.95,
        maxOutputTokens: 2500,
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
    console.warn("[KABUR-PONDOK-AI-WARN] Gagal AI generation, menggunakan variasi fallback dinamis:", err.message);
  }

  // Fallback Dynamic Engine jika API bermasalah
  return generateFallbackScene(state, chosenOption);
}

/**
 * Variasi Fallback Dinamis (Multiple Branching Scenarios)
 */
function generateFallbackScene(state: KaburGameState, chosen: KaburOption): AISceneOutput {
  const variant = Math.floor(Math.random() * 2);

  if (state.chapter === 1) {
    if (variant === 0) {
      return {
        storyNarration:
          `Aksi cerdik kalian berhasil mengecoh patroli Qism Keamanan! Petugas berbelok arah karena mengira suara gesekan hanya tikus asrama.\n\n` +
          `Dengan sarung dinaikkan setinggi lutut, kalian merayap cepat melewati lorong rayon dan berhasil tiba di area **Dapur Umum (Matbakh)**. Di hadapan kalian terbentang dinding bata merah setinggi 2,5 meter dengan kawat berduri di atasnya.\n\n` +
          `Namun masalah baru muncul: Di dekat pintu dapur, ada **Jasus Santri** yang sedang mencuri sisa nasi goreng di wajan besar!`,
        narrationSummary: "Lolos dari rayon asrama menuju dapur umum dan memergoki jasus.",
        stealthDelta: -10,
        staminaDelta: -15,
        newChapter: 2,
        outcome: "CONTINUE",
        options: [
          { key: "A", label: "SOGOK PAKAI ROCO", archetype: "DIPLOMASI", description: "Beri rokok/permen ke jasus agar tutup mulut." },
          { key: "B", label: "PANJAT POHON KERSEN", archetype: "PARKOUR", description: "Naik lewat dahan pohon kersen di samping tembok dapur." },
          { key: "C", label: "TIARAP DI PARIT AIR", archetype: "NINJA", description: "Menyusup lewat gorong-gorong pembuangan air cucian beras." },
          { key: "D", label: "GELAR SARUNG HANTU", archetype: "ALIBI", description: "Pura-pura jadi hantu pocong jemuran buat menakuti jasus." },
        ],
      };
    } else {
      return {
        storyNarration:
          `Malam yang mendebarkan! Manuver kalian menembus lorong jemuran berlangsung sangat mulus tanpa terdeteksi senter SWAT.\n\n` +
          `Kalian berhasil mencapai tembok batas belakang di samping kandang kambing pondok. Bau khas pedesaan menyengat hidung. Tembok belakang tampak tinggi, tapi ada tumpukan kayu bekas kasur santri yang bisa dipanjat.\n\n` +
          `Tiba-tiba... ***Klotak!*** Sebuah gayung kaleng terinjak di kegelapan! Dari kejauhan terdengar siulan ronda mudabbir.`,
        narrationSummary: "Tiba di tumpukan kayu tembok belakang dekat kandang kambing.",
        stealthDelta: -15,
        staminaDelta: -10,
        newChapter: 2,
        outcome: "CONTINUE",
        options: [
          { key: "A", label: "LOMPAT KILAT", archetype: "PARKOUR", description: "Injak tumpukan kayu dan langsung loncat menyeberangi kawat duri." },
          { key: "B", label: "TIRUKAN SUARA KAMBING", archetype: "ALIBI", description: "Mengembik pelan 'Mbeeek...' agar mudabbir mengira kambing yang gerak." },
          { key: "C", label: "TIARAP DI BAWAH DIPAN", archetype: "NINJA", description: "Sembunyi rapat di sela-sela dipan kayu bekas." },
          { key: "D", label: "LEMPAR SANDAL JAUH", archetype: "DIPLOMASI", description: "Lempar sandal swallow ke arah berlawanan untuk mengalihkan ronda." },
        ],
      };
    }
  }

  if (state.chapter === 2) {
    return {
      storyNarration:
        `Dengan kerja sama tim yang solid, kalian berhasil melompati tembok belakang tanpa tersangkut kawat berduri!\n\n` +
        `Kalian mendarat di pematang sawah berlumpur di luar komplek pondok. Bau udara bebas tercium begitu harum. Di kejauhan, terlihat lampu jalan aspal desa dan warkop.\n\n` +
        `Namun, mendadak terdengar deru mesin motor bebek tua: ***Breeem... breeem...***\n` +
        `Sebuah motor Astrea Grand melaju pelan di pematang aspal dengan lampu sengaja dimatikan... itu adalah **Patroli Khusus Biro Ri'ayah** yang sedang menyisir batas luar pondok!`,
      narrationSummary: "Berhasil melompati tembok belakang dan sampai di pematang sawah.",
      stealthDelta: -15,
      staminaDelta: -20,
      newChapter: 3,
      outcome: "CONTINUE",
      options: [
        { key: "A", label: "TIARAP DI LUMPUR SAWAH", archetype: "NINJA", description: "Rebahkan badan ke lumpur sawah, menyatu dengan rumpun padi." },
        { key: "B", label: "MENYAMAR WARGA DESA", archetype: "ALIBI", description: "Pura-pura jadi pemuda kampung yang lagi nyari belut malam-malam." },
        { key: "C", label: "SPRINT MENEMBUS SEMAK", archetype: "PARKOUR", description: "Lari zig-zag memotong kebun pisang menuju jalan raya." },
        { key: "D", label: "KORBANKAN SANDAL", archetype: "DIPLOMASI", description: "Tinggalkan sandal swallow di pinggir parit lalu kabur ke arah sebaliknya." },
      ],
    };
  }

  // Chapter 3 -> Menang
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

export function clearKaburPollsForGroup(groupId: string): void {
  for (const [id, tracker] of activePollMap.entries()) {
    if (tracker.groupId === groupId) {
      activePollMap.delete(id);
    }
  }
}

export function registerKaburPoll(
  pollMsgId: string,
  groupId: string,
  pollCreatorJid: string,
  pollEncKey?: Uint8Array,
  options: KaburOption[] = [],
  pollValues: string[] = [],
  pollCreatorLid?: string
): void {
  // Bersihkan polling lama untuk grup ini agar tidak ada voting ganda dari pesan usang
  clearKaburPollsForGroup(groupId);

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

export function removeKaburPoll(pollMsgId: string): void {
  activePollMap.delete(pollMsgId);
}
