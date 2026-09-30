import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";
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
 */
export function shouldDesignBotRespond(messageText: string): boolean {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Tag / Mention Bot atau Panggilan Tim Desain
  if (
    lower.includes("89675010185") ||
    lower.includes("@bot") ||
    lower.includes("bot") ||
    lower.includes("minbot") ||
    /\bmin\b/i.test(lower) ||
    lower.includes("editor") ||
    lower.includes("desain") ||
    lower.includes("design") ||
    lower.includes("studio") ||
    lower.includes("@")
  ) {
    return true;
  }

  // 2. Command Prefix
  if (
    messageText.startsWith("!") ||
    messageText.startsWith("/") ||
    messageText.startsWith("?") ||
    messageText.startsWith("#")
  ) {
    return true;
  }

  // 3. Sapaan langsung / testing
  if (
    lower === "tes" ||
    lower === "test" ||
    lower === "ping" ||
    lower === "p" ||
    lower.startsWith("p ") ||
    lower.startsWith("halo") ||
    lower.startsWith("hai") ||
    lower.startsWith("assalamu")
  ) {
    return true;
  }

  // 4. Kata Kunci Seputar Desain Grafis, Jadwal, Aset, Brainstorming
  const designKeywords = [
    "poster", "ide", "tema", "warna", "palet", "font", "tipografi",
    "jadwal", "kalender", "agenda", "deadline", "ultah", "ulang tahun",
    "milad", "brief", "aset", "foto", "canva", "photoshop", "illustrator",
    "figma", "revisi", "draft", "karya", "g30s", "santri", "pahlawan",
    "pancasila", "review", "mockup", "feed", "story", "banner", "pamflet",
    "flyer", "ukuran", "resolusi", "gambar", "pinterest", "referensi", "konsep"
  ];
  if (designKeywords.some((kw) => lower.includes(kw))) {
    return true;
  }

  return false;
}

/**
 * Memformat pesan Alert Desain yang menyertakan tag @semua, copywriting siap pakai,
 * dan link 1-klik ke moodboard Pinterest & Google Images.
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
    `• *Format Rasio:* Feed Instagram (1:1 / 1080x1080) & WhatsApp Story (9:16 / 1080x1920)\n` +
    assetSection +
    `\n💡 *Moodboard & Referensi Visual Cepat (1-Klik):*\n` +
    `📌 *Pinterest Moodboard:* ${item.pinterestUrl}\n` +
    `🔍 *Google Images:* ${item.googleImagesUrl}\n\n` +
    `Ayo tim desainer, siapa yang pegang poster ini? Jangan sampai mepet deadline ya sahabat! Semangat berkarya! 🚀🔥`
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
    const sendRes = await sendWhatsAppGroupMessage(designGroupId, alertMsg);

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
 * - Menjaga topik STRICT: Hanya desain grafis, visual, ide poster, tanggal kalender, dan brainstorming.
 * - Jika obrolan melenceng dari desain: Meminta maaf dengan sopan dan meluruskan kembali ke topik desain.
 * - Menyediakan fitur instan: jadwal poster, ide konsep, review poster, aset alumni.
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

  // 1. FAST COMMAND: Jadwal / Kalender Poster
  if (
    lower.includes("jadwal") ||
    lower.includes("kalender") ||
    lower.includes("agenda poster") ||
    lower.includes("deadline") ||
    lower.includes("siapa ultah")
  ) {
    const upcoming = await getUpcomingDesignCalendar(14);
    if (upcoming.length === 0) {
      return (
        `Hai Sahabat *${senderName}*! 👋🎨\n\n` +
        `Dalam 14 hari ke depan tidak ada agenda ultah atau hari besar nasional/Islam terdekat. Tetap siaga dan pantau terus ya! ✨`
      );
    }

    let summaryText = `📅 *AGENDA & JADWAL PRODUKSI POSTER (14 HARI KE DEPAN)* 🎨\n`;
    summaryText += `_Studio Expedient Generation 43_\n\n`;

    upcoming.forEach((u, i) => {
      const daysStr =
        u.daysLeft === 0
          ? "🚨 *HARI INI*"
          : u.daysLeft === 1
          ? "⚠️ *BESOK*"
          : `⏳ *H-${u.daysLeft}*`;
      summaryText += `${i + 1}. ${daysStr} — *${u.title}* (${u.dateStr})\n`;
      summaryText += `   Tema: _${u.suggestedTheme.split(",")[0]}_\n`;
      summaryText += `   📌 Ref: ${u.pinterestUrl}\n\n`;
    });

    summaryText += `Ketik: *@bot brief [nama agenda]* untuk mendapatkan paket copywriting & palet warna lengkap! 🚀`;
    return summaryText;
  }

  // 2. FAST COMMAND: Cek Aset Alumni untuk Ultah
  if (lower.startsWith("aset ") || lower.startsWith("foto ") || lower.includes("aset ultah") || lower.includes("foto ultah")) {
    const nameQuery = lower.replace(/^(aset|foto|aset ultah|foto ultah)\s+/i, "").trim();
    if (nameQuery) {
      try {
        const supabase = createAdminClient();
        const { data: users } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, nama_panggilan, avatar_url, tanggal_lahir, asal_konsulat")
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
            `• *Konsulat/Domisili:* ${u.asal_konsulat || "-"}\n\n` +
            `🖼️ *Foto Profil Resmi (HD):*\n${u.avatar_url || "Belum ada avatar khusus"}\n\n` +
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
  if (!geminiApiKey) {
    return (
      `Halo Sahabat *${senderName}*! Sebagai tim desain, pastikan poster dibuat dengan ukuran 1:1 untuk feed dan 9:16 untuk story ya. ` +
      `Ketik *jadwal* untuk melihat kalender poster terdekat! 🎨`
    );
  }

  // Ambil konteks event terdekat saat ini
  const upcoming = await getUpcomingDesignCalendar(7);
  const eventContext = upcoming.slice(0, 3).map((e) => `- ${e.title} (${e.dateStr}, H-${e.daysLeft})`).join("\n");

  const prompt = `
You are the official Creative Director, Art Director, and Studio Lead AI of "Expedient Generation 43" in their dedicated Graphic Design / Editors WhatsApp Group.
Your team consists of santri alumni graphic designers and editors who create posters for birthdays, national events (e.g. G30S/PKI, Kesaktian Pancasila, Sumpah Pemuda, Hari Santri, Hari Pahlawan), and Islamic holidays.

USER CONTEXT:
- Sender Name: ${senderName}
- User Message: "${messageText}"

UPCOMING EVENTS ON THE CALENDAR:
${eventContext || "Tidak ada event besar dalam 3 hari ke depan."}

CRITICAL RULES & STRICT PERSONA:
1. STRICT TOPIC ENFORCEMENT:
   - This group is EXCLUSIVELY for Graphic Design, Visual Brainstorming, Poster Copywriting, Typography, Color Palette, Layout Compositions, Software Tips (Photoshop, Canva, Illustrator, Figma), and Content Scheduling/Deadlines.
   - IF THE USER'S MESSAGE IS OFF-TOPIC (talking about politics, football, random jokes, personal gossip, or unrelated issues):
     You MUST politely apologize, state that this group is strictly for design & creative production, and gently steer them back to creative poster topics.
     Example off-topic response:
     "Mohon maaf Sahabat ${senderName}, di grup Graphic Design ini kita fokus pada perancangan visual, ide konten poster, tanggal peringatan, dan brainstorming kreatif ya. Biar studio kita tetap produktif! 🎨 Yuk, ada konsep poster atau aset yang mau kita bedah bareng?"

2. IF THE USER'S MESSAGE IS ON-TOPIC (asking for ideas, design feedback, colors, dates, concept brainstorming):
   - Act like an enthusiastic, knowledgeable, and state-of-the-art Art Director.
   - Provide concrete, visual advice:
     • Suggested Color Palettes (give exact HEX codes or vivid color names)
     • Recommended Typography (e.g. Bold Editorial Serif, Clean Geometric Sans, Brush Calligraphy)
     • Composition / Layout tips (Margins, focal points, whitespace)
     • Copywriting / Headlines ready to paste onto the poster
   - Provide 1-click Pinterest or Google Images search links if relevant:
     Pinterest: https://www.pinterest.com/search/pins/?q=[encoded+query]
     Google: https://www.google.com/search?tbm=isch&q=[encoded+query]
   - Tone: Energetic, friendly, appreciative of creative labor, with polite santri warmth ("Sahabat", "Mantap", "Keren", "Bismillah").
   - Length: Concise, clean WhatsApp bullet points (3 to 6 lines max), easy to read on mobile.
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
    `Halo Sahabat *${senderName}*! Sebagai Studio Desain Expedient, kita fokus pada karya visual, ide poster, dan jadwal produksi ya. ` +
    `Ada ide konsep poster atau tanggal terdekat yang mau kita siapkan bareng? 🎨✨`
  );
}
