import { callGeminiResilient } from "@/lib/geminiResilient";
import { getDesignGroupId, sendWhatsAppGroupMessage } from "@/lib/whatsapp";
import {
  getUpcomingDesignCalendar,
  UpcomingItem,
  COMMEMORATIVE_EVENTS,
} from "@/lib/whatsapp/designCalendar";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Memeriksa apakah suatu ID grup adalah Grup Graphic Design Expedient
 */
export function isDesignGroupId(groupId: string): boolean {
  if (!groupId) return false;
  const designId = getDesignGroupId();
  return (
    groupId.trim() === designId ||
    groupId.includes("120363404648728200") ||
    designId.includes(groupId.replace("@g.us", ""))
  );
}

/**
 * Filter Cerdas: Memeriksa apakah bot harus merespons di dalam Grup Graphic Design
 * ATURAN MUTLAK: JANGAN ikut nimbrung jika TIDAK di-tag atau TIDAK dipanggil langsung!
 * Anggota tim desainer bebas ngobrol santai antar mereka tanpa diganggu bot.
 */
export function shouldDesignBotRespond(messageText: string): boolean {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Tag / Mention Bot SPESIFIK (@bot, @89675010185, @85151771289, @105240321908772, @min, @admin)
  // JANGAN gunakan lower.includes("@") acak agar tidak ikut nimbrung saat anggota tag anggota lain!
  if (
    lower.includes("105240321908772") ||
    lower.includes("85151771289") ||
    lower.includes("89675010185") ||
    lower.includes("@bot") ||
    lower.includes("@min") ||
    lower.includes("@admin") ||
    lower.includes("@expedient")
  ) {
    return true;
  }

  // 2. Command Prefix (!, /, #, ?)
  if (
    messageText.startsWith("!") ||
    messageText.startsWith("/") ||
    messageText.startsWith("?") ||
    messageText.startsWith("#")
  ) {
    return true;
  }

  // 3. Panggilan eksplisit kepada bot di awal kalimat atau panggilan langsung
  if (
    lower.startsWith("bot ") ||
    lower.startsWith("bot,") ||
    lower.startsWith("min ") ||
    lower.startsWith("min,") ||
    lower === "bot" ||
    lower === "min" ||
    lower.startsWith("halo bot") ||
    lower.startsWith("hai bot") ||
    lower.startsWith("tes bot") ||
    lower.startsWith("p bot") ||
    /(^|\s)(bot|min)[?!,.]*$/i.test(lower)
  ) {
    return true;
  }

  // 4. Permintaan Desain & Pertanyaan Faktual Terarah di Grup Desain
  if (
    lower.startsWith("siapa ") ||
    lower.startsWith("siapakah ") ||
    lower.startsWith("buatkan ") ||
    lower.startsWith("bikin ") ||
    lower.startsWith("buatin ") ||
    lower.startsWith("bikinin ") ||
    lower.startsWith("desainin ") ||
    lower.startsWith("desainkan ") ||
    lower.startsWith("gambar ") ||
    lower.startsWith("poster ") ||
    lower.startsWith("jadwal") ||
    lower.includes("buatkan poster") ||
    lower.includes("bikin poster") ||
    lower.includes("buatin poster") ||
    lower.includes("bikinin poster") ||
    lower.includes("buat poster") ||
    lower.includes("desain poster") ||
    lower.includes("buatin desain") ||
    lower.includes("bikinin desain") ||
    lower.includes("laiya") ||
    lower.includes("iya buatin") ||
    lower.includes("siapa zaki") ||
    lower.includes("siapa elhora") ||
    lower.includes("hari santri") ||
    lower.includes("hut tni") ||
    lower.includes("hari ibu")
  ) {
    return true;
  }

  // Jika anggota saling mengobrol santai antar sesama anggota:
  // JANGAN NIMBRUNG / DIAM! Biarkan mereka bebas berdiskusi & mengobrol santai.
  return false;
}

/**
 * Memformat pesan Alert Desain yang menyertakan tag @semua, copywriting siap pakai,
 * link 1-klik ke moodboard Pinterest & Google Images, serta Aset Poster Siap Posting (Story & Feed).
 */
export function formatDesignAlertMessage(item: UpcomingItem): string {
  const urgencyLabel =
    item.daysLeft === 0
      ? "🚨 *HARI INI (WAKTU PUBLISH!)*"
      : item.daysLeft === 1
      ? "⚠️ *BESOK (H-1 - FINAL DRAFT & REVIEW)*"
      : `⏳ *H-${item.daysLeft} (PERINGATAN DINI - MULAI CICIL KONSEP)*`;

  const paletteStr = item.colorPalette.join("  |  ");

  let copySample = "";
  if (item.type === "birthday" && item.extraData) {
    copySample =
      `• *Headline:* Barakallahu Fii Umrik, Sahabat ${item.extraData.nickname}! 🎂✨\n` +
      `• *Subheadline:* Selamat Milad ke-${item.extraData.age} Tahun\n` +
      `• *Doa:* "Semoga senantiasa dalam limpahan berkah, kesehatan, dan kesuksesan dunia akhirat. Tetap menjadi inspirasi bagi keluarga besar Expedient Generation 43."`;
  } else {
    copySample =
      `• *Headline:* Memperingati ${item.title}\n` +
      `• *Kutipan:* "${item.description}"\n` +
      `• *Signature:* Expedient Generation 43 — The Successors`;
  }

  let assetSection = "";
  if (item.type === "birthday" && item.extraData?.profileUrl) {
    assetSection =
      `\n👤 *Aset Foto Resmi Alumni (HD):*\n` +
      `🔗 ${item.extraData.profileUrl}\n` +
      `_(Buka link di atas untuk ambil foto profil kualitas tinggi sahabat yang milad!)_\n`;
  }

  let readyPostersSection = "";
  if (item.storyImageUrl || item.feedImageUrl) {
    readyPostersSection =
      `\n🖼️ *DESAIN POSTER SIAP UPLOAD (TINGGAL TERIMA JADI):*\n` +
      (item.storyImageUrl ? `• 📱 *Story IG (9:16 / 1080x1920):*\n  🔗 ${item.storyImageUrl}\n` : "") +
      (item.feedImageUrl ? `• 📸 *Feed IG (1:1 / 1080x1080):*\n  🔗 ${item.feedImageUrl}\n` : "") +
      `_(Desain resmi sudah dibuat & siap langsung diposting ke medsos! Mantap!)_\n`;
  }

  return (
    `📢 @semua *[CALL FOR EDITORS - EXPEDIENT CREATIVE STUDIO]* 🎨✨\n\n` +
    `${urgencyLabel}\n` +
    `📅 *Tanggal:* ${item.dateStr}\n` +
    `🎯 *Agenda Desain:* *${item.title}* (${item.category})\n\n` +
    `📝 *Copywriting Siap Pakai (Tinggal Tempel):*\n` +
    `${copySample}\n\n` +
    `🎨 *Mood & Konsep Desain:*\n` +
    `• *Tema:* ${item.suggestedTheme}\n` +
    `• *Palet Warna (Hex):* ${paletteStr}\n` +
    `• *Format Rasio:* Feed Instagram (1:1) & WhatsApp Story (9:16)\n` +
    readyPostersSection +
    assetSection +
    `\n💡 *Moodboard & Referensi Visual Cepat (1-Klik):*\n` +
    `📌 *Pinterest Moodboard:* ${item.pinterestUrl}\n` +
    `🔍 *Google Images:* ${item.googleImagesUrl}\n\n` +
    `Ayo tim desainer, yang mau edit atau langsung posting desain di atas monggo gaspol! Semangat berkarya! 🚀🔥`
  );
}

/**
 * Pengecekan Harian (Cron): Mengirim alert otomatis ke grup desain untuk H-3, H-1, dan Hari-H
 */
export async function runDailyDesignAlerts(): Promise<{
  success: boolean;
  sentCount: number;
  alerts: string[];
}> {
  const designGroupId = getDesignGroupId();
  const upcoming = await getUpcomingDesignCalendar(4);
  const alertsSent: string[] = [];

  // Filter hanya yang H-3, H-1, atau Hari-H (daysLeft === 3 || 1 || 0)
  const targetItems = upcoming.filter(
    (item) => item.daysLeft === 0 || item.daysLeft === 1 || item.daysLeft === 3
  );

  for (const item of targetItems) {
    const alertMsg = formatDesignAlertMessage(item);
    let sendRes: { success: boolean; reason?: string } = { success: false };

    // Jika memiliki gambar poster siap jadi, kirim langsung sebagai media gambar WhatsApp!
    if (item.storyImageUrl) {
      const { sendWhatsAppGroupMedia } = await import("@/lib/whatsapp");
      sendRes = await sendWhatsAppGroupMedia(designGroupId, alertMsg, item.storyImageUrl);
    } else {
      sendRes = await sendWhatsAppGroupMessage(designGroupId, alertMsg);
    }

    if (sendRes.success) {
      alertsSent.push(`${item.title} (H-${item.daysLeft})`);
      console.log(`[DESIGN-ALERT-SENT] Sukses kirim alert: ${item.title} ke grup ${designGroupId}`);
    } else {
      console.warn(`[DESIGN-ALERT-FAILED] Gagal kirim alert ${item.title}:`, sendRes.reason);
    }
  }

  return {
    success: true,
    sentCount: alertsSent.length,
    alerts: alertsSent,
  };
}

/**
 * Handler Percakapan Cerdas Khusus Grup Graphic Design:
 * - Menjadi Art Director & Creative Partner yang asik, santai, dan solutif.
 * - Mendukung obrolan santai tim sebagai bagian dari brainstorming alami (TIDAK kaku / tidak menyalahkan).
 * - Menyediakan poster siap posting untuk Feed IG (1:1) dan Story IG (9:16) agar tim bisa terima jadi.
 */
export async function handleDesignStudioConversation(options: {
  senderPhone: string;
  senderName: string;
  messageText: string;
  groupId: string;
}): Promise<string> {
  const { senderName, messageText } = options;
  const lower = messageText.trim().toLowerCase();
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  // 0. FAST INTERCEPT: Deteksi Niat Pembuatan Poster / Desain (Jangan looping chat!)
  const actionRegex = /\b(buatin|bikinin|buatkan|bikin|buat|desainin|desainkan|designkan|gambarin|generate)\b/i;
  const designTargetRegex = /\b(poster|desain|design|gambar|draf|draft|story|feed|flyer|banner)\b/i;
  if (
    (actionRegex.test(lower) && designTargetRegex.test(lower)) ||
    /\b(laiya\s+buatin|iya\s+buatin|ya\s+buatin|gas\s+buatin|cepet\s+buatin|buatin\s+dong|bikinin\s+dong)\b/i.test(lower)
  ) {
    let extractedTopic = lower
      .replace(/^(bot|min|admin)[,:\s]+/i, "")
      .replace(/^(tolong\s+|coba\s+|bisa\s+)?(buatin|bikinin|buatkan|bikin|buat|generate|desainin|desainkan|designkan|gambarin)\s+(poster|desain|design|flyer|banner|gambar|draf|draft)?\s*(dong|lah|sih|ya)?\s*(untuk|tentang|tema|edisi|konsep)?\s*/i, "")
      .replace(/^(laiya\s+buatin|iya\s+buatin|ya\s+buatin|gas\s+buatin|cepet\s+buatin)\s*/i, "")
      .replace(/\s+(dong|lah|sih|ya|bro|gan|min|bot)$/i, "")
      .trim();

    if (!extractedTopic || /^(buatin|bikinin|bikin|buat|poster|desain|story|feed)$/i.test(extractedTopic)) {
      extractedTopic = "Hari Ibu";
    }

    return `[ACTION:GENERATE_POSTER:${extractedTopic}]`;
  }

  // 1. FAST COMMAND: Jadwal / Kalender Poster & Pertanyaan Ultah Terdekat
  if (
    lower.includes("jadwal") ||
    lower.includes("kalender") ||
    lower.includes("agenda poster") ||
    lower.includes("deadline") ||
    lower.includes("ultah") ||
    lower.includes("ulang tahun") ||
    lower.includes("milad") ||
    lower.includes("hari lahir")
  ) {
    const upcoming = await getUpcomingDesignCalendar(30);
    const bdays = upcoming.filter((u) => u.type === "birthday");

    // Jika pertanyaannya spesifik tentang ulang tahun terdekat
    if (lower.includes("ultah") || lower.includes("ulang tahun") || lower.includes("milad") || lower.includes("hari lahir")) {
      if (bdays.length > 0) {
        const nearest = bdays.slice(0, 4);
        let bdayReply = `🎂 *AGENDA MILAD ALUMNI TERDEKAT (STUDIO DESAIN)* 🎨\n\n`;
        bdayReply += `Sahabat yang milad paling dekat:\n`;
        nearest.forEach((b, i) => {
          const dStr =
            b.daysLeft === 0
              ? "🚨 *HARI INI!*"
              : b.daysLeft === 1
              ? "⚠️ *BESOK!*"
              : `⏳ *${b.daysLeft} hari lagi (H-${b.daysLeft})*`;
          bdayReply += `${i + 1}. *${b.title}*\n   📅 Tanggal: ${b.dateStr} (${dStr})\n`;
          if (b.extraData?.fullName) {
            bdayReply += `   👤 Nama: ${b.extraData.fullName}\n`;
          }
        });
        bdayReply += `\n💡 *Aksi Tim Desain:*\nKetik: *@bot foto [nama]* untuk ambil foto profil HD sahabat yang milad untuk dimasukkan ke template poster! 🚀`;
        return bdayReply;
      }
    }

    if (upcoming.length === 0) {
      return (
        `Hai Sahabat *${senderName}*! 👋🎨\n\n` +
        `Dalam 30 hari ke depan belum ada agenda ultah atau hari besar terdekat. Tetap santai dan pantau terus ya! ✨`
      );
    }

    let summaryText = `📅 *AGENDA & JADWAL PRODUKSI POSTER (30 HARI KE DEPAN)* 🎨\n`;
    summaryText += `_Studio Expedient Generation 43_\n\n`;

    upcoming.slice(0, 8).forEach((u, i) => {
      const daysStr =
        u.daysLeft === 0
          ? "🚨 *HARI INI*"
          : u.daysLeft === 1
          ? "⚠️ *BESOK*"
          : `⏳ *H-${u.daysLeft}*`;
      summaryText += `${i + 1}. ${daysStr} — *${u.title}* (${u.dateStr})\n`;
      summaryText += `   Tema: _${u.suggestedTheme.split(",")[0]}_\n`;
      if (u.storyImageUrl) {
        summaryText += `   🖼️ *Poster Siap Pakai:* ${u.storyImageUrl}\n`;
      } else {
        summaryText += `   📌 *Ref:* ${u.pinterestUrl}\n`;
      }
      summaryText += `\n`;
    });

    summaryText += `Ketik: *@bot brief [nama agenda]* untuk paket copywriting & palet warna, atau *@bot foto [nama]* untuk aset foto profil! 🚀`;
    return summaryText;
  }

  // 2. FAST COMMAND: Cek Aset Alumni untuk Ultah / Poster
  if (lower.startsWith("aset ") || lower.startsWith("foto ") || lower.includes("aset ultah") || lower.includes("foto ultah")) {
    const nameQuery = lower.replace(/^(aset|foto|aset ultah|foto ultah)\s+/i, "").trim();
    if (nameQuery) {
      try {
        const supabase = createAdminClient();
        const { data: users } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, nama_panggilan, foto_profil, tanggal_lahir, alamat_lengkap")
          .or(`nama_lengkap.ilike.%${nameQuery}%,nama_panggilan.ilike.%${nameQuery}%`)
          .limit(1);

        if (users && users.length > 0) {
          const u = users[0];
          const nick = u.nama_panggilan || u.nama_lengkap.split(" ")[0];
          return (
            `📁 *ASET RESMI ALUMNI UNTUK POSTER* 🎨\n\n` +
            `• *Nama Lengkap:* ${u.nama_lengkap}\n` +
            `• *Panggilan:* ${nick}\n` +
            `• *Tanggal Lahir:* ${u.tanggal_lahir || "Belum terdata"}\n` +
            `• *Domisili:* ${u.alamat_lengkap || "-"}\n\n` +
            `🖼️ *Foto Profil Resmi (HD):*\n${u.foto_profil || "Belum ada foto profil khusus"}\n\n` +
            `🔗 *Dossier Lengkap Alumni:*\nhttps://expedientgeneration.vercel.app/dossier/${u.id}\n\n` +
            `Tinggal download fotonya untuk dimasukkan ke template Canva/Photoshop ya sahabat editor! 🚀`
          );
        }
      } catch (e) {
        // Fallback ke Gemini
      }
    }
  }

  // 3. AI Cognitive Engine: Head of Creative Design & Studio Lead
  // Ambil konteks event terdekat & fakta database alumni
  let cohortFactSummary = "";
  try {
    const { resolveCohortContext } = await import("@/lib/whatsapp/alumniIntelligence");
    const cohortFact = await resolveCohortContext(messageText, senderName);
    cohortFactSummary = cohortFact.summary;
  } catch (_) {}

  const upcoming = await getUpcomingDesignCalendar(14);
  const eventContext = upcoming.slice(0, 5).map((e) => {
    let s = `- ${e.title} (${e.dateStr}, H-${e.daysLeft})`;
    if (e.storyImageUrl) s += ` [Desain Siap Pakai Tersedia: Story & Feed]`;
    return s;
  }).join("\n");

  const prompt = `
You are the official Creative Studio Partner & Art Director AI of "Expedient Generation 43" in their dedicated Graphic Design / Editors WhatsApp Group.
Your team consists of santri alumni graphic designers and editors who create posters for birthdays, national events, and Islamic holidays.

USER CONTEXT:
- Sender Name: ${senderName}
- User Message: "${messageText}"

DATABASE & COHORT FACTS (USE FOR FACTUAL QUESTIONS):
${cohortFactSummary || "Expedient Generation 43 Alumni 2025 Pondok Modern Arrisalah Slahung Ponorogo"}

UPCOMING EVENTS & READY-TO-POST POSTERS:
${eventContext || "Tidak ada event besar dalam 14 hari ke depan."}
- HUT TNI 5 Oktober:
  • Story IG (9:16): https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hut_tni_story.jpg
  • Feed IG (1:1): https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/hut_tni_feed.jpg
- Kesaktian Pancasila 1 Oktober:
  • Story IG (9:16): https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/kesaktian_pancasila_story.jpg
  • Feed IG (1:1): https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/kesaktian_pancasila_feed.jpg
- Peringatan G30S/PKI 30 September:
  • Story IG (9:16): https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/g30s_pki_story.jpg
  • Feed IG (1:1): https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/g30s_pki_feed.jpg

COMMUNICATION & PERSONALITY GUIDELINES:
1. FACTUAL ACCURACY FIRST:
   - If user asks about who has a birthday, who the leader is, member profiles, dates, statistics, or general questions:
     ALWAYS ANSWER DIRECTLY AND ACCURATELY based on the DATABASE & COHORT FACTS above! Never give random jokes or deflect legitimate questions.
2. CASUAL CHAT & CHILL BRAINSTORMING:
   - For casual greetings, banter, or coffee chats, respond warmly and naturally as an editor studio peer.
3. VISUAL ASSISTANCE & READY-TO-POST POSTERS ("TERIMA JADI"):
   - For poster or design discussions, provide color codes, typography suggestions, and mention ready-to-post links when relevant.
   - Keep answers concise, natural, and helpful (2-4 lines).
`.trim();

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
      },
    };

    const res = await callGeminiResilient(body, geminiApiKey, geminiModel);
    const reply = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (reply) {
      return reply;
    }
  } catch (err: any) {
    console.warn("[DESIGN-STUDIO-AI-WARN]:", err.message);
  }

  return (
    `Siap Sahabat *${senderName}*! Studio Desain Expedient siap sedia. Mau brainstorming ide santai atau butuh link poster siap posting? 🎨✨`
  );
}
