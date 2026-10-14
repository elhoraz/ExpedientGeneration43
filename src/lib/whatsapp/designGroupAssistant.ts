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
  quotedText?: string;
  quotedSender?: string;
}): Promise<string> {
  const { senderName, messageText, quotedText, quotedSender } = options;
  const lower = messageText.trim().toLowerCase();
  const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
  const geminiModel = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim();

  // 0a. FAST INTERCEPT: Deteksi Pemilihan Nomor Agenda Terdekat (contoh: "@bot 1", "@bot buat 1", "nomor 2")
  const numberSelectMatch = lower.match(/^(?:@?bot\s+)?(?:buat\s+|pilih\s+|nomor\s+|no\s+|!|\/)?\s*(\d{1,2})$/i);
  if (numberSelectMatch) {
    const selectedIdx = parseInt(numberSelectMatch[1], 10) - 1;
    if (selectedIdx >= 0 && selectedIdx < 5) {
      const upcomingList = await getUpcomingDesignCalendar(21);
      if (upcomingList && upcomingList[selectedIdx]) {
        return `[ACTION:GENERATE_POSTER:${upcomingList[selectedIdx].title}]`;
      }
    }
  }

  // 0b. FAST INTERCEPT: Deteksi Niat Pembuatan Poster / Desain (Jangan looping chat!)
  const actionRegex = /\b(buatin|bikinin|buatkan|bikin|buat|desainin|desainkan|designkan|gambarin|generate)\b/i;
  const designTargetRegex = /\b(poster|desain|design|gambar|draf|draft|story|feed|flyer|banner)\b/i;
  if (
    (actionRegex.test(lower) && designTargetRegex.test(lower)) ||
    /\b(laiya\s+buatin|iya\s+buatin|ya\s+buatin|gas\s+buatin|cepet\s+buatin|buatin\s+dong|bikinin\s+dong)\b/i.test(lower)
  ) {
    let extractedTopic = lower
      .replace(/^(@?bot|@?min|admin)[,:\s]*/i, "")
      .replace(/^(tolong\s+|coba\s+|bisa\s+)?(buatin|bikinin|buatkan|bikin|buat|generate|desainin|desainkan|designkan|gambarin)\s+(poster|desain|design|flyer|banner|gambar|draf|draft)?\s*(dong|lah|sih|ya)?\s*(untuk|tentang|tema|edisi|konsep)?\s*/i, "")
      .replace(/^(laiya\s+buatin|iya\s+buatin|ya\s+buatin|gas\s+buatin|cepet\s+buatin)\s*/i, "")
      .replace(/\s+(dong|lah|sih|ya|bro|gan|min|bot)$/i, "")
      .trim();

    // Jika topik mengacu ke pesan teman yang di-reply (misal: "ini", "kayak gini") gunakan quotedText
    if ((!extractedTopic || /^(ini|kayak gini|seperti ini|yang ini|tentang ini|yang tadi|posternya)$/i.test(extractedTopic)) && quotedText) {
      extractedTopic = quotedText;
    }

    // Jika pengguna meminta poster tapi tidak menyebutkan topik / masih ambigu
    if (!extractedTopic || /^(buatin|bikinin|bikin|buat|poster|desain|story|feed)$/i.test(extractedTopic)) {
      const upcoming = await getUpcomingDesignCalendar(21);
      if (upcoming && upcoming.length > 0) {
        const top3 = upcoming.slice(0, 3);
        let promptChoice = `Siap Sahabat *${senderName}*! 🎨✨\n\n`;
        promptChoice += `Mau dibuatkan poster untuk agenda terdekat yang mana nih?\n\n`;
        top3.forEach((item, idx) => {
          const badge = item.type === "birthday" ? "🎂" : "📅";
          const dStr =
            item.daysLeft === 0
              ? "*HARI INI!*"
              : item.daysLeft === 1
              ? "*BESOK!*"
              : `H-${item.daysLeft} (${item.dateStr})`;
          promptChoice += `${idx + 1}. ${badge} *${item.title}* — ${dStr}\n`;
        });
        promptChoice += `\n💡 Balas nomornya (misal: *@bot buat 1*) atau sebutkan topik khusus yang antum mau ya! 🚀`;
        return promptChoice;
      }
      extractedTopic = "Hari Santri Nasional";
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
  // Ambil konteks percakapan multi-turn terbaru di grup desain
  let recentChatContext = "";
  if (options.groupId) {
    try {
      const { getRecentGroupChatHistory, formatChatHistoryForSummary } = await import(
        "@/lib/whatsapp/groupConversationBuffer"
      );
      const hist = await getRecentGroupChatHistory(options.groupId, 6);
      const filtered = hist.filter(
        (m) => !(m.senderPhone === options.senderPhone && m.messageText.trim() === messageText.trim())
      );
      if (filtered.length > 0) {
        recentChatContext = formatChatHistoryForSummary(filtered.slice(-5));
      }
    } catch (_) {}
  }

  // Ambil konteks event terdekat & fakta database alumni
  let cohortFactSummary = "";
  try {
    const { resolveCohortContext } = await import("@/lib/whatsapp/alumniIntelligence");
    const cohortFact = await resolveCohortContext(messageText, senderName, recentChatContext);
    cohortFactSummary = cohortFact.summary;
  } catch (_) {}

  const upcoming = await getUpcomingDesignCalendar(14);
  const eventContext = upcoming.slice(0, 5).map((e) => {
    let s = `- ${e.title} (${e.dateStr}, H-${e.daysLeft})`;
    if (e.storyImageUrl) s += ` [Desain Siap Pakai Tersedia: Story & Feed]`;
    return s;
  }).join("\n");

  const prompt = `
You are the Art Director & Senior Creative Studio Partner AI of "Expedient Generation 43" (Jiilul Hashiif, Pondok Modern Arrisalah Slahung Ponorogo Class of 2025) inside the dedicated Graphic Design / Editors WhatsApp Group.
Your team consists of santri alumni graphic designers and editors who create posters for birthdays, national events, Islamic holidays, and cohort social media.

USER CONTEXT:
- Sender Name: ${senderName}
- User Message: "${messageText}"
${quotedText ? `- Pesan Teman Yang Sedang Di-Reply/Quote (Pengirim: ${quotedSender || "teman"}): "${quotedText}"\n  (PERHATIAN: Pengguna sedang me-reply langsung pesan temannya di atas. Jawablah dengan memahami hubungan antara pesan pengguna dan isi pesan temannya!)` : ""}
${recentChatContext ? `- Riwayat Diskusi Terakhir di Studio Desain (Konteks Multi-Turn):\n${recentChatContext}\n` : ""}

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

STRICT CREATIVE STUDIO GUIDELINES:
1. ADAPTIVE DETAIL BASED ON USER INTENT:
   A. DESIGN CONCEPT / BRIEF / POSTER REQUEST:
      When asked for design concepts, poster ideas, copywriting, layout, color palettes, or briefs:
      PROVIDE A STRUCTURED, PROFESSIONAL CREATIVE BRIEF (Scannable, practical, and immediately actionable for Canva/Photoshop):
      - 🏛️ *Tema & Nuansa Visual*: 1 concise sentence describing the art direction (e.g. Modern Santri Heritage, Elegant Royal Gold, Minimalist Flat).
      - ✍️ *Copywriting Siap Pakai*:
        • Headline (catchy title)
        • Subheadline (context / celebration message)
        • Kutipan / Mahfudzot / Ayat (inspirational touch)
      - 🎨 *Art Direction & Palet Warna (Hex Codes)*: Provide 3-4 specific hex codes (e.g. Emerald #0F5132, Gold #D4AF37, Off-White #F8F9FA).
      - 🔤 *Rekomendasi Font*: Specific typography pairing (e.g. Serif for headline + Sans-serif for body).
      - 📐 *Format & Rasio*: 9:16 (Story IG/WhatsApp) vs 1:1 (Feed).
      - 📌 *Moodboard Referensi*: Quick search link (Pinterest / Google).

   B. INCOMPLETE / VAGUE PROMPTS (PROACTIVE AUTO-COMPLETE):
      If the user's request is incomplete (e.g. only mentions a topic without details like "ide poster sumpah pemuda"), DO NOT stall or ask endless questions!
      Proactively provide the single best-practice concept, and offer quick alternatives at the end ("Mau versi retro atau minimalis modern? Tinggal bilang ya!").

   C. WHEN USER ASKS FOR MORE DETAIL ("kurang lengkap bot", "tambahin lagi", "kurang detail"):
      Deepen the creative breakdown: provide layout composition tips (rule of thirds, focal point, lighting), alternate copy tones (casual/akrab vs formal), and asset placement guidance.

   D. QUICK FACTUAL QUESTIONS ("siapa yang ultah?", "kapan hari santri?", "foto si X mana?"):
      Answer crisp and to the point in 1-2 lines. Do NOT attach a full creative brief when they just asked a simple factual question.

   E. CASUAL CHAT & BANTER:
      Warm, friendly, clever, witty santri editor peer tone with Islamic courtesy.

2. ACCURACY & FORMATTING:
   - Use clean WhatsApp formatting (*bold*, _italic_).
   - NEVER use markdown headers like '#' or '###'. NO HTML tags.
   - Keep emojis expressive and tasteful (🎨, 📐, ✍️, ✨, 🚀).
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
