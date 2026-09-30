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
 * ATURAN MUTLAK: JANGAN ikut nimbrung jika TIDAK di-tag atau TIDAK dipanggil langsung!
 * Anggota tim desainer bebas ngobrol santai antar mereka tanpa diganggu bot.
 */
export function shouldDesignBotRespond(messageText: string): boolean {
  if (!messageText) return false;
  const lower = messageText.trim().toLowerCase();

  // 1. Tag / Mention Bot (@bot, @89675010185, @min, dsb)
  if (
    lower.includes("89675010185") ||
    lower.includes("@bot") ||
    lower.includes("@min") ||
    lower.includes("@admin") ||
    lower.includes("@expedient") ||
    lower.includes("@") // Tag mention WhatsApp
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

  // 3. Panggilan eksplisit kepada bot di awal atau akhir kalimat
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

  // Jika anggota saling mengobrol santai atau berdiskusi antar sesama anggota:
  // JANGAN NIMBRUNG! Biarkan mereka bebas berdiskusi & brainstorming santai.
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
        `Dalam 14 hari ke depan tidak ada agenda ultah atau hari besar terdekat. Tetap santai dan pantau terus ya! ✨`
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
      if (u.storyImageUrl) {
        summaryText += `   🖼️ *Poster Siap Pakai:* ${u.storyImageUrl}\n`;
      } else {
        summaryText += `   📌 *Ref:* ${u.pinterestUrl}\n`;
      }
      summaryText += `\n`;
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
      `Halo Sahabat *${senderName}*! Sebagai studio desain, poster kita siapkan untuk Story IG (9:16) dan Feed IG (1:1) ya. ` +
      `Ketik *jadwal* untuk melihat kalender poster terdekat! 🎨`
    );
  }

  // Ambil konteks event terdekat saat ini
  const upcoming = await getUpcomingDesignCalendar(7);
  const eventContext = upcoming.slice(0, 3).map((e) => {
    let s = `- ${e.title} (${e.dateStr}, H-${e.daysLeft})`;
    if (e.storyImageUrl) s += ` [Desain Siap Pakai Tersedia: Story & Feed]`;
    return s;
  }).join("\n");

  const prompt = `
You are the official Creative Studio Partner & Art Director AI of "Expedient Generation 43" in their dedicated Graphic Design / Editors WhatsApp Group.
Your team consists of santri alumni graphic designers and editors who create posters for birthdays, national events (e.g. G30S/PKI, Kesaktian Pancasila, Sumpah Pemuda, Hari Santri, Hari Pahlawan), and Islamic holidays.

USER CONTEXT:
- Sender Name: ${senderName}
- User Message: "${messageText}"

UPCOMING EVENTS & READY-TO-POST POSTERS:
${eventContext || "Tidak ada event besar dalam 3 hari ke depan."}
- Kesaktian Pancasila 1 Oktober:
  • Story IG (9:16): https://expedientgeneration.vercel.app/images/posters/kesaktian_pancasila_story.jpg
  • Feed IG (1:1): https://expedientgeneration.vercel.app/images/posters/kesaktian_pancasila_feed.jpg
- Peringatan G30S/PKI 30 September:
  • Story IG (9:16): https://expedientgeneration.vercel.app/images/posters/g30s_pki_story.jpg
  • Feed IG (1:1): https://expedientgeneration.vercel.app/images/posters/g30s_pki_feed.jpg

COMMUNICATION & PERSONALITY GUIDELINES:
1. CASUAL CHAT & CHILL BRAINSTORMING:
   - Obrolan santai, humor, kopi, bola, dan candaan antar sahabat adalah hal yang wajar dan bagian penting dari brainstorming kreatif tim!
   - JANGAN PERNAH menyalahkan, menceramahi, atau meminta maaf kaku seperti "mohon maaf jangan bahas ini".
   - Jika pengguna menyapa santai atau ngajak ngobrol santai, tanggapi dengan hangat, asik, akrab, dan santai layaknya teman nongkrong di studio desain.

2. VISUAL ASSISTANCE & READY-TO-POST POSTERS ("TERIMA JADI"):
   - Jika pengguna bertanya tentang poster, ide, atau desain:
     • Berikan panduan visual keren: warna (kode HEX), tipografi, dan komposisi.
     • Berikan copywriting siap tempel.
     • Beritahukan bahwa poster resmi siap pakai (Feed 1:1 & Story 9:16) SUDAH TERSEDIA dan bisa langsung didownload & diposting ke medsos!
   - Tulis dengan gaya santri modern yang bersemangat, suportif, dan ringkas (maksimal 3-6 baris rapi).
`.trim();

  try {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
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
