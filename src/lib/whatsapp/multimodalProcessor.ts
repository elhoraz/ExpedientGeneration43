import { callGeminiResilient } from "@/lib/sentinel/conversationalAgent";
import { isDesignGroupId } from "@/lib/whatsapp/designGroupAssistant";
import { extractAndLearnFromMessage } from "@/lib/whatsapp/botMemory";
import { createAdminClient } from "@/lib/supabase/admin";

export interface MultimodalMessagePayload {
  mediaUrl: string;
  filename?: string;
  extension?: string;
  caption?: string;
  senderPhone: string;
  senderName: string;
  isGroup: boolean;
  groupId?: string;
}

export type MultimodalMediaCategory =
  | "image"
  | "audio"
  | "video"
  | "document"
  | "sticker"
  | "unknown";

export interface MultimodalProcessResult {
  success: boolean;
  mediaType: MultimodalMediaCategory;
  replyText: string;
  transcription?: string;
  isTransferReceipt?: boolean;
}

/**
 * Memetakan ekstensi atau header Content-Type ke MIME type resmi yang didukung Google Gemini Multimodal
 */
export function resolveMimeType(
  extension?: string,
  filename?: string,
  headerContentType?: string
): { mimeType: string; category: MultimodalMediaCategory } {
  let ext = (extension || "").toLowerCase().replace(/^\./, "").trim();
  if (!ext && filename) {
    const parts = filename.split(".");
    if (parts.length > 1) {
      ext = parts[parts.length - 1].toLowerCase().trim();
    }
  }

  // Khusus STIKER WhatsApp (.webp atau ekstensi sticker)
  if (
    ext === "sticker" ||
    ext === "webp" ||
    filename?.toLowerCase().includes("sticker") ||
    filename?.toLowerCase().includes("stiker")
  ) {
    return { mimeType: "image/webp", category: "sticker" };
  }

  // 1. Cek header Content-Type dari server jika spesifik
  if (headerContentType && headerContentType.includes("/")) {
    const cleanType = headerContentType.split(";")[0].trim().toLowerCase();
    if (cleanType === "image/webp") {
      return { mimeType: "image/webp", category: "sticker" };
    }
    if (cleanType.startsWith("image/")) {
      return { mimeType: cleanType === "image/jpg" ? "image/jpeg" : cleanType, category: "image" };
    }
    if (cleanType.startsWith("audio/")) {
      return { mimeType: cleanType, category: "audio" };
    }
    if (cleanType.startsWith("video/")) {
      return { mimeType: cleanType, category: "video" };
    }
    if (cleanType.includes("pdf")) {
      return { mimeType: "application/pdf", category: "document" };
    }
  }

  // 2. Pemetaan berdasarkan ekstensi file
  switch (ext) {
    // GAMBAR (Images / Posters)
    case "jpg":
    case "jpeg":
      return { mimeType: "image/jpeg", category: "image" };
    case "png":
      return { mimeType: "image/png", category: "image" };
    case "heic":
      return { mimeType: "image/heic", category: "image" };
    case "heif":
      return { mimeType: "image/heif", category: "image" };

    // STIKER WHATSAPP
    case "webp":
    case "sticker":
      return { mimeType: "image/webp", category: "sticker" };

    // VOICE NOTE / AUDIO
    case "opus":
      return { mimeType: "audio/ogg", category: "audio" }; // WhatsApp Voice Notes are typically Ogg Opus
    case "ogg":
      return { mimeType: "audio/ogg", category: "audio" };
    case "mp3":
      return { mimeType: "audio/mp3", category: "audio" };
    case "m4a":
      return { mimeType: "audio/mp4", category: "audio" };
    case "wav":
      return { mimeType: "audio/wav", category: "audio" };
    case "aac":
      return { mimeType: "audio/aac", category: "audio" };

    // VIDEO NOTE / VIDEO
    case "mp4":
      return { mimeType: "video/mp4", category: "video" };
    case "mov":
      return { mimeType: "video/quicktime", category: "video" };
    case "webm":
      return { mimeType: "video/webm", category: "video" };
    case "3gp":
    case "3gpp":
      return { mimeType: "video/3gpp", category: "video" };

    // DOKUMEN
    case "pdf":
      return { mimeType: "application/pdf", category: "document" };

    default:
      return { mimeType: "application/octet-stream", category: "unknown" };
  }
}

/**
 * Filter cerdas untuk menentukan apakah media yang dikirim di dalam grup harus diproses oleh bot
 */
export function shouldProcessGroupMedia(
  groupId: string,
  category: MultimodalMediaCategory,
  caption?: string
): boolean {
  // 1. Di Grup Desain Grafis: Setiap gambar, poster, stiker kreatif, dan Voice Note SELALU direview/ditranskrip otomatis
  if (isDesignGroupId(groupId) && (category === "image" || category === "sticker" || category === "audio")) {
    return true;
  }

  const text = (caption || "").trim().toLowerCase();

  // 2. Mention / Tag Bot (nomor bot 6289675010185, 6285151771289, @bot, min, dsb)
  if (
    text.includes("89675010185") ||
    text.includes("85151771289") ||
    text.includes("@bot") ||
    text.includes("bot") ||
    text.includes("min") ||
    text.includes("@") ||
    text.startsWith("!") ||
    text.startsWith("/") ||
    text.startsWith("?") ||
    text.startsWith("#")
  ) {
    return true;
  }

  // 3. Kata kunci permintaan review/transkrip/bantuan
  if (
    text.includes("review") ||
    text.includes("transkrip") ||
    text.includes("dengar") ||
    text.includes("dengerin") ||
    text.includes("apa ini") ||
    text.includes("tolong") ||
    text.includes("gimana") ||
    text.includes("bagus ga") ||
    text.includes("feedback")
  ) {
    return true;
  }

  return false;
}

/**
 * Mengunduh media dari URL publik WhatsApp Gateway (Fonnte/CDN) dengan validasi ukuran
 */
async function downloadMediaAsBase64(
  url: string,
  providedExtension?: string,
  providedFilename?: string
): Promise<{ base64Data: string; mimeType: string; category: MultimodalMediaCategory; sizeBytes: number }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ExpedientMultimodal/2.0",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    const headerContentType = res.headers.get("content-type") || "";
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const sizeBytes = buffer.length;

    // Batasi ukuran maksimal 18MB untuk direct inline payload Gemini
    if (sizeBytes > 18 * 1024 * 1024) {
      throw new Error(`Media terlalu besar (${(sizeBytes / (1024 * 1024)).toFixed(1)} MB). Maksimal 18 MB.`);
    }

    const { mimeType, category } = resolveMimeType(providedExtension, providedFilename, headerContentType);

    return {
      base64Data: buffer.toString("base64"),
      mimeType,
      category,
      sizeBytes,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export interface ProcessMultimodalBufferPayload {
  base64Data: string;
  category: MultimodalMediaCategory;
  mimeType: string;
  caption?: string;
  senderPhone: string;
  senderName: string;
  isGroup: boolean;
  groupId?: string;
  filename?: string;
}

/**
 * Multimodal AI Engine: Memproses Base64 Buffer media secara langsung (digunakan oleh Baileys / Self-Hosted Gateway)
 */
export async function processMultimodalBuffer(
  payload: ProcessMultimodalBufferPayload
): Promise<MultimodalProcessResult> {
  const {
    base64Data,
    category,
    mimeType,
    caption = "",
    senderPhone,
    senderName,
    isGroup,
    groupId = "",
    filename = "",
  } = payload;

  const displayName = senderName || "Sahabat";
  const inDesignGroup = isGroup && isDesignGroupId(groupId);

  try {
    const geminiApiKey = (process.env.GEMINI_API_KEY || "").trim();
    const preferredModel = (process.env.GEMINI_MODEL || "gemini-3.5-flash").trim();

    // 2. Susun prompt sesuai tipe media dan ruang percakapan (Design Studio vs Grup Komunitas vs Japri)
    let promptInstruction = "";

    if (category === "image") {
      if (inDesignGroup) {
        // CABANG A: GRUP GRAPHIC DESIGN EXPEDIENT (POSTER / FLYER / ASSET REVIEW)
        promptInstruction = `
Kamu adalah Senior Art Director, Brand Guardian, dan Asisten Kurator Desain Resmi untuk "Expedient Generation 43" (Alumni Pondok Modern Arrisalah Slahung Ponorogo, ANGKATAN 2025).

Pengirim: ${displayName}
Caption/Pesan Pengirim: "${caption || "Minta feedback / review desain ini min"}"

TUGAS UTAMA:
Lakukan Review Desain Grafis secara mendalam, cerdas, tajam, dan membangun terhadap gambar/poster yang dikirimkan ini.

STRUKTUR ULASAN (Gunakan format WhatsApp dengan tebal/miring rapi):
1. 🎨 *First Impression & Vibe Visual:*
   - Nilai daya tarik visual awal, mood, dan keselarasan dengan tema.
2. ✍️ *Tipografi & Visual Hierarchy:*
   - Periksa keterbacaan (legibility) teks headline, subheadline, dan body text.
   - Perhatikan kontras font terhadap background serta hierarki ukuran font.
3. 📐 *Layout, Komposisi & Whitespace:*
   - Keseimbangan penataan elemen, margin/padding aman, dan breathing space.
4. 💡 *Saran Polish Konkret (Actionable Tips):*
   - Berikan 1-2 rekomendasi praktis yang bisa langsung dieksekusi oleh desainer untuk membuat karyanya 10x lebih memukau.

PENTING:
- Angkatan ini adalah ANGKATAN 2025 (Pondok Modern Arrisalah Slahung Ponorogo). JANGAN PERNAH sebut 2023.
- Bahasa: Santai, profesional, bersahabat khas tim kreatif santri, suportif, dan inspiratif.
`.trim();
      } else {
        // CABANG B: GRUP KOMUNITAS / JAPRI PERSONAL (FOTO, STRUK TRANSFER, MEME, ATAU DOKUMEN)
        promptInstruction = `
Kamu adalah Asisten Cerdas Multimodal "Expedient Generation 43" (Alumni Pondok Modern Arrisalah Slahung Ponorogo, ANGKATAN 2025).

Pengirim: ${displayName} (${senderPhone})
Caption/Pesan Pengirim: "${caption || ""}"
Konteks Percakapan: ${isGroup ? "Grup WhatsApp Angkatan" : "Chat Pribadi (1-on-1)"}

TUGAS ANALISIS GAMBAR:
1. Periksa apakah gambar ini merupakan **STRUK / BUKTI TRANSFER BANK / E-WALLET / QRIS** (misal untuk Baitul Maal, kas angkatan, sumbangan, atau iuran):
   - JIKA YA BUKTI TRANSFER:
     Ekstrak informasi berikut dengan format rapi:
     🧾 *Verifikasi Bukti Transfer Terdeteksi:*
     • 💰 *Nominal:* [Tuliskan nominal Rp...]
     • 🏦 *Bank/Platform:* [Nama bank atau e-wallet]
     • 👤 *Pengirim / Rekening:* [Nama pengirim di struk]
     • 📅 *Waktu Transaksi:* [Tanggal & jam di struk]
     • ✅ *Status:* [Berhasil/Sukses]
     
     Lalu sampaikan ucapan terima kasih yang tulus:
     "Jazakumullah khairan katsiran kepada Sahabat *${displayName}* atas kontribusi dan iurannya untuk Baitul Maal / Kas Keluarga Besar Expedient Generation 43. Semoga Allah melipatgandakan rezeki, mempermudah segala urusan, dan memberkahi setiap langkah. Aamiin ya Rabbal 'Alamin. Data ini dapat dipantau langsung di menu Baitul Maal portal angkatan."

2. JIKA BUKAN BUKTI TRANSFER (Foto santri, momen alumni, meme, poster acara, dokumen foto, pemandangan, dll):
   - Baca teks yang terlihat di dalam gambar (OCR).
   - Jelaskan apa yang tergambar dengan nada hangat, akrab, dan bersahabat khas santri Arrisalah angkatan 2025.
   - Jika pengirim menyertakan caption pertanyaan atau tanggapan, jawab pertanyaan tersebut secara tepat berdasarkan gambar.
   - Jika meme/humor: Balas dengan respon witty yang ceria dan relatable bagi alumni pesantren.

PENTING:
- Angkatan ini adalah ANGKATAN 2025.
- Output langsung berupa teks WhatsApp yang ramah dan siap kirim.
`.trim();
      }
    } else if (category === "audio") {
      // CABANG C: VOICE NOTE (VN / PTT AUDIO / PESAN SUARA)
      promptInstruction = `
Kamu adalah Asisten Cerdas Multimodal "Expedient Generation 43" (Alumni Pondok Modern Arrisalah Slahung Ponorogo, ANGKATAN 2025).

Pengirim: ${displayName} (${senderPhone})
Caption: "${caption || ""}"
Konteks: ${isGroup ? "Grup WhatsApp Angkatan" : "Chat Pribadi (1-on-1)"}

TUGAS KHUSUS VOICE NOTE (VN / PESAN SUARA):
1. Dengarkan rekaman suara (audio) ini secara seksama.
2. Tuliskan transkripsi singkat atau kutipan inti dari apa yang diucapkan oleh pembicara:
   🎙️ _"Transkrip: [tuliskan apa yang diucapkan pembicara]"_
3. Berikan respons / tanggapan yang cerdas, ramah, solutif, dan hangat ala sesama santri kawan seperjuangan:
   - Jika ada pertanyaan tentang kabar alumni, info pondok, portal website, baitul maal, atau angkatan 2025: jawab dengan tuntas dan akurat.
   - Jika hanya sapaan, curhatan, candaan santai, atau kabar: tanggapi dengan asyik, hangat, dan menyenangkan.
   - Jika suara berbahasa santai, Jawa, atau campuran istilah pesantren (akhi, antum, ustadz, pondok, kamar, konsulat): pahami dengan sangat baik dan gunakan istilah yang sesuai.

PENTING:
- Angkatan ini adalah ANGKATAN 2025.
- Tampilkan kutipan transkripsi di awal agar sahabat lain yang tidak sempat menyetel audio bisa langsung membaca intinya!
`.trim();
    } else if (category === "video") {
      // CABANG D: VIDEO NOTE (VIDEO BULAT / SHORT VIDEO)
      promptInstruction = `
Kamu adalah Asisten Cerdas Multimodal "Expedient Generation 43" (Alumni Pondok Modern Arrisalah Slahung Ponorogo, ANGKATAN 2025).

Pengirim: ${displayName} (${senderPhone})
Caption: "${caption || ""}"
Konteks: ${isGroup ? "Grup WhatsApp Angkatan" : "Chat Pribadi (1-on-1)"}

TUGAS KHUSUS VIDEO NOTE / REKAMAN VIDEO:
1. Tonton dan dengarkan video ini (perhatikan adegan visual serta suara/ucapannya).
2. Tuliskan rangkuman singkat apa yang tampak dan terdengar:
   🎬 _"Rangkuman Video: [deskripsikan kejadian di video dan ucapan jika ada]"_
3. Berikan respon yang antusias, cerdas, bersahabat, dan seru sejalan dengan semangat kebersamaan alumni Expedient Generation 43 (Angkatan 2025).

PENTING:
- Angkatan ini adalah ANGKATAN 2025.
- Respon harus hidup, interaktif, dan bernuansa persaudaraan alumni santri Arrisalah.
`.trim();
    } else if (category === "sticker") {
      // CABANG E: STIKER WHATSAPP (.WEBP / MEME / REAKSI EKSPRESI)
      promptInstruction = `
Kamu adalah Asisten Cerdas Multimodal "Expedient Generation 43" (Alumni Pondok Modern Arrisalah Slahung Ponorogo, ANGKATAN 2025).

Pengirim: ${displayName} (${senderPhone})
Tipe Media: STIKER WHATSAPP (.webp)
Konteks: ${isGroup ? "Grup WhatsApp Angkatan" : "Chat Pribadi (1-on-1)"}
Caption: "${caption || ""}"

TUGAS UTAMA: BACA & TANGGAPI STIKER WHATSAPP INI
1. Analisis isi visual stiker:
   - BACA TEKS / TULISAN apa pun yang ada di stiker tersebut (jika ada).
   - Kenali ekspresi visual, wajah, karakter meme (misal kucing, anime, tokoh, ekspresi kaget, ngakak, menangis komedi, santri, ustadz, stiker khas WA, dll).
2. Berikan respons balasan WhatsApp yang cerdas, asyik, dan nyambung:
   - JIKA STIKER BERISI SALAM / DOA (contoh: "Assalamu'alaikum", "Jazakallah Khair", "Barakallahu Fiik", "Bismillah", "Alhamdulillah"):
     Jawab salam / aminkan doanya dengan sopan, ramah, dan santun khas santri Arrisalah angkatan 2025.
   - JIKA STIKER MEME / REAKSI LUCU / SINDIRAN KOMEDI / GEMAS (contoh: muka melongo, ngakak, "terserah", "siap komandan", "puncak komedi", "capek batin", dll):
     Balas dengan gaya witty, ceria, dan kocak ala obrolan santai antar sahabat santri seangkatan. Boleh ikut mengomentari ekspresi stikernya (contoh: "Muka lu pas denger bel marhalah bunyi wkwk", "Stiker dapet nemu di mana ini akhi 😂", "Wkwk ekspresinya mewakili banget!").
   - JIKA STIKER BINGUNG / TANYA / TANDA TANYA:
     Tanyakan santai ada apa atau tawarkan bantuan.
3. Gaya bahasa:
   - Santai, bersahabat, sedikit sentuhan santri (akhi, antum, mas, bro, wkwk), tidak kaku.
   - Singkat dan pas untuk balasan stiker (1-2 kalimat padat, ekspresif, dan hidup).

PENTING:
- Angkatan ini adalah ANGKATAN 2025.
`.trim();
    } else {
      // DOKUMEN / PDF / LAINNYA
      promptInstruction = `
Kamu adalah Asisten Cerdas "Expedient Generation 43" (Alumni Pondok Modern Arrisalah Slahung Ponorogo, ANGKATAN 2025).
Pengirim: ${displayName}
Bantu analisis dokumen / file ini dan berikan ringkasan poin-poin pentingnya secara rapi untuk WhatsApp.
`.trim();
    }

    // 3. Panggil Google Gemini Multimodal via callGeminiResilient
    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: promptInstruction,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 2048,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    };

    const aiRes = await callGeminiResilient(geminiPayload, geminiApiKey, preferredModel);
    const replyText =
      aiRes?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      `Media (${category}) berhasil diterima dari Sahabat ${displayName}. Terima kasih! ✨`;

    // 4. Background Self-Learning: Jika audio/VN memuat informasi faktual alumni, serap ke memori bot
    if (category === "audio") {
      try {
        const transMatch = replyText.match(/Transkrip:\s*([^\n\r"]+)/i);
        const spokenText = transMatch ? transMatch[1] : replyText;
        if (spokenText && spokenText.length > 10) {
          extractAndLearnFromMessage(spokenText, displayName).catch((err) =>
            console.warn("[MULTIMODAL-LEARN-WARN]:", err.message)
          );
        }
      } catch (err) {
        // non-blocking
      }
    }

    // 5. Catat riwayat multimodal ke Supabase whatsapp_queue
    try {
      const supabase = createAdminClient();
      await supabase.from("whatsapp_queue").insert([
        {
          no_whatsapp: isGroup ? groupId.slice(0, 20) : senderPhone,
          message: `[MULTIMODAL-${category.toUpperCase()}] ${caption || filename || "Media"} (Dari: ${displayName})`,
          status: "multimodal_replied",
          error_message: `Dibalas AI Multimodal: "${replyText.slice(0, 150)}"`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (queueErr: any) {
      console.warn("[MULTIMODAL-QUEUE-LOG-WARN]:", queueErr.message);
    }

    return {
      success: true,
      mediaType: category,
      replyText,
      isTransferReceipt: replyText.includes("Verifikasi Bukti Transfer Terdeteksi"),
    };
  } catch (error: any) {
    console.error("[MULTIMODAL-ERROR]:", error);
    const fallbackMessage =
      `Mohon maaf Sahabat *${displayName}*, media belum dapat diproses secara otomatis saat ini (` +
      (error.message?.includes("terlalu besar") ? error.message : "koneksi gateway/server sedang padat") +
      `). Silakan coba kirim ulang ya! 🙏`;

    return {
      success: false,
      mediaType: "unknown",
      replyText: fallbackMessage,
    };
  }
}

/**
 * Multimodal AI Engine: Mengunduh media dari URL lalu memproses dengan processMultimodalBuffer
 */
export async function processMultimodalWhatsAppMessage(
  payload: MultimodalMessagePayload
): Promise<MultimodalProcessResult> {
  const {
    mediaUrl,
    filename,
    extension,
    caption = "",
    senderPhone,
    senderName,
    isGroup,
    groupId = "",
  } = payload;

  const displayName = senderName || "Sahabat";

  try {
    console.log(
      `[MULTIMODAL-PROCESS] Memulai download media: ${mediaUrl} | Pengirim: ${displayName} (${senderPhone}) | Grup: ${groupId || "1-ON-1"}`
    );

    const { base64Data, mimeType, category, sizeBytes } = await downloadMediaAsBase64(
      mediaUrl,
      extension,
      filename
    );

    console.log(
      `[MULTIMODAL-DOWNLOADED] Ukuran: ${(sizeBytes / 1024).toFixed(1)} KB | MIME: ${mimeType} | Kategori: ${category}`
    );

    return await processMultimodalBuffer({
      base64Data,
      category,
      mimeType,
      caption,
      senderPhone,
      senderName,
      isGroup,
      groupId,
      filename,
    });
  } catch (error: any) {
    console.error("[MULTIMODAL-DOWNLOAD-ERROR]:", error);
    const fallbackMessage =
      `Mohon maaf Sahabat *${displayName}*, media belum dapat diunduh/diproses secara otomatis saat ini (` +
      (error.message?.includes("terlalu besar") ? error.message : "koneksi gateway/server sedang padat") +
      `). Silakan coba kirim ulang ya! 🙏`;

    return {
      success: false,
      mediaType: "unknown",
      replyText: fallbackMessage,
    };
  }
}
