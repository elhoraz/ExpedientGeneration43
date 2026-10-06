import { createAdminClient } from "@/lib/supabase/admin";

export interface ActiveQuiz {
  groupId: string;
  targetId: string;
  targetFullName: string;
  targetNicknames: string[];
  clues: string[];
  photoBuffer?: Buffer;
  startedAt: number;
  expiresAt: number;
}

interface PlayerScore {
  phone: string;
  name: string;
  score: number;
  correctAnswers: number;
}

// In-memory active quiz per group
const activeQuizzes = new Map<string, ActiveQuiz>();

// Leaderboard cache
let leaderboardCache: Map<string, PlayerScore> | null = null;

async function loadLeaderboard(): Promise<Map<string, PlayerScore>> {
  if (leaderboardCache) return leaderboardCache;
  const map = new Map<string, PlayerScore>();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("site_content")
      .select("content")
      .eq("key", "wa_quiz_leaderboard")
      .maybeSingle();

    if (data?.content) {
      const parsed = JSON.parse(data.content);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.phone) map.set(item.phone, item);
        }
      }
    }
  } catch (err: any) {
    console.warn("[LOAD-LEADERBOARD-WARN]:", err.message);
  }
  leaderboardCache = map;
  return map;
}

async function saveLeaderboard(map: Map<string, PlayerScore>): Promise<void> {
  leaderboardCache = map;
  try {
    const supabase = createAdminClient();
    const list = Array.from(map.values()).sort((a, b) => b.score - a.score);
    await supabase.from("site_content").upsert({
      key: "wa_quiz_leaderboard",
      content: JSON.stringify(list),
    });
  } catch (err: any) {
    console.warn("[SAVE-LEADERBOARD-WARN]:", err.message);
  }
}

/**
 * Memulai sesi kuis baru di grup
 */
export async function startSantriQuiz(groupId: string): Promise<{
  success: boolean;
  message: string;
  image?: Buffer;
}> {
  // Cek jika sudah ada kuis yang sedang berjalan
  const existing = activeQuizzes.get(groupId);
  if (existing && Date.now() < existing.expiresAt) {
    const remainingSec = Math.ceil((existing.expiresAt - Date.now()) / 1000);
    return {
      success: false,
      message: `⏳ Masih ada kuis yang sedang aktif sahabat! Sisa waktu menjawab: *${remainingSec} detik* lagi. Ayo tebak kuis sebelumnya dulu!`,
    };
  }

  try {
    const supabase = createAdminClient();
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, tempat_lahir, alamat_lengkap, cita_cita, motivasi_hidup, kelas, foto_profil")
      .not("nama_lengkap", "is", null);

    if (error || !profiles || profiles.length === 0) {
      return { success: false, message: "Gagal memuat bank data santri untuk kuis." };
    }

    // Filter profil yang memiliki minimal 2 petunjuk yang bagus
    const eligible = profiles.filter((p) => {
      if (!p.nama_lengkap || p.nama_lengkap.trim().length < 3) return false;
      let clueCount = 0;
      if (p.tempat_lahir || p.alamat_lengkap) clueCount++;
      if (p.cita_cita && p.cita_cita.trim().length > 2) clueCount++;
      if (p.motivasi_hidup && p.motivasi_hidup.trim().length > 2) clueCount++;
      if (p.kelas) clueCount++;
      return clueCount >= 2;
    });

    if (eligible.length === 0) {
      return { success: false, message: "Belum cukup data clue profil santri untuk kuis." };
    }

    // Pilih 1 profil acak
    const target = eligible[Math.floor(Math.random() * eligible.length)];
    const fullName = target.nama_lengkap.trim();
    const nickName = (target.nama_panggilan || "").trim();

    // Buat daftar alias nama yang valid untuk jawaban
    const aliases: string[] = [];
    if (nickName) aliases.push(nickName.toLowerCase());
    const nameWords = fullName.toLowerCase().split(/\s+/).filter((w) => w.length >= 3);
    aliases.push(...nameWords);
    aliases.push(fullName.toLowerCase());

    // Susun clue petunjuk santri
    const clues: string[] = [];
    const asal = target.tempat_lahir || (target.alamat_lengkap ? target.alamat_lengkap.split(",")[0] : "");
    if (asal && asal.trim()) {
      clues.push(`📍 *Asal Daerah*: ${asal.trim()}`);
    }
    if (target.kelas && target.kelas.trim()) {
      clues.push(`🏫 *Kelas / Jurusan*: ${target.kelas.trim()}`);
    }
    if (target.cita_cita && target.cita_cita.trim()) {
      clues.push(`🎯 *Cita-cita*: "${target.cita_cita.trim()}"`);
    }
    if (target.motivasi_hidup && target.motivasi_hidup.trim()) {
      clues.push(`💬 *Prinsip Hidup*: _"${target.motivasi_hidup.trim()}"_`);
    }

    // Inisial huruf nama sebagai bonus clue
    const initials = fullName
      .split(" ")
      .map((w) => w[0]?.toUpperCase())
      .join(". ");
    clues.push(`🔤 *Inisial Nama*: ${initials}.`);

    const now = Date.now();
    const expiresAt = now + 90 * 1000; // 90 detik

    activeQuizzes.set(groupId, {
      groupId,
      targetId: target.id,
      targetFullName: fullName,
      targetNicknames: aliases,
      clues,
      startedAt: now,
      expiresAt,
    });

    const quizText =
      `🎮 *[KUIS TEBAK SANTRI EXPEDIENT 43]* 🎮\n\n` +
      `Siapakah sahabat seperjuangan pondok kita di bawah ini?\n\n` +
      clues.map((c) => `• ${c}`).join("\n") +
      `\n\n⏳ *Waktu menjawab*: 90 Detik\n` +
      `💡 *Cara Jawab*: Langsung ketik tebakan nama di grup ini!\n` +
      `🏆 *Hadiah*: +10 Poin Prestise bagi penebak tercepat & tepat!`;

    return {
      success: true,
      message: quizText,
    };
  } catch (err: any) {
    return { success: false, message: `Error kuis: ${err.message}` };
  }
}

/**
 * Memeriksa apakah pesan alumni merupakan jawaban kuis yang benar
 */
export async function checkQuizAnswer(
  groupId: string,
  messageText: string,
  senderName: string,
  senderPhone: string
): Promise<{ isCorrect: boolean; replyText?: string }> {
  const quiz = activeQuizzes.get(groupId);
  if (!quiz) return { isCorrect: false };

  // Cek apakah waktu sudah kedaluwarsa
  if (Date.now() > quiz.expiresAt) {
    activeQuizzes.delete(groupId);
    return {
      isCorrect: false,
      replyText: `⌛ *WAKTU KUIS HABIS!*\n\nSayang sekali belum ada yang berhasil menebak. Sahabat yang dimaksud adalah:\n👉 *${quiz.targetFullName}*!\n\nTetap semangat, ketik *!kuis* untuk ronde berikutnya! 🚀`,
    };
  }

  const cleanAns = messageText.trim().toLowerCase();
  if (cleanAns.length < 3) return { isCorrect: false };

  // Cek kecocokan jawaban dengan daftar alias/nama
  const isMatch = quiz.targetNicknames.some((alias) => {
    if (alias.length < 3) return false;
    // Cek kesamaan kata utuh atau kemunculan yang presisi
    const regex = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
    return regex.test(cleanAns) || cleanAns === alias;
  });

  if (isMatch) {
    activeQuizzes.delete(groupId);

    // Tambah skor ke leaderboard
    const board = await loadLeaderboard();
    const cleanPhone = senderPhone.replace(/\D/g, "");
    const current = board.get(cleanPhone) || {
      phone: cleanPhone,
      name: senderName,
      score: 0,
      correctAnswers: 0,
    };

    current.name = senderName; // update nama terbaru
    current.score += 10;
    current.correctAnswers += 1;
    board.set(cleanPhone, current);
    await saveLeaderboard(board);

    const winMsg =
      `🎉🎊 *MUMTAZ! TEBAKAN TEPAT SEKALI!* 🎊🎉\n\n` +
      `Selamat kepada Akhi/Ukhti *${senderName}*! 👏\n\n` +
      `Sahabat yang dimaksud memang benar:\n` +
      `👉 *${quiz.targetFullName}*\n\n` +
      `✨ *+10 Poin Prestise* ditambahkan ke profil antum!\n` +
      `📊 Total Skor Antum: *${current.score} Poin* (${current.correctAnswers} tebakan benar)\n\n` +
      `_Ketik *!kuis* untuk bermain lagi atau *!leaderboard* untuk cek klasemen!_ 🏆`;

    return { isCorrect: true, replyText: winMsg };
  }

  return { isCorrect: false };
}

/**
 * Mengambil papan peringkat (Leaderboard) Kuis Santri
 */
export async function getQuizLeaderboard(): Promise<string> {
  const board = await loadLeaderboard();
  const sorted = Array.from(board.values()).sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    return (
      `🏆 *KLASEMEN KUIS TEBAK SANTRI EXPEDIENT 43*\n\n` +
      `Belum ada santri yang mencetak skor kuis nih sahabat!\n\n` +
      `Ayo jadi yang pertama dengan mengetik *!kuis* atau *tebak santri* di grup! 🎮`
    );
  }

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  const lines = sorted.slice(0, 10).map((player, idx) => {
    const medal = medals[idx] || `${idx + 1}.`;
    return `${medal} *${player.name}*: ${player.score} Poin (${player.correctAnswers}x benar)`;
  });

  return (
    `🏆 *PAPAN PERINGKAT KUIS SANTRI (TOP 10)* 🏆\n\n` +
    `Berikut kawan-kawan yang paling hafal profil sahabat seangkatannya:\n\n` +
    lines.join("\n") +
    `\n\n_Ketik *!kuis* untuk mulai menebak & menambah skor antum!_ 🚀`
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
