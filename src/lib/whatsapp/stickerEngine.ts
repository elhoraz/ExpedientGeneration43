import sharp from "sharp";
import { callGeminiResilient } from "@/lib/geminiResilient";

export interface StickerRequestAnalysis {
  isSticker: boolean;
  customText?: string;
}

/**
 * Mendeteksi perintah pembuatan stiker WhatsApp secara NATURAL tanpa harus menggunakan tanda seru (!)
 * Contoh yang didukung:
 * - "jadikan foto itu stiker"
 * - "jadikan stiker"
 * - "bikin stiker"
 * - "bikinin stiker dong"
 * - "stikerin"
 * - "jadikan stiker tulisannya: siap akhi"
 * - "bikin stiker dengan teks 'santai dulu'"
 */
export function analyzeStickerIntent(text: string): StickerRequestAnalysis {
  if (!text) return { isSticker: false };

  // Bersihkan mention (@105240321908772, @bot, dll) agar deteksi intent presisi
  const clean = text
    .replace(/@\d+/g, "")
    .replace(/@(bot|min|admin|expedient)/gi, "")
    .trim();
  const lower = clean.toLowerCase();

  // Pola-pola natural pembuatan stiker (dengan maupun tanpa tanda seru !)
  const stickerPatterns = [
    /\b(jadikan|jadiin|ubah|buatkan|buatin|bikin|bikinin|bikinlah|tolong jadiin|coba jadiin)\s+(foto\s+(ini|itu)\s+)?stik?ker\b/i,
    /\bstik?kerin\s*(dong|min|bot|ya|nih)?\b/i,
    /\b(buat|bikin|jadikan|jadiin)\s+stik?ker\b/i,
    /\b(foto\s+ini\s+)?jadi\s+stik?ker\b/i,
    /\b(minta|mau)\s+stik?ker(nya)?\b/i,
    /^[!#/.](stik?ker|sticker)/i,
    /\b(!stik?ker|!sticker)\b/i,
    /\b(stik?ker|sticker)\s*(dong|min|bot|ya)?$/i,
  ];

  const matches = stickerPatterns.some((pattern) => pattern.test(lower));
  if (!matches) {
    return { isSticker: false };
  }

  // Cek apakah peminta menyertakan teks / quote spesifik
  // Contoh: 'tulisannya: "..."', 'teks: "..."', 'tulisan ...', 'quote: ...'
  let customText: string | undefined;

  const quoteMatch = clean.match(
    /(?:tulisan(?:nya)?|teks(?:nya)?|tulis|kata(?:nya)?|quote)\s*[:=]\s*["'“]?([^"'”\n]+)["'”]?/i
  ) || clean.match(/["'“]([^"'”\n]{2,50})["'”]/);

  if (quoteMatch && quoteMatch[1]) {
    customText = quoteMatch[1].trim();
  }

  return {
    isSticker: true,
    customText,
  };
}

/**
 * Jika peminta TIDAK request teks khusus, AI Gemini menganalisis ekspresi & suasana foto
 * lalu membuat sendiri SATU quote / punchline pendek (2-5 kata) yang pas, lucu, dan santun ala santri!
 */
export async function generateSmartStickerQuote(
  imageBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<string> {
  try {
    const prompt = `
Perhatikan gambar ini secara seksama.
TUGAS:
Buatlah SATU (1) teks pendek / quote meme santri (2 sampai 5 kata saja) yang PALING PAS, lucu, menggelitik, atau ekspresif untuk dijadikan teks pada STIKER WhatsApp!

PANDUAN:
- Sesuaikan dengan ekspresi orang di gambar (senyum, melongo, serius, kaget, datar, ngantuk, dll).
- Gunakan bahasa santai, akrab khas santri / anak muda (misal: "Santai Dulu Akhi", "Piket Menunggu", "Menatap Masa Depan", "Kopi Mana Kopi", "Siap Meluncur", "Tetap Istiqomah", "5 Watt Banget", "Ampun Ustadz", "Senyum Ibadah").
- JANGAN gunakan tanda kutip, jangan gunakan penjelasan.
- HANYA keluarkan 2-5 kata teks stiker tersebut!
`.trim();

    const base64Data = imageBuffer.toString("base64");
    const bodyPayload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 60,
      },
    };

    const res = await callGeminiResilient(bodyPayload);
    const aiText = res?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    const cleanQuote = (aiText || "")
      .replace(/["'“”`_*~]/g, "")
      .split("\n")[0]
      .trim();

    if (cleanQuote && cleanQuote.length <= 40) {
      return cleanQuote;
    }
  } catch (err: any) {
    console.warn("[SMART-STICKER-QUOTE-WARN]:", err.message);
  }

  // Fallback santun khas santri jika AI vision offline
  const fallbacks = [
    "Santai Dulu Akhi",
    "Tetap Istiqomah",
    "Senyum Itu Ibadah",
    "Kopi Mana Kopi?",
    "Siap Laksanakan!",
    "Bismillah Berkah",
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Membuat stiker WhatsApp resmi (WebP 512x512, transparan proporsional, teks ber-outline jelas)
 */
export async function createWhatsAppSticker(
  imageBuffer: Buffer,
  textOverlay?: string
): Promise<Buffer> {
  // 1. Auto-orient foto dari EXIF
  let pipeline = sharp(imageBuffer).rotate();

  // 2. Resize base image agar pas dalam kanvas 512x512 (fit contain) dengan latar transparan
  const resizedBaseBuffer = await pipeline
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  // 3. Jika ada teks quote (baik dari request user maupun hasil identifikasi cerdas AI):
  if (textOverlay && textOverlay.trim()) {
    const cleanText = escapeXml(textOverlay.trim().toUpperCase());
    
    // Tentukan ukuran font berdasarkan panjang kata
    let fontSize = 28;
    if (cleanText.length > 25) fontSize = 22;
    if (cleanText.length > 35) fontSize = 18;

    // SVG Overlay bergaya Badge Modern Semi-Transparent dengan outline teks tajam
    const overlaySvg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
        <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.9"/>
        </filter>
      </defs>
      <!-- Bottom Badge Bar -->
      <g filter="url(#badgeShadow)">
        <rect x="24" y="420" width="464" height="68" rx="18" fill="rgba(15, 23, 42, 0.88)" stroke="#38BDF8" stroke-width="2.5" />
      </g>
      <!-- Main Text with Bold Visual Impact -->
      <text x="256" y="464"
            font-family="Arial, Helvetica, sans-serif"
            font-weight="900"
            font-size="${fontSize}"
            fill="#FFFFFF"
            text-anchor="middle"
            filter="url(#textGlow)">
        ${cleanText}
      </text>
    </svg>`;

    return await sharp(resizedBaseBuffer)
      .composite([
        {
          input: Buffer.from(overlaySvg),
          top: 0,
          left: 0,
        },
      ])
      .webp({ quality: 85, effort: 4 })
      .toBuffer();
  }

  // Jika tanpa teks sama sekali, langsung konversi ke WebP 512x512
  return await sharp(resizedBaseBuffer)
    .webp({ quality: 85, effort: 4 })
    .toBuffer();
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
