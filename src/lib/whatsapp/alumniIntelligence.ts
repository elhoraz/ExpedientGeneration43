import { createAdminClient } from "@/lib/supabase/admin";
import { callGeminiResilient } from "@/lib/geminiResilient";

export interface CohortFactContext {
  category: "profile" | "city" | "birthday" | "agenda" | "total" | "feature" | "guestbook" | "general";
  summary: string;
  data?: any;
}

const COMMON_STOPWORDS = new Set([
  "sekarang", "umur", "umurnya", "berapa", "usia", "usianya", "kapan", "dimana", "di", "mana",
  "siapa", "siapakah", "apa", "apakah", "itu", "yang", "dan", "atau", "dari", "ke", "ada",
  "gak", "ga", "nih", "dong", "sih", "lah", "ya", "kan", "tahu", "tahukah", "kenal", "sama",
  "kamu", "bisa", "tolong", "cek", "info", "tentang", "sahabat", "alumni", "anggota", "member",
  "teman", "kawan", "halo", "hai", "assalamu'alaikum", "assalamualaikum", "min", "bot", "minbot",
  "ananda", "akhi", "ukhti", "ustadz", "ustadzah", "mas", "mbak", "rek", "coba",
  "nomor", "nomornya", "kontak", "kontaknya", "wa", "whatsapp", "lahir", "lahirnya", "tanggal", "tempat",
  "alamat", "rumahnya", "asal", "tinggal", "tinggalnya", "kerja", "status", "foto", "si", "aja", "saja",
  // Kata ganti / slang santri yang sering bentrok dengan potongan nama
  "ana", "ane", "ente", "antum", "anti", "antunna", "gue", "gua", "guwe", "elu", "lu", "lo", "aku", "saya",
  "kau", "dia", "kita", "kami", "mereka", "kalian", "beliau", "tau", "gatau", "gktau", "nggak", "enggak",
  "tidak", "bukan", "juga", "lagi", "udah", "sudah", "belum", "mau", "pengen", "gimana", "kenapa",
  "bagaimana", "mengapa", "wkwk", "wkwkwk", "haha", "hehe", "putra", "putri", "cewek", "cowok", "laki",
  "perempuan", "orang", "semua", "banget", "bang", "kak", "bro", "sis", "cuy", "rek", "lur", "bos",
  "nur", "muhammad", "moh", "mohammad", "ahmad", "abdul", "siti"
]);

/** Tokenisasi kata utuh (huruf saja, lowercase) */
function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

interface CachedProfile {
  id: string;
  nama_lengkap: string | null;
  nama_panggilan: string | null;
  nameWords: Set<string>;
  nickWords: Set<string>;
}

let profileCache: { at: number; list: CachedProfile[] } | null = null;

/** Ambil daftar nama alumni (cache 10 menit) untuk pencocokan nama UTUH, bukan potongan substring */
async function getProfileNameIndex(supabase: ReturnType<typeof createAdminClient>): Promise<CachedProfile[]> {
  if (profileCache && Date.now() - profileCache.at < 10 * 60 * 1000) return profileCache.list;
  const { data } = await supabase.from("profiles").select("id, nama_lengkap, nama_panggilan");
  const list: CachedProfile[] = (data || []).map((p: any) => ({
    id: p.id,
    nama_lengkap: p.nama_lengkap,
    nama_panggilan: p.nama_panggilan,
    nameWords: new Set(tokenizeWords(p.nama_lengkap || "").filter((w) => w.length >= 3)),
    nickWords: new Set(tokenizeWords(p.nama_panggilan || "").filter((w) => w.length >= 3)),
  }));
  profileCache = { at: Date.now(), list };
  return list;
}

// Daftar kota/kabupaten populer domisili alumni Expedient 43
const KNOWN_CITIES = [
  "ponorogo", "slahung", "pacitan", "madiun", "ngawi", "magetan", "kediri",
  "surabaya", "malang", "sidoarjo", "gresik", "jombang", "blitar", "tulungagung",
  "bandung", "jakarta", "tangerang", "banten", "bekasi", "depok", "bogor",
  "jogja", "yogyakarta", "solo", "surakarta", "semarang", "jayapura", "papua"
];

/**
 * Menghitung usia akurat berdasarkan tanggal lahir (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr: string): string {
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    if (isNaN(birth.getTime())) return "";

    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }

    const birthFormatted = new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeZone: "Asia/Jakarta",
    }).format(birth);

    return `${age} tahun (Lahir: ${birthFormatted})`;
  } catch {
    return "";
  }
}

/**
 * Engine Resolusi Konteks Cerdas Berdasarkan Pertanyaan Pengguna
 */
export async function resolveCohortContext(
  messageText: string,
  callerName?: string
): Promise<CohortFactContext> {
  const lower = messageText.trim().toLowerCase();

  try {
    const supabase = createAdminClient();
    // 0. Cek apakah ada memori dinamis yang telah dipelajari bot yang cocok dengan pertanyaan
  try {
    const { getLearnedMemories } = await import("@/lib/whatsapp/botMemory");
    const memories = await getLearnedMemories();
    if (memories && memories.length > 0) {
      const msgWords = new Set(tokenizeWords(messageText));
      const matched = memories.filter((m) => {
        const topWords = tokenizeWords(m.topic).filter((w) => w.length >= 3 && !COMMON_STOPWORDS.has(w));
        return topWords.length > 0 && topWords.some((w) => msgWords.has(w));
      });
      if (matched.length > 0) {
        const memList = matched.map((m) => `• ${m.fact} (Dipelajari dari Sahabat ${m.contributor})`).join("\n");
        return {
          category: "general",
          summary: `FAKTA MEMORI TERBARU YANG DIPELAJARI BOT DARI OBROLAN ALUMNI:\n${memList}\n\nJawablah dengan percaya diri menggunakan memori yang telah kamu pelajari ini!`,
          data: matched,
        };
      }
    }
  } catch (memErr) {
    // Non-blocking
  }

  // 1. TANYA KETUA ANGKATAN / PEMBUAT WEBSITE / TOKOH KUNCI
    if (
      lower.includes("ketua angkatan") ||
      lower.includes("ketua") ||
      lower.includes("pembuat web") ||
      lower.includes("developer") ||
      lower.includes("siapa taufiqi") ||
      lower.includes("elhoraz") ||
      lower.includes("elhora")
    ) {
      const { data: elhora } = await supabase
        .from("profiles")
        .select("nama_lengkap, nama_panggilan, tempat_lahir, tanggal_lahir, alamat_lengkap, no_whatsapp, cita_cita, motivasi_hidup")
        .ilike("nama_lengkap", "%taufiq%")
        .limit(1)
        .maybeSingle();

      const elhoraAge = elhora?.tanggal_lahir ? calculateAge(elhora.tanggal_lahir) : "21 tahun";
      return {
        category: "profile",
        summary: `FAKTA TOKOH & KETUA ANGKATAN:\n` +
          `• Nama Lengkap: Muhammad Nur Taufiqi (Akrab dipanggil Elhora / Elhoraz)\n` +
          `• Peran: Ketua / Inisiator & Lead Developer Web Portal Expedient Generation 43\n` +
          `• Tempat/Tgl Lahir: Ponorogo, 4 Mei 2005 (${elhoraAge})\n` +
          `• Asal/Domisili: Ponorogo, Jawa Timur\n` +
          `• Kontak WhatsApp: +62 821-4287-7426\n` +
          `• Karakter: Kreatif, berjiwa kepemimpinan, dan mengayomi seluruh keluarga angkatan 43.`,
        data: elhora,
      };
    }

    // 2. TANYA ULANG TAHUN / MILAD (HARI INI / BULAN INI / TERDEKAT)
    // 2. TANYA ULANG TAHUN / MILAD (HARI INI / BULAN INI / TERDEKAT / SIAPA ULTAH)
    if (
      lower.includes("ultah") ||
      lower.includes("ulang tahun") ||
      lower.includes("milad") ||
      lower.includes("hari lahir")
    ) {
      const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const currentYear = nowWib.getFullYear();
      const currentMonth = nowWib.getMonth() + 1;
      const currentDay = nowWib.getDate();
      const todayDate = new Date(currentYear, nowWib.getMonth(), nowWib.getDate());

      const { data: celebrants } = await supabase
        .from("profiles")
        .select("id, nama_lengkap, nama_panggilan, tanggal_lahir, alamat_lengkap, foto_profil")
        .not("tanggal_lahir", "is", null);

      if (celebrants && celebrants.length > 0) {
        interface BdayItem {
          name: string;
          nick: string;
          birthDay: number;
          birthMonth: number;
          dateStr: string;
          daysLeft: number;
          turningAge: number;
          fullName: string;
          profileId: string;
        }

        const todayCelebrants: BdayItem[] = [];
        const upcomingCelebrants: BdayItem[] = [];

        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];

        for (const p of celebrants) {
          if (!p.tanggal_lahir) continue;
          const parts = p.tanggal_lahir.split(/[-/]/);
          if (parts.length < 3) continue;

          let birthYear = parseInt(parts[0], 10);
          let birthMonth = parseInt(parts[1], 10);
          let birthDay = parseInt(parts[2], 10);
          if (parts[2].length === 4) {
            birthYear = parseInt(parts[2], 10);
            birthMonth = parseInt(parts[1], 10);
            birthDay = parseInt(parts[0], 10);
          }

          if (!birthMonth || !birthDay) continue;

          let bdayTargetYear = currentYear;
          let bdayDate = new Date(bdayTargetYear, birthMonth - 1, birthDay);
          let diffDays = Math.round((bdayDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            bdayTargetYear = currentYear + 1;
            bdayDate = new Date(bdayTargetYear, birthMonth - 1, birthDay);
            diffDays = Math.round((bdayDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
          }

          const turningAge = bdayTargetYear - birthYear;
          const nick = (p.nama_panggilan || p.nama_lengkap.split(" ")[0] || "Sahabat").trim();
          const item: BdayItem = {
            name: nick,
            nick,
            birthDay,
            birthMonth,
            dateStr: `${birthDay} ${monthNames[birthMonth - 1]}`,
            daysLeft: diffDays,
            turningAge,
            fullName: p.nama_lengkap,
            profileId: p.id,
          };

          if (diffDays === 0) {
            todayCelebrants.push(item);
          } else {
            upcomingCelebrants.push(item);
          }
        }

        // Urutkan upcoming dari hari terdekat
        upcomingCelebrants.sort((a, b) => a.daysLeft - b.daysLeft);

        // Ringkasan fakta untuk Gemini AI
        let summaryText = `FAKTA ULANG TAHUN ALUMNI EXPEDIENT 43 (HARI INI: ${currentDay} ${monthNames[currentMonth - 1]} ${currentYear}):\n`;

        if (todayCelebrants.length > 0) {
          summaryText += `🎉 HARI INI BERULANG TAHUN:\n` +
            todayCelebrants.map((c) => `• ${c.fullName} (${c.nick}) ke-${c.turningAge} tahun (Hari ini!)`).join("\n") +
            `\n\n`;
        } else {
          summaryText += `• Hari ini tidak ada yang berulang tahun.\n`;
        }

        const topUpcoming = upcomingCelebrants.slice(0, 5);
        summaryText += `🎂 DAFTAR ULANG TAHUN TERDEKAT MENDATANG:\n` +
          topUpcoming.map((c, i) => `${i + 1}. *${c.nick}* (${c.fullName}) — Tanggal ${c.dateStr} (Kurang ${c.daysLeft} hari lagi / H-${c.daysLeft}, Usia ${c.turningAge} Th)`).join("\n") +
          `\n\nJawablah dengan menyebutkan siapa yang paling terdekat secara jelas dan ramah!`;

        return {
          category: "birthday",
          summary: summaryText,
          data: { todayCelebrants, upcomingCelebrants: topUpcoming },
        };
      }
    }

    // 3. TANYA DAERAH / KOTA / DOMISILI (Contoh: "siapa yang di Surabaya?", "anak Bandung siapa aja?")
    const lowerWords = new Set(tokenizeWords(messageText));
    for (const city of KNOWN_CITIES) {
      if (lowerWords.has(city)) {
        const { data: matchedCity } = await supabase
          .from("profiles")
          .select("nama_lengkap, nama_panggilan, alamat_lengkap, no_whatsapp")
          .ilike("alamat_lengkap", `%${city}%`)
          .limit(8);

        if (matchedCity && matchedCity.length > 0) {
          const names = matchedCity
            .map((p) => `• *${(p.nama_panggilan || p.nama_lengkap).trim()}* (${p.alamat_lengkap || city})`)
            .join("\n");
          return {
            category: "city",
            summary: `FAKTA DOMISILI KOTA ${city.toUpperCase()} (${matchedCity.length} alumni terdata):\n${names}`,
            data: matchedCity,
          };
        }
      }
    }

    // 4. TANYA TOTAL ALUMNI / STATISTIK ANGKATAN
    if (
      (lower.includes("berapa") && (lower.includes("alumni") || lower.includes("anggota") || lower.includes("total"))) ||
      lower.includes("total alumni") ||
      lower.includes("jumlah alumni") ||
      lower.includes("berapa kita")
    ) {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: putraCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("jenis_kelamin", "L");
      const { count: putriCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("jenis_kelamin", "P");

      return {
        category: "total",
        summary: `FAKTA STATISTIK ANGKATAN EXPEDIENT 43:\n` +
          `• Total Alumni Terdaftar: *${count || 79} alumni*\n` +
          `• Alumni Putra: ${putraCount || 45} sahabat\n` +
          `• Alumni Putri: ${putriCount || 34} sahabat\n` +
          `• Kelulusan: Pondok Modern Arrisalah Slahung Ponorogo (Tahun 2025)\n` +
          `• Direktori Lengkap: https://expedientgeneration.vercel.app/direktori`,
        data: { count, putraCount, putriCount },
      };
    }

    // 5. TANYA FITUR WEBSITE / PORTAL / CARA PAKAI
    if (
      lower.includes("fitur") ||
      lower.includes("website") ||
      lower.includes("web kita") ||
      lower.includes("bisa ngapain") ||
      lower.includes("portal") ||
      lower.includes("link web") ||
      lower === "!help" ||
      lower === "help" ||
      lower === "menu"
    ) {
      return {
        category: "feature",
        summary: `PANDUAN FITUR PORTAL EXPEDIENT 43 (https://expedientgeneration.vercel.app):\n` +
          `1. 📱 *Direktori Alumni*: Cari profil, nomor WA, domisili kawan seangkatan.\n` +
          `2. 📸 *Galeri Masa Pondok & Reuni*: Album foto nostalgia kenangan indah bersama.\n` +
          `3. 🤖 *AI Photobooth*: Generator foto seru alumni bertenaga AI.\n` +
          `4. 📖 *Asmaul Husna & Doa*: Renungan 99 Asmaul Husna, arah kiblat & waktu sholat digital.\n` +
          `5. ✍️ *Buku Tamu Online*: Titip salam dan pesan persahabatan antar alumni.\n` +
          `6. 💼 *Expedient Syndicate*: Jejaring karir, loker, dan peluang kolaborasi bisnis alumni.\n` +
          `7. 📢 *Broadcast Lelayu/Duka*: Kirim info duka via WhatsApp bot ke nomor Admin untuk dipost resmi.`,
      };
    }

    // 6. TANYA AGENDA / REUNI / ACARA
    if (lower.includes("reuni") || lower.includes("agenda") || lower.includes("acara") || lower.includes("kapan kumpul")) {
      const { data: events } = await supabase
        .from("events")
        .select("title, description, event_date, location")
        .order("event_date", { ascending: true })
        .limit(3);

      if (events && events.length > 0) {
        return {
          category: "agenda",
          summary: `FAKTA AGENDA RESMI ANGKATAN:\n` + JSON.stringify(events, null, 2),
          data: events,
        };
      } else {
        return {
          category: "agenda",
          summary: `FAKTA AGENDA: Saat ini belum ada tanggal reuni akbar resmi terdekat yang dipatok di sistem. Silakan usulkan ide kumpul/bukber di website kita https://expedientgeneration.vercel.app ya!`,
        };
      }
    }

    // 7. PENCARIAN PROFIL SPESIFIK BERDASARKAN KATA KUNCI NAMA
    // HANYA cocokkan kata UTUH dengan nama/panggilan alumni (bukan potongan substring!)
    // Contoh bug lama: "ana" -> Earlyana (Eva), "tau" -> Taufiqi.
    const cleanTokens = Array.from(new Set(
      tokenizeWords(messageText).filter((w) => w.length >= 3 && !COMMON_STOPWORDS.has(w))
    ));

    if (cleanTokens.length > 0) {
      const nameIndex = await getProfileNameIndex(supabase);
      for (const token of cleanTokens) {
        // Prioritaskan nama panggilan yang persis sama, lalu kata utuh di nama lengkap
        let hits = nameIndex.filter((p) => p.nickWords.has(token));
        if (hits.length === 0) hits = nameIndex.filter((p) => p.nameWords.has(token));
        if (hits.length === 0 || hits.length > 3) continue; // terlalu ambigu -> abaikan

        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat_lengkap, no_whatsapp, cita_cita, motivasi_hidup, akun_ig")
          .in("id", hits.slice(0, 2).map((h) => h.id));

        if (matchedProfiles && matchedProfiles.length > 0) {
          const details = matchedProfiles.map((p) => {
            const ageStr = p.tanggal_lahir ? calculateAge(p.tanggal_lahir) : "Belum dicantumkan";
            return (
              `• *${(p.nama_lengkap || "").trim()}* (Panggilan: *${(p.nama_panggilan || "").trim()}*)\n` +
              `  - Usia: ${ageStr}\n` +
              `  - Asal/Domisili: ${(p.alamat_lengkap || "-").trim()}\n` +
              `  - Cita-cita: ${(p.cita_cita || "-").trim()}\n` +
              `  - Motivasi: ${(p.motivasi_hidup || "-").trim()}\n` +
              `  - Instagram: ${(p.akun_ig || "-").trim()}\n` +
              `  - WhatsApp: ${p.no_whatsapp ? `+${p.no_whatsapp}` : "-"}`
            );
          });

          return {
            category: "profile",
            summary: `FAKTA DATA PROFIL ALUMNI DITEMUKAN UNTUK "${token}":\n` + details.join("\n\n"),
            data: matchedProfiles,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn("[RESOLVE-COHORT-CONTEXT-WARN]:", err.message);
  }

  return {
    category: "general",
    summary: `INFORMASI ANGKATAN:\nExpedient Generation 43 adalah ikatan alumni Pondok Modern Arrisalah Slahung Ponorogo lulusan tahun 2025. Motto: "The Successors" (Keluarga, Ukhuwah, & Prestasi). Portal resmi: https://expedientgeneration.vercel.app`,
  };
}

/**
 * Generator Respons Cerdas Bertenaga Gemini AI
 */
export async function generateIntelligentCohortReply(options: {
  messageText: string;
  senderPhone: string;
  senderName: string;
  isGroup: boolean;
  groupId?: string;
  quotedText?: string;
  quotedSender?: string;
  /** true jika pesan yang di-reply adalah balasan bot sendiri (hindari loop topik lama) */
  quotedFromBot?: boolean;
}): Promise<string> {
  const { messageText, senderPhone, senderName, isGroup, groupId, quotedText, quotedSender, quotedFromBot } = options;
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  // 0. Refleks Self-Learning: Periksa apakah pesan pengguna mengajari fakta baru atau mengoreksi data bot
  try {
    const { extractAndLearnFromMessage } = await import("@/lib/whatsapp/botMemory");
    const learnRes = await extractAndLearnFromMessage(messageText, senderName);
    if (learnRes.hasLearned && learnRes.acknowledgment) {
      return learnRes.acknowledgment;
    }
  } catch (learnErr) {
    // Non-blocking
  }

  // 0b. INTENT KHUSUS: Rangkuman Obrolan Grup / Kesimpulan Topik Diskusi
  if (isGroup && groupId) {
    try {
      const {
        isConversationSummaryIntent,
        getRecentGroupChatHistory,
        formatChatHistoryForSummary,
      } = await import("@/lib/whatsapp/groupConversationBuffer");

      if (isConversationSummaryIntent(messageText)) {
        const history = await getRecentGroupChatHistory(groupId, 20);
        // Saring pesan pengguna sendiri yang sedang bertanya ini agar tidak membingungkan AI
        const conversationMessages = history.filter(
          (m) => !(m.senderPhone === senderPhone && m.messageText.trim() === messageText.trim())
        );

        if (conversationMessages.length > 0 || quotedText) {
          const formattedHistory = formatChatHistoryForSummary(conversationMessages);
          const summaryPrompt = `
You are the official, highly intelligent, and friendly AI Companion of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo, Class of 2025).
A group member named *${senderName || "Sahabat"}* is asking in the WhatsApp group what the members are talking about or asking for the conclusion/summary of the ongoing discussion.

USER QUESTION: "${messageText}"
${quotedText ? `- Quoted Message Being Replied To (From ${quotedSender || "teman"}): "${quotedText}"\n  (PERHATIAN: Pengguna secara khusus me-reply pesan ini untuk menanyakan kesimpulan atau penjelasannya!)` : ""}

RECENT GROUP CONVERSATION LOG (Chronological):
${formattedHistory || "(Tidak ada log obrolan selain pesan yang di-reply)"}

TASK:
Provide a clear, natural, and helpful Indonesian summary or conclusion of the actual conversation topic above.
CRITICAL GUIDELINES:
1. FOCUS ON WHAT WAS ACTUALLY DISCUSSED:
   - Identify the main topics (e.g. rencana kumpul/reuni, patungan, kabar kawan, guyonan santri, dll.).
   - If members reached an agreement or decision, state it clearly.
   - If members are still debating or offering different ideas, summarize the options.
   - If the user quoted a specific message, prioritize explaining and summarizing the context of that quoted message!
2. STYLE & TONE:
   - Warm, friendly, intelligent, like a close classmate / santri alumnus (sapaan santun: "Halo Sahabat *${senderName || "Sahabat"}*", "Terkait obrolan tadi...", atau "Jadi kesimpulannya:").
   - 2 to 4 sentences maximum (or clean bullet points if summarizing distinct decisions). Keep it crisp for WhatsApp group!
3. ANTI-HALLUCINATION:
   - DO NOT mention generic database facts about Arrisalah 2025 or website URLs unless the members were actually talking about that!
   - WhatsApp formatting: *bold* for names and important points.
`.trim();

          const body = {
            contents: [{ parts: [{ text: summaryPrompt }] }],
            generationConfig: { temperature: 0.2 },
          };

          const data = await callGeminiResilient(body, geminiApiKey, geminiModel);
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) return text;
        } else {
          return `Halo Sahabat *${senderName}*! Maaf, ana baru menyimak grup ini jadi belum sempat mencatat obrolan sebelumnya. Boleh quote/reply pesan kawan yang mau disimpulkan, atau sebutkan topik yang lagi dibahas? InsyaAllah ana bantu rangkum! 😊🙌`;
        }
      }
    } catch (sumErr: any) {
      console.warn("[CONVERSATION-SUMMARY-WARN]:", sumErr.message);
    }
  }

  // 1. Dapatkan fakta database faktual (periksa juga quotedText jika user merujuk ke pesan teman)
  let fact: CohortFactContext = {
    category: "general",
    summary: `Expedient Generation 43 Alumni 2025 Pondok Modern Arrisalah Slahung Ponorogo`,
  };
  try {
    // Cari fakta dari pesan user dulu. Teks yang di-quote hanya dipakai jika BUKAN balasan bot sendiri,
    // agar bot tidak terus-terusan mengulang topik/nama dari jawabannya yang lama.
    fact = await resolveCohortContext(messageText, senderName);
    if (fact.category === "general" && quotedText && !quotedFromBot) {
      const quotedFact = await resolveCohortContext(quotedText, senderName);
      if (quotedFact.category !== "general") fact = quotedFact;
    }
  } catch (_) {}

  // 1b. Ambil cuplikan 5 pesan terakhir di grup sebagai konteks alur percakapan
  let recentGroupChatContext = "";
  if (isGroup && groupId) {
    try {
      const { getRecentGroupChatHistory, formatChatHistoryForSummary } = await import("@/lib/whatsapp/groupConversationBuffer");
      const hist = await getRecentGroupChatHistory(groupId, 6);
      const filtered = hist.filter((m) => !(m.senderPhone === senderPhone && m.messageText.trim() === messageText.trim()));
      if (filtered.length > 0) {
        recentGroupChatContext = formatChatHistoryForSummary(filtered.slice(-5));
      }
    } catch (_) {}
  }

  const prompt = `
You are the official, highly intelligent, and friendly AI Companion of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo, Class of 2025, known as "The Successors").
Current Year: 2026.

USER CONTEXT:
- Name: ${senderName || "Sahabat"}
- Channel: ${isGroup ? "WhatsApp Group Chat (⚔️successors⚔️)" : "WhatsApp Private Chat (1-on-1)"}
- User's Message: "${messageText}"
${quotedText ? `- Pesan Teman Yang Sedang Di-Reply/Quote (Pengirim: ${quotedSender || "teman"}): "${quotedText}"\n  (PERHATIAN: Pengguna sedang me-reply langsung pesan temannya di atas sambil memanggil bot. Jawablah dengan memahami pertanyaan/topik dari pesan temannya tersebut!)` : ""}
${recentGroupChatContext ? `- Cuplikan Percakapan Terakhir di Grup (Sebagai Alur Konteks Obrolan):\n${recentGroupChatContext}\n` : ""}

RESOLVED KNOWLEDGE / DATABASE FACTS:
${fact.summary}

STRICT INTELLIGENCE & COMMUNICATION GUIDELINES:
1. ${
    isGroup
      ? "FOR GROUP CHAT: Keep your response EXTREMELY BRIEF & CRISP (1 to 2 sentences maximum!). Be direct, friendly, and helpful. Never spam the group with long essays."
      : "FOR PRIVATE CHAT: Provide a warm, clear, polite, and complete answer (2 to 4 sentences). Offer helpful follow-up if applicable."
  }
2. TONE & ETHICS:
   - Warm, respectful, intelligent, like a true santri alumni brother/sister.
   - Use Islamic courtesy naturally when relevant ("Assalamu'alaikum", "Barakallahu fiik", "Alhamdulillah", "Aamiin").
   - Can speak Indonesian fluently, and understands friendly regional santri expressions (Javanese touches like "Monggo", "Nggih").
3. ACCURACY & ANTI-HALLUCINATION (MOST IMPORTANT):
   - The DATABASE FACTS above are only a reference. Use them ONLY if they directly answer what the user actually asked.
   - If the facts are not related to the user's message, IGNORE them completely and just reply naturally to the message.
   - NEVER bring up, mention, or talk about any alumni by name unless the user explicitly asked about that specific person.
   - NEVER invent stories, rumors, relationships, jobs, or events about anyone. If you don't know, say honestly you don't know.
   - When the user DOES ask about a specific person, their age, birthday, or city, use the EXACT facts from the database.
   - Only mention the website creator/leader (Elhora) when the user asks about him.
4. FORMATTING:
   - Clean WhatsApp markdown (*bold* for names, dates, key terms).
   - Never output markdown headers like "###" or HTML tags.
   - Keep emojis natural and expressive (😊, 👋, 🎂, 🎓, ✨).
`.trim();

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.25,
    },
  };

  try {
    const data = await callGeminiResilient(body, geminiApiKey, geminiModel);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (text) return text;
  } catch (err: any) {
    console.warn("[INTELLIGENT-REPLY-GEMINI-WARN]:", err.message);
  }

  // Fallback tangkas jika AI offline
  if (fact.category === "birthday") {
    return `🎂 ${fact.summary.split("\n")[1] || "Ada sahabat kita yang milad! Barakallahu fii umrik."}`;
  }
  if (fact.category === "profile" && fact.data) {
    const p = Array.isArray(fact.data) ? fact.data[0] : fact.data;
    return `Sahabat *${p.nama_panggilan || p.nama_lengkap}* berasal dari ${p.alamat_lengkap || "Ponorogo"}. Cek profil lengkapnya di https://expedientgeneration.vercel.app/direktori ya!`;
  }
  return `Halo Sahabat *${senderName}*! Ada yang bisa kubantu seputar info kawan-kawan Expedient 43? Silakan cek juga di https://expedientgeneration.vercel.app ya!`;
}
