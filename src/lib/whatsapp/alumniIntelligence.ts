import { createAdminClient } from "@/lib/supabase/admin";
import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";

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
  "alamat", "rumahnya", "asal", "tinggal", "tinggalnya", "kerja", "status", "foto", "si", "aja", "saja"
]);

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
  const supabase = createAdminClient();
  const lower = messageText.trim().toLowerCase();

  try {
    // 0. Cek apakah ada memori dinamis yang telah dipelajari bot yang cocok dengan pertanyaan
  try {
    const { getLearnedMemories } = await import("@/lib/whatsapp/botMemory");
    const memories = await getLearnedMemories();
    if (memories && memories.length > 0) {
      const matched = memories.filter((m) => {
        const top = m.topic.toLowerCase();
        return lower.includes(top) || top.split(/\s+/).some((w) => w.length >= 3 && lower.includes(w));
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
    if (lower.includes("ultah") || lower.includes("ulang tahun") || lower.includes("milad")) {
      const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const currentMonth = nowWib.getMonth() + 1;
      const currentDay = nowWib.getDate();

      const { data: celebrants } = await supabase
        .from("profiles")
        .select("nama_lengkap, nama_panggilan, tanggal_lahir, alamat_lengkap")
        .not("tanggal_lahir", "is", null);

      if (celebrants && celebrants.length > 0) {
        const todayCelebrants: Array<{ name: string; age: string }> = [];
        const thisMonthCelebrants: Array<{ name: string; day: number; age: string }> = [];

        for (const p of celebrants) {
          if (!p.tanggal_lahir) continue;
          const parts = p.tanggal_lahir.split(/[-/]/);
          if (parts.length < 3) continue;
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          const name = (p.nama_panggilan || p.nama_lengkap || "").trim();
          const ageStr = calculateAge(p.tanggal_lahir);

          if (m === currentMonth && d === currentDay) {
            todayCelebrants.push({ name, age: ageStr });
          } else if (m === currentMonth) {
            thisMonthCelebrants.push({ name, day: d, age: ageStr });
          }
        }

        // Urutkan tanggal yang milad bulan ini
        thisMonthCelebrants.sort((a, b) => a.day - b.day);

        if (todayCelebrants.length > 0) {
          return {
            category: "birthday",
            summary: `FAKTA MILAD HARI INI (${currentDay}/${currentMonth}):\n` +
              todayCelebrants.map((c) => `🎉 *${c.name}* (${c.age})`).join("\n") +
              `\nDoa resmi: Barakallahu fii umrik, semoga panjang umur, dilipatgandakan rezekinya, dan selalu istiqomah! Aamiin.`,
            data: { todayCelebrants, thisMonthCelebrants },
          };
        } else {
          const listMonth = thisMonthCelebrants.slice(0, 6).map((c) => `• ${c.name} (tgl ${c.day})`).join("\n");
          return {
            category: "birthday",
            summary: `FAKTA MILAD: Hari ini (${currentDay}/${currentMonth}) belum ada sahabat yang berulang tahun.\n` +
              `Yang milad di bulan ini (${currentMonth}):\n${listMonth || "Belum ada data milad bulan ini"}.`,
            data: { todayCelebrants, thisMonthCelebrants },
          };
        }
      }
    }

    // 3. TANYA DAERAH / KOTA / DOMISILI (Contoh: "siapa yang di Surabaya?", "anak Bandung siapa aja?")
    for (const city of KNOWN_CITIES) {
      if (lower.includes(city)) {
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
    const cleanTokens = messageText
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !COMMON_STOPWORDS.has(w.toLowerCase()));

    if (cleanTokens.length > 0) {
      for (const token of cleanTokens) {
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat_lengkap, no_whatsapp, cita_cita, motivasi_hidup, akun_ig")
          .or(`nama_lengkap.ilike.%${token}%,nama_panggilan.ilike.%${token}%`)
          .limit(2);

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
}): Promise<string> {
  const { messageText, senderPhone, senderName, isGroup } = options;
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.5-flash").trim();

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

  // 1. Dapatkan fakta database faktual
  const fact = await resolveCohortContext(messageText, senderName);

  const prompt = `
You are the official, highly intelligent, and friendly AI Companion of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo, Class of 2025, known as "The Successors").
Current Year: 2026.

USER CONTEXT:
- Name: ${senderName || "Sahabat"}
- Channel: ${isGroup ? "WhatsApp Group Chat (⚔️successors⚔️)" : "WhatsApp Private Chat (1-on-1)"}
- User's Message: "${messageText}"

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
3. ACCURACY:
   - When asked about a specific person, their age, birthday, or city, use the EXACT facts from the database above.
   - If asked about the website creator/leader, honor Muhammad Nur Taufiqi (Elhora) respectfully.
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

  if (geminiApiKey) {
    try {
      const data = await callGeminiResilient(body, geminiApiKey, geminiModel);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (err: any) {
      console.warn("[INTELLIGENT-REPLY-GEMINI-WARN]:", err.message);
    }
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
