import { createAdminClient } from "@/lib/supabase/admin";
import { callGeminiResilient } from "@/lib/geminiResilient";

export interface CohortFactContext {
  category:
    | "profile"
    | "city"
    | "birthday"
    | "agenda"
    | "total"
    | "feature"
    | "guestbook"
    | "baitul_maal"
    | "syndicate"
    | "philosophy"
    | "general";
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
  "cerita", "ceritain", "kabar", "kabarnya", "gimana", "jelasin", "kasih", "bagi", "panggilannya",
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
    .replace(/[^a-z0-9\s]/g, " ")
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
  "jogja", "yogyakarta", "solo", "surakarta", "semarang", "jayapura", "papua",
  "lampung", "palembang", "medan", "makassar", "balikpapan", "samarinda", "bali"
];

/** Format angka ke Rupiah yang rapi */
function formatRupiah(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

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
 * Engine Resolusi Konteks Cerdas Berdasarkan Pertanyaan Pengguna & Riwayat Obrolan
 */
export async function resolveCohortContext(
  messageText: string,
  callerName?: string,
  recentChatContext?: string,
  rawChatHistory?: any[]
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

    // 1. TANYA KETUA ANGKATAN / PEMBUAT WEBSITE / LEAD DEVELOPER (ELHORA)
    if (
      lower.includes("ketua angkatan") ||
      (lower.includes("ketua") && !lower.includes("rt") && !lower.includes("rw")) ||
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
        summary:
          `FAKTA TOKOH & KETUA ANGKATAN:\n` +
          `• Nama Lengkap: Muhammad Nur Taufiqi (Akrab dipanggil Elhora / Elhoraz)\n` +
          `• Peran: Ketua Angkatan & Lead Developer Web Portal Expedient Generation 43\n` +
          `• Tempat/Tgl Lahir: Ponorogo, 4 Mei 2005 (${elhoraAge})\n` +
          `• Asal/Domisili: Ponorogo, Jawa Timur\n` +
          `• Kontak WhatsApp: +62 821-4287-7426\n` +
          `• Karakter: Kreatif, berjiwa kepemimpinan, dan mengayomi seluruh keluarga angkatan 43.`,
        data: elhora,
      };
    }

    // 1b. TANYA HARI SANTRI / HARI BESAR ISLAM
    if (
      lower.includes("hari santri") ||
      (lower.includes("santri") && (lower.includes("kapan") || lower.includes("kpn") || lower.includes("tgl") || lower.includes("tanggal")))
    ) {
      return {
        category: "agenda",
        summary:
          `FAKTA HARI SANTRI NASIONAL (HSN):\n` +
          `• Hari Santri Nasional diperingati setiap tanggal 22 Oktober.\n` +
          `• Mengenang Resolusi Jihad 22 Oktober 1945 oleh Hadratus Syekh KH Hasyim Asy'ari.\n` +
          `Jawablah dengan lugas, santai, dan akrab ala santri Arrisalah!`,
      };
    }

    // 2. TANYA ULANG TAHUN / MILAD (HARI INI / BULAN INI / TERDEKAT)
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
          "Juli", "Agustus", "September", "Oktober", "November", "Desember",
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

        upcomingCelebrants.sort((a, b) => a.daysLeft - b.daysLeft);

        let summaryText = `FAKTA ULANG TAHUN ALUMNI EXPEDIENT 43 (HARI INI: ${currentDay} ${monthNames[currentMonth - 1]} ${currentYear}):\n`;

        if (todayCelebrants.length > 0) {
          summaryText +=
            `🎉 HARI INI BERULANG TAHUN:\n` +
            todayCelebrants.map((c) => `• ${c.fullName} (${c.nick}) ke-${c.turningAge} tahun (Hari ini!)`).join("\n") +
            `\n\n`;
        } else {
          summaryText += `• Hari ini tidak ada yang berulang tahun.\n`;
        }

        const topUpcoming = upcomingCelebrants.slice(0, 5);
        summaryText +=
          `🎂 DAFTAR ULANG TAHUN TERDEKAT MENDATANG:\n` +
          topUpcoming
            .map(
              (c, i) =>
                `${i + 1}. *${c.nick}* (${c.fullName}) — Tanggal ${c.dateStr} (Kurang ${c.daysLeft} hari lagi / H-${c.daysLeft}, Usia ${c.turningAge} Th)`
            )
            .join("\n") +
          `\n\nJawablah dengan menyebutkan siapa yang paling terdekat secara jelas dan ramah!`;

        return {
          category: "birthday",
          summary: summaryText,
          data: { todayCelebrants, upcomingCelebrants: topUpcoming },
        };
      }
    }

    // 3. TANYA BAITUL MAAL / KAS ANGKATAN / TRANSPARANSI KEUANGAN / REKENING
    if (
      lower.includes("baitul maal") ||
      lower.includes("baitul mal") ||
      lower.includes("kas angkatan") ||
      lower.includes("uang kas") ||
      lower.includes("saldo kas") ||
      lower.includes("saldo baitul") ||
      lower.includes("rekening kas") ||
      lower.includes("rekening donasi") ||
      lower.includes("donasi angkatan") ||
      lower.includes("laporan keuangan")
    ) {
      const { data: txList } = await supabase
        .from("baitul_maal_transactions")
        .select("amount, transaction_type, status, category, description")
        .eq("status", "COMPLETED");

      let totalIn = 0;
      let totalOut = 0;
      if (txList) {
        for (const t of txList) {
          const val = Number(t.amount) || 0;
          if (t.transaction_type === "IN") totalIn += val;
          if (t.transaction_type === "OUT") totalOut += val;
        }
      }
      const saldo = totalIn - totalOut;

      // Ambil info rekening resmi
      const { data: bankInfo } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("content_key", "baitul_maal_bank_accounts")
        .maybeSingle();

      let bankSummary = "Rekening Resmi: Hubungi Bendahara Angkatan atau cek portal";
      if (bankInfo?.content_value) {
        try {
          const parsed = typeof bankInfo.content_value === "string" ? JSON.parse(bankInfo.content_value) : bankInfo.content_value;
          if (Array.isArray(parsed) && parsed.length > 0) {
            bankSummary = parsed.map((b: any) => `• ${b.bank_name || b.bank}: *${b.account_number || b.rekening}* a.n. *${b.account_holder || b.atas_nama}*`).join("\n");
          }
        } catch {
          // fallback string
          bankSummary = String(bankInfo.content_value);
        }
      }

      return {
        category: "baitul_maal",
        summary:
          `FAKTA TRANSPARANSI KEUANGAN BAITUL MAAL EXPEDIENT 43:\n` +
          `• Saldo Kas Terverifikasi Saat Ini: *${formatRupiah(saldo)}*\n` +
          `• Total Dana Terkumpul (Pemasukan): ${formatRupiah(totalIn)}\n` +
          `• Total Dana Tersalurkan (Pengeluaran/Operasional): ${formatRupiah(totalOut)}\n` +
          `• Rekening Donasi & Kas Resmi:\n${bankSummary}\n` +
          `• Program Utama: Kas Rutin Angkatan, Ta'awun Sosial/Kesehatan, Safari Silaturahmi.\n` +
          `• Transparansi Lengkap & Unduh Laporan CSV: https://expedientgeneration.vercel.app/baitul-maal`,
        data: { saldo, totalIn, totalOut },
      };
    }

    // 4. TANYA SYNDICATE / PELUANG KARIR / BISNIS ALUMNI / LOKER
    if (
      lower.includes("syndicate") ||
      lower.includes("loker") ||
      lower.includes("lowongan") ||
      lower.includes("karir") ||
      lower.includes("bisnis alumni") ||
      lower.includes("usaha alumni") ||
      lower.includes("kolaborasi")
    ) {
      const { data: syndicateItems } = await supabase
        .from("syndicate")
        .select("title, category, company, description, contact")
        .limit(4);

      let syndicateSummary = `FAKTA EXPEDIENT SYNDICATE (Jejaring Bisnis & Karir Angkatan):\n`;
      if (syndicateItems && syndicateItems.length > 0) {
        syndicateSummary += syndicateItems
          .map((item) => `• *${item.title}* (${item.category || "Usaha"}) - ${item.company || "Alumni"} | Info: ${item.contact || "-"}`)
          .join("\n");
      } else {
        syndicateSummary += `• Wadah sinergi dan kolaborasi profesional alumni Expedient 43.\n`;
      }
      syndicateSummary += `\n• Jelajahi atau pasang lowongan/bisnis antum di: https://expedientgeneration.vercel.app/syndicate`;

      return {
        category: "syndicate",
        summary: syndicateSummary,
        data: syndicateItems,
      };
    }

    // 5. TANYA CITA-CITA / PROFESI / KAMPUS / KULIAH ALUMNI
    if (
      lower.includes("cita-cita") ||
      lower.includes("cita cita") ||
      lower.includes("yang mau jadi") ||
      lower.includes("siapa yang mau jadi") ||
      lower.includes("siapa yang jadi") ||
      lower.includes("yang jadi dokter") ||
      lower.includes("yang jadi tentara") ||
      lower.includes("yang jadi polisi") ||
      lower.includes("yang jadi guru") ||
      lower.includes("yang jadi ustadz") ||
      lower.includes("yang kuliah di") ||
      lower.includes("jurusan")
    ) {
      // Ekstrak kata kunci profesi yang ditanyakan
      const careerKeywords = ["dokter", "tentara", "tni", "polisi", "guru", "ustadz", "arsitek", "dosen", "bisnis", "programmer", "pilot", "diplomat", "hukum", "presiden", "ulama"];
      const matchedKeyword = careerKeywords.find((k) => lower.includes(k));

      if (matchedKeyword) {
        const { data: matchedCareer } = await supabase
          .from("profiles")
          .select("nama_lengkap, nama_panggilan, cita_cita, alamat_lengkap")
          .ilike("cita_cita", `%${matchedKeyword}%`)
          .limit(6);

        if (matchedCareer && matchedCareer.length > 0) {
          const listStr = matchedCareer
            .map((p) => `• *${(p.nama_panggilan || p.nama_lengkap).trim()}* (${p.nama_lengkap}): Cita-cita "${p.cita_cita}"`)
            .join("\n");
          return {
            category: "profile",
            summary: `FAKTA CITA-CITA ALUMNI TERKAIT "${matchedKeyword.toUpperCase()}":\n${listStr}\n\nSemoga Allah meridhoi dan memudahkan cita-cita mulia sahabat-sahabat kita!`,
            data: matchedCareer,
          };
        }
      }
    }

    // 6. TANYA PANCA JIWA, FALSAFAH PONDOK ARRISALAH & MAHFUDZOT
    if (
      lower.includes("panca jiwa") ||
      lower.includes("motto pondok") ||
      lower.includes("falsafah") ||
      lower.includes("semboyan") ||
      lower.includes("sejarah arrisalah") ||
      lower.includes("mahfudzot") ||
      lower.includes("kata mutiara") ||
      lower.includes("nasihat pondok") ||
      lower.includes("jiilul hashiif") ||
      lower.includes("makna expedient")
    ) {
      return {
        category: "philosophy",
        summary:
          `FALSAFAH & NILAI LUHUR ALMAMATER PONDOK MODERN ARRISALAH SLAHUNG PONOROGO:\n` +
          `• Julukan Angkatan: *Jiilul Hashiif* (جيل الحصيف) — Generasi yang Cerdas, Bijaksana, Berani, dan Tangkas (The Expedient / The Successors), Tamat 2025.\n` +
          `• Panca Jiwa Pondok:\n` +
          `  1. *Keikhlasan*: Bekerja dan beribadah semata-mata karena Allah SWT tanpa pamrih.\n` +
          `  2. *Kesederhanaan*: Bersahaja, tabah, dan kaya hati (bukan berarti pasif atau melarat).\n` +
          `  3. *Berdikari (Kemandirian)*: Sanggup menolong diri sendiri, berjiwa swasembada, tidak bergantung pada orang lain.\n` +
          `  4. *Ukhuwah Islamiyah*: Persaudaraan mukmin yang kokoh, saling tolong-menolong laksana satu tubuh.\n` +
          `  5. *Kebebasan*: Berpikir merdeka, berjiwa besar, berpandangan luas dalam koridor syariat Islam.\n` +
          `• Falsafah Hidup: "Berani hidup tak takut mati, takut mati jangan hidup, takut hidup mati saja!" & "Apa yang kau lihat, kau dengar, kau rasakan di pondok adalah pendidikan."\n` +
          `• Mahfudzot Pilihan: "مَنْ جَدَّ وَجَدَ" (Siapa yang bersungguh-sungguh pasti berhasil), "مَنْ صَبَرَ ظَفِرَ" (Siapa yang bersabar pasti beruntung).`,
      };
    }

    // 7. TANYA BUKU TAMU / TITIP SALAM
    if (
      lower.includes("buku tamu") ||
      lower.includes("guestbook") ||
      lower.includes("titip salam") ||
      lower.includes("titip pesan")
    ) {
      const { data: messages } = await supabase
        .from("buku_tamu")
        .select("nama_pengirim, pesan, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      let guestSummary = `FAKTA BUKU TAMU EXPEDIENT 43:\n`;
      if (messages && messages.length > 0) {
        guestSummary += `Pesan-pesan hangat terbaru dari kawan alumni:\n` +
          messages.map((m) => `• *${m.nama_pengirim || "Sahabat"}*: "${m.pesan}"`).join("\n") +
          `\n\n`;
      }
      guestSummary += `Titip pesan atau kirim salam rindu untuk seangkatan di: https://expedientgeneration.vercel.app/buku-tamu`;

      return {
        category: "guestbook",
        summary: guestSummary,
        data: messages,
      };
    }

    // 8. TANYA TOTAL ALUMNI / STATISTIK ANGKATAN
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
        summary:
          `FAKTA STATISTIK ANGKATAN EXPEDIENT 43:\n` +
          `• Total Alumni Terdaftar: *${count || 79} alumni*\n` +
          `• Alumni Putra: ${putraCount || 45} sahabat\n` +
          `• Alumni Putri: ${putriCount || 34} sahabat\n` +
          `• Kelulusan: Pondok Modern Arrisalah Slahung Ponorogo (Tahun 2025)\n` +
          `• Direktori Lengkap: https://expedientgeneration.vercel.app/direktori`,
        data: { count, putraCount, putriCount },
      };
    }

    // 9. TANYA KANAL YOUTUBE / VIDEO PANGGUNG GEMBIRA 643 / DOKUMENTER (JIILUL HASHIIF)
    if (
      lower.includes("youtube") ||
      lower.includes("yt") ||
      lower.includes("channel") ||
      lower.includes("kanal") ||
      lower.includes("panggung gembira") ||
      lower.includes("pg 643") ||
      lower.includes("jiilul hashiif") ||
      lower.includes("jiilulhashiif") ||
      (lower.includes("video") &&
        (lower.includes("tonton") ||
          lower.includes("rekaman") ||
          lower.includes("lagu") ||
          lower.includes("tari") ||
          lower.includes("nasyid") ||
          lower.includes("reog") ||
          lower.includes("saman") ||
          lower.includes("drama")))
    ) {
      return {
        category: "general",
        summary:
          `FAKTA KANAL YOUTUBE RESMI & DOKUMENTASI MAHAKARYA PG 643:\n` +
          `• Nama Kanal Resmi Angkatan 43: Expedient Generation (@JiilulHashiif)\n` +
          `• Tautan YouTube: https://www.youtube.com/@JiilulHashiif\n` +
          `• Makna Nama: "Jiilul Hashiif" (جيل الحصيف) adalah julukan angkatan 43 dalam bahasa Arab yang berarti Generasi yang Cerdas, Bijaksana, dan Tangkas (The Expedient / The Successors).\n` +
          `• Isi Kanal: Memuat 15 video dokumentasi lengkap pagelaran akbar Panggung Gembira 643 (PG 643) Pondok Modern Arrisalah Slahung Ponorogo.\n` +
          `• Video-Video Populer: Grand Opening Spektakuler, Tari Saman kilat, Reog Ponorogo kolosal, Drama Buya Hamka, Nasyid merdu menggetarkan jiwa, Tari Kecak, Campursantri, hingga Modern Dance Jabbawockeez.\n` +
          `• Pemutar Video Web: Seluruh video ini juga bisa ditonton langsung di beranda portal angkatan kita: https://expedientgeneration.vercel.app`,
      };
    }

    // 10. TANYA FITUR WEBSITE / PORTAL / CARA PAKAI
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
        summary:
          `PANDUAN FITUR PORTAL EXPEDIENT 43 (https://expedientgeneration.vercel.app):\n` +
          `1. 📱 *Direktori Alumni*: Cari profil, nomor WA, domisili kawan seangkatan.\n` +
          `2. 📸 *Galeri Masa Pondok*: Nostalgia kenangan indah masa nyantri.\n` +
          `3. 🎬 *Bioskop Mahakarya PG 643*: Pemutar video interaktif dokumentasi Panggung Gembira 643 (@JiilulHashiif).\n` +
          `4. 💰 *Baitul Maal*: Laporan kas transparan, donasi online, dan ta'awun kesehatan.\n` +
          `5. 💼 *Expedient Syndicate*: Jejaring karir, lowongan kerja, dan kolaborasi bisnis alumni.\n` +
          `6. ✍️ *Buku Tamu Online*: Titip salam dan pesan persahabatan antar alumni.\n` +
          `7. 📖 *Asmaul Husna & Doa*: Renungan 99 Asmaul Husna, arah kiblat & waktu sholat digital.\n` +
          `8. 🤖 *AI Photobooth*: Generator foto seru alumni bertenaga AI.`,
      };
    }

    // 11. TANYA AGENDA / REUNI / ACARA
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

    // 12. TANYA DAERAH / KOTA / DOMISILI (Dukungan Kota Dinamis & Static Array)
    const lowerWords = new Set(tokenizeWords(messageText));
    // Cek kota statis dulu
    for (const city of KNOWN_CITIES) {
      if (lowerWords.has(city)) {
        const { data: matchedCity } = await supabase
          .from("profiles")
          .select("nama_lengkap, nama_panggilan, alamat_lengkap, no_whatsapp")
          .or(`alamat_lengkap.ilike.%${city}%,tempat_lahir.ilike.%${city}%`)
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

    // Jika ada frasa "tinggal di X", "yang di X", "anak X"
    const cityInquiryMatch = lower.match(/(?:tinggal|domisili|asal|anak|yang)\s+(?:di\s+)?([a-z]{3,20})/i);
    if (cityInquiryMatch && cityInquiryMatch[1]) {
      const candidateCity = cityInquiryMatch[1].toLowerCase();
      if (!COMMON_STOPWORDS.has(candidateCity) && candidateCity.length >= 4) {
        const { data: dynamicMatched } = await supabase
          .from("profiles")
          .select("nama_lengkap, nama_panggilan, alamat_lengkap, no_whatsapp")
          .or(`alamat_lengkap.ilike.%${candidateCity}%,tempat_lahir.ilike.%${candidateCity}%`)
          .limit(6);

        if (dynamicMatched && dynamicMatched.length > 0) {
          const names = dynamicMatched
            .map((p) => `• *${(p.nama_panggilan || p.nama_lengkap).trim()}* (${p.alamat_lengkap || candidateCity})`)
            .join("\n");
          return {
            category: "city",
            summary: `FAKTA DOMISILI DAERAH ${candidateCity.toUpperCase()} (${dynamicMatched.length} alumni terdata):\n${names}`,
            data: dynamicMatched,
          };
        }
      }
    }

    // 13. COREFERENCE RESOLUTION DARI RIWAYAT OBROLAN (MULTI-TURN MEMORY)
    // Jika pertanyaan pengguna adalah pertanyaan lanjutan tanpa menyebut nama eksplisit
    // Contoh: "umurnya berapa?", "tinggal dimana?", "minta wa nya dong", "dia siapa?", "cita-citanya apa?"
    const isFollowUpInquiry =
      lower.includes("umur") ||
      lower.includes("usia") ||
      lower.includes("kapan lahir") ||
      lower.includes("dimana") ||
      lower.includes("asal") ||
      lower.includes("tinggal") ||
      lower.includes("nomor") ||
      lower.includes("kontak") ||
      lower.includes("wa") ||
      lower.includes("cita") ||
      lower.includes("pekerjaan") ||
      lower.includes("kerja") ||
      lower.includes("dia siapa") ||
      lower.includes("siapa dia") ||
      lower.includes("fotonya") ||
      lower.includes("ig") ||
      lower.includes("instagram");

    const nameIndex = await getProfileNameIndex(supabase);

    if (isFollowUpInquiry && (rawChatHistory?.length || recentChatContext)) {
      // Ambil teks dari riwayat pesan sebelumnya untuk mendeteksi siapa yang barusan dibicarakan
      const previousTexts: string[] = [];
      if (rawChatHistory && Array.isArray(rawChatHistory)) {
        for (const item of rawChatHistory.slice(-4)) {
          if (item?.messageText && item.messageText.trim() !== messageText.trim()) {
            previousTexts.push(item.messageText);
          }
        }
      } else if (recentChatContext) {
        previousTexts.push(recentChatContext);
      }

      for (const prevText of previousTexts.reverse()) {
        const prevTokens = tokenizeWords(prevText).filter((w) => w.length >= 3 && !COMMON_STOPWORDS.has(w));
        for (const token of prevTokens) {
          let hits = nameIndex.filter((p) => p.nickWords.has(token));
          if (hits.length === 0) hits = nameIndex.filter((p) => p.nameWords.has(token));
          if (hits.length > 0 && hits.length <= 3) {
            const candidate = hits[0];
            const { data: resolvedProfile } = await supabase
              .from("profiles")
              .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat_lengkap, no_whatsapp, cita_cita, motivasi_hidup, akun_ig")
              .eq("id", candidate.id)
              .maybeSingle();

            if (resolvedProfile) {
              const ageStr = resolvedProfile.tanggal_lahir ? calculateAge(resolvedProfile.tanggal_lahir) : "Belum dicantumkan";
              const detail =
                `• *${(resolvedProfile.nama_lengkap || "").trim()}* (Panggilan: *${(resolvedProfile.nama_panggilan || "").trim()}*)\n` +
                `  - Usia: ${ageStr}\n` +
                `  - Tempat, Tgl Lahir: ${resolvedProfile.tempat_lahir || "-"}, ${resolvedProfile.tanggal_lahir || "-"}\n` +
                `  - Asal/Domisili: ${(resolvedProfile.alamat_lengkap || "-").trim()}\n` +
                `  - Cita-cita: ${(resolvedProfile.cita_cita || "-").trim()}\n` +
                `  - Motivasi: ${(resolvedProfile.motivasi_hidup || "-").trim()}\n` +
                `  - Instagram: ${(resolvedProfile.akun_ig || "-").trim()}\n` +
                `  - WhatsApp: ${resolvedProfile.no_whatsapp ? `+${resolvedProfile.no_whatsapp}` : "-"}`;

              return {
                category: "profile",
                summary: `FAKTA PROFIL YANG SEDANG DIBICARAKAN (Konteks Lanjutan):\n${detail}\n\nJawablah pertanyaan lanjutan pengguna tentang sahabat ini secara tepat dan lugas!`,
                data: resolvedProfile,
              };
            }
          }
        }
      }
    }

    // 14. PENCARIAN PROFIL SPESIFIK BERDASARKAN KATA KUNCI NAMA DALAM PESAN
    // HANYA cocokkan kata UTUH dengan nama/panggilan alumni (bukan potongan substring!)
    const cleanTokens = Array.from(
      new Set(tokenizeWords(messageText).filter((w) => w.length >= 3 && !COMMON_STOPWORDS.has(w)))
    );

    if (cleanTokens.length > 0) {
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
              `  - Tempat, Tgl Lahir: ${p.tempat_lahir || "-"}, ${p.tanggal_lahir || "-"}\n` +
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
    summary: `INFORMASI ANGKATAN:\nExpedient Generation 43 (Jiilul Hashiif) adalah ikatan alumni Pondok Modern Arrisalah Slahung Ponorogo lulusan tahun 2025. Motto: "The Successors" (Keluarga, Ukhuwah, & Prestasi). Portal resmi: https://expedientgeneration.vercel.app`,
  };
}

/**
 * Generator Respons Cerdas Bertenaga Gemini AI dengan Memori Multi-Turn & RAG Angkatan
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

  // Ambil buffer riwayat obrolan (berfungsi untuk Grup maupun Private 1-on-1)
  const activeChatId = groupId || (!isGroup ? senderPhone : undefined);
  let recentChatContext = "";
  let rawChatHistory: any[] = [];

  if (activeChatId) {
    try {
      const { getRecentGroupChatHistory, formatChatHistoryForSummary } = await import(
        "@/lib/whatsapp/groupConversationBuffer"
      );
      const hist = await getRecentGroupChatHistory(activeChatId, 8);
      rawChatHistory = hist;
      const filtered = hist.filter(
        (m) => !(m.senderPhone === senderPhone && m.messageText.trim() === messageText.trim())
      );
      if (filtered.length > 0) {
        recentChatContext = formatChatHistoryForSummary(filtered.slice(-6));
      }
    } catch (_) {}
  }

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
   - Warm, friendly, intelligent, like a close classmate / santri alumnus.
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

  // 1. Dapatkan fakta database faktual dengan mempertimbangkan multi-turn memory & quoted message
  let fact: CohortFactContext = {
    category: "general",
    summary: `Expedient Generation 43 Alumni 2025 Pondok Modern Arrisalah Slahung Ponorogo`,
  };
  try {
    fact = await resolveCohortContext(messageText, senderName, recentChatContext, rawChatHistory);
    if (fact.category === "general" && quotedText && !quotedFromBot) {
      const quotedFact = await resolveCohortContext(quotedText, senderName, recentChatContext, rawChatHistory);
      if (quotedFact.category !== "general") fact = quotedFact;
    }
  } catch (_) {}

  // Deteksi apakah ini obrolan lanjutan multi-turn agar bot tidak mengulang salam template
  const isMultiTurnOngoing = rawChatHistory.length >= 2;

  const prompt = `
You are the official, highly intelligent, charismatic, and friendly AI Companion of "Expedient Generation 43" (Alumni of Pondok Modern Arrisalah Slahung Ponorogo, Class of 2025, known as "Jiilul Hashiif" / "The Successors").
Current Year: 2026.

USER CONTEXT:
- Name: ${senderName || "Sahabat"}
- Channel: ${isGroup ? "WhatsApp Group Chat (⚔️successors⚔️)" : "WhatsApp Private Chat (1-on-1)"}
- User's Current Message: "${messageText}"
${quotedText ? `- Pesan Teman Yang Sedang Di-Reply/Quote (Pengirim: ${quotedSender || "teman"}): "${quotedText}"\n  (PERHATIAN: Pengguna sedang me-reply langsung pesan temannya di atas sambil memanggil bot. Jawablah dengan memahami pertanyaan/topik dari pesan temannya tersebut!)` : ""}
${recentChatContext ? `- Riwayat Percakapan Sebelumnya (Sebagai Alur Konteks Obrolan Multi-Turn):\n${recentChatContext}\n` : ""}

RESOLVED KNOWLEDGE / DATABASE FACTS:
${fact.summary}

STRICT INTELLIGENCE & COMMUNICATION GUIDELINES:
1. NATURAL CONVERSATION & MULTI-TURN AWARENESS:
   - You have active memory! If the user asks a follow-up question ("umurnya berapa?", "tinggal dimana?", "minta wa nya", "dia siapa?"), connect it directly to the person or topic just discussed.
   - ${
     isMultiTurnOngoing
       ? "DO NOT repeat introductory greetings or robot templates like 'Halo Sahabat X! Saya adalah bot...' because you are already in an active continuous conversation! Jump directly into the answer naturally."
       : "Greet the user warmly by name in a friendly, respectful manner."
   }
2. CHANNEL BREVITY:
   - ${
     isGroup
       ? "FOR GROUP CHAT: Keep your reply EXTREMELY CRISP (1 to 2 sentences max!). Never spam the group with long essays."
       : "FOR PRIVATE CHAT: Keep your answer warm, helpful, and concise (2 to 4 sentences). Provide relevant follow-up details if asked."
   }
3. TONE & SANTRI PEER PERSONA:
   - Warm, clever, respectful, and humorous like a genuine classmate from Pondok Arrisalah.
   - Seamless Indonesian with natural santri/pesantren warmth (e.g., 'Alhamdulillah', 'InsyaAllah', 'Barakallahu fiik') and friendly Javanese touches ('monggo', 'nggih', 'sedulur') when appropriate.
   - Understands common santri terms (nyantri, mukim, roan, mudabbir, qism, asatidz, mahfudzot).
4. ACCURACY & ANTI-HALLUCINATION:
   - The DATABASE FACTS above are strictly verified. Use them to answer factually and accurately.
   - If the facts are not related to what the user asked, answer naturally based on what they said without forcing database data.
   - NEVER invent fake gossip, jobs, marital status, or contact details about any alumni. If you don't know, honestly say you don't know and suggest checking the directory.
   - When asked about Baitul Maal / kas, cite the exact verified balance and bank details from the facts.
5. WHATSAPP FORMATTING ONLY:
   - Use *bold* for names, dates, amounts, and key points.
   - Use _italic_ for Arabic phrases or emphasis.
   - NEVER use markdown headers like '#', '##', or HTML tags like '<div>', '<br>'.
   - Keep emojis expressive and natural (😊, 🤝, 🎓, ✨, 🤲).
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

  // Fallback tangkas jika AI offline / rate limit
  if (fact.category === "agenda") {
    const mainFact = fact.summary.split("\n").find((l) => l.startsWith("•"))?.replace("•", "").trim();
    return `📅 ${mainFact || "Hari Santri Nasional diperingati setiap tanggal 22 Oktober ya sahabat! 🙌✨"}`;
  }
  if (fact.category === "birthday") {
    return `🎂 ${fact.summary.split("\n")[1] || "Ada sahabat kita yang milad! Barakallahu fii umrik."}`;
  }
  if (fact.category === "baitul_maal") {
    return `💰 Saldo kas Baitul Maal Expedient 43 saat ini terverifikasi di sistem. Info selengkapnya bisa dicek transparan di portal kas angkatan ya!`;
  }
  if (fact.category === "profile" && fact.data) {
    const p = Array.isArray(fact.data) ? fact.data[0] : fact.data;
    return `Sahabat *${p.nama_panggilan || p.nama_lengkap}* domisili di ${p.alamat_lengkap || "Ponorogo"}.`;
  }

  // Jika pesan di grup: respons singkat dan natural, JANGAN spam website URL yang sama terus!
  const lowerMsgText = messageText.toLowerCase();
  if (isGroup) {
    if (lowerMsgText.includes("halo") || lowerMsgText.includes("hai") || lowerMsgText.includes("tes")) {
      return `Halo juga Sahabat *${senderName}*! Ada yang bisa dibantu untuk kawan-kawan? 😊🙌`;
    }
    return `Iya Sahabat *${senderName}*! Ada yang mau ditanyakan atau diobrolin seputar angkatan kita? 😊`;
  }

  return `Halo Sahabat *${senderName}*! Ada yang bisa kubantu seputar info kawan-kawan Expedient 43? Silakan tanyakan ya! 😊`;
}
