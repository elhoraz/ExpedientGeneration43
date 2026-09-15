import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// In-memory audio buffer cache to provide instantaneous 0ms playback for repeated recitations
const audioCache = new Map<string, Buffer>();

/**
 * OPTION A AUDIO ENGINE:
 * 
 * 1. Ayat Suci Al-Qur'an (Holy Quranic Verses)
 * 100% Authentic Human Tartil Recitation by Syaikh Mishary Rashid Alafasy
 * Hosted on Cloudflare Quran CDN (verses.quran.com / mp3quran.net)
 * Preserving sacred Tajwid (Madd, Ghunnah, Ikhfa', Idgham, Qalqalah, Waqaf)
 */
const QURAN_AUDIO_MAP: Record<string, string | string[]> = {
  // Surah Al-Fatihah (1-7) - Full Tartil Alafasy
  fatihah: "https://server8.mp3quran.net/afs/001.mp3",

  // Surah Al-Baqarah (1-5) - Verses 1-5 Alafasy
  baqarah_awal: [
    "https://verses.quran.com/Alafasy/mp3/002001.mp3",
    "https://verses.quran.com/Alafasy/mp3/002002.mp3",
    "https://verses.quran.com/Alafasy/mp3/002003.mp3",
    "https://verses.quran.com/Alafasy/mp3/002004.mp3",
    "https://verses.quran.com/Alafasy/mp3/002005.mp3",
  ],

  // Ayat Kursi (QS. Al-Baqarah: 255) - Alafasy
  ayat_kursi: "https://verses.quran.com/Alafasy/mp3/002255.mp3",

  // Akhir Surah Al-Baqarah (QS. 2:285-286 - Amanar-Rasulu s.d. akhir surat) - Alafasy
  baqarah_akhir: [
    "https://verses.quran.com/Alafasy/mp3/002285.mp3",
    "https://verses.quran.com/Alafasy/mp3/002286.mp3",
  ],

  // Surah Al-Ikhlas (1-4) - Alafasy
  ikhlas: [
    "https://verses.quran.com/Alafasy/mp3/112001.mp3",
    "https://verses.quran.com/Alafasy/mp3/112002.mp3",
    "https://verses.quran.com/Alafasy/mp3/112003.mp3",
    "https://verses.quran.com/Alafasy/mp3/112004.mp3",
  ],

  // Surah Al-Falaq (1-5) - Alafasy
  falaq: [
    "https://verses.quran.com/Alafasy/mp3/113001.mp3",
    "https://verses.quran.com/Alafasy/mp3/113002.mp3",
    "https://verses.quran.com/Alafasy/mp3/113003.mp3",
    "https://verses.quran.com/Alafasy/mp3/113004.mp3",
    "https://verses.quran.com/Alafasy/mp3/113005.mp3",
  ],

  // Surah An-Nas (1-6) - Alafasy
  nas: [
    "https://verses.quran.com/Alafasy/mp3/114001.mp3",
    "https://verses.quran.com/Alafasy/mp3/114002.mp3",
    "https://verses.quran.com/Alafasy/mp3/114003.mp3",
    "https://verses.quran.com/Alafasy/mp3/114004.mp3",
    "https://verses.quran.com/Alafasy/mp3/114005.mp3",
    "https://verses.quran.com/Alafasy/mp3/114006.mp3",
  ],

  // Doa Rabithah Bagian Ayat Al-Qur'an (QS. Ali 'Imran: 26-27) - Alafasy
  doa_rabithah: [
    "https://verses.quran.com/Alafasy/mp3/003026.mp3",
    "https://verses.quran.com/Alafasy/mp3/003027.mp3",
  ],
};

/**
 * 2. Authentic Dzikir & Supplications with 100% Exact Card Text Match
 * Verified clean audio files from Hisn al-Muslim without editorial commentary/footnotes
 */
const DZIKIR_AUDIO_MAP: Record<string, string> = {
  sayyidul_istighfar: "http://www.hisnmuslim.com/audio/ar/79.mp3",
  doa_afiyah: "http://www.hisnmuslim.com/audio/ar/82.mp3",
  hasbiyallah: "http://www.hisnmuslim.com/audio/ar/83.mp3",
  bismillahilladzi: "http://www.hisnmuslim.com/audio/ar/86.mp3",
  ridha_iman: "http://www.hisnmuslim.com/audio/ar/87.mp3",
  tasbih_100: "http://www.hisnmuslim.com/audio/ar/91.mp3",
  tahlil_10: "http://www.hisnmuslim.com/audio/ar/92.mp3",
  tasbih_makhluk: "http://www.hisnmuslim.com/audio/ar/94.mp3",
  istighfar_100: "http://www.hisnmuslim.com/audio/ar/96.mp3",
  a_udzu_bikalimatillah: "http://www.hisnmuslim.com/audio/ar/97.mp3",
  shalawat_nabi: "http://www.hisnmuslim.com/audio/ar/98.mp3",
  doa_bebas_hutang: "http://www.hisnmuslim.com/audio/ar/137.mp3",
  doa_syirik: "http://www.hisnmuslim.com/audio/ar/203.mp3",
};

/**
 * Fetch a single audio URL into a Buffer with timeout
 */
async function fetchAudioBuffer(url: string, timeoutMs: number = 15000): Promise<Buffer | null> {
  const urlsToTry = [url];
  if (url.includes("verses.quran.com/Alafasy/mp3/")) {
    urlsToTry.push(url.replace("verses.quran.com/Alafasy/mp3/", "everyayah.com/data/Alafasy_128kbps/"));
  } else if (url.includes("everyayah.com/data/Alafasy_128kbps/")) {
    urlsToTry.push(url.replace("everyayah.com/data/Alafasy_128kbps/", "verses.quran.com/Alafasy/mp3/"));
  }

  for (const targetUrl of urlsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(targetUrl, {
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        });

        if (res.ok) {
          const arr = await res.arrayBuffer();
          return Buffer.from(arr);
        }
      } catch (err) {
        console.warn(`Audio fetch attempt ${attempt + 1} failed for ${targetUrl}:`, err);
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  return null;
}

/**
 * Chunked Text-to-Speech synthesis for text without length limitation
 * Used for dynamic supplications without editorial footnotes
 */
async function synthesizeChunkedTts(text: string, lang: string): Promise<Buffer | null> {
  try {
    const clean = text
      .replace(/[۝«»""'']/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) return null;

    const cacheKey = `tts:${lang}:${clean}`;
    if (audioCache.has(cacheKey)) {
      return audioCache.get(cacheKey)!;
    }

    const words = clean.split(" ");
    const chunks: string[] = [];
    let currentChunk = "";

    for (const word of words) {
      if ((currentChunk + " " + word).trim().length > 120) {
        if (currentChunk.trim()) chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        currentChunk = (currentChunk + " " + word).trim();
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
        lang
      )}&client=tw-ob&q=${encodeURIComponent(chunk)}`;

      let chunkBuffer: Buffer | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await fetch(googleTtsUrl, {
            signal: AbortSignal.timeout(12000),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              Accept: "*/*",
            },
          });
          if (response.ok) {
            const arr = await response.arrayBuffer();
            chunkBuffer = Buffer.from(arr);
            break;
          }
        } catch {
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (chunkBuffer) {
        buffers.push(chunkBuffer);
      }
    }

    if (buffers.length > 0) {
      const result = Buffer.concat(buffers);
      audioCache.set(cacheKey, result);
      return result;
    }
  } catch (synthErr) {
    console.warn("TTS synthesis error:", synthErr);
  }
  return null;
}

/**
 * Server-Side Audio Streaming Engine & Tajwid Reciter (Option A)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const text = searchParams.get("text");
    const lang = searchParams.get("lang") || "ar";

    // --------------------------------------------------------------------------
    // 1. Asmaul Husna: Authentic Human Qari Pronunciation
    // --------------------------------------------------------------------------
    if (type === "asma" && id) {
      const nameNumber = parseInt(id, 10);
      if (!isNaN(nameNumber) && nameNumber >= 1 && nameNumber <= 99) {
        const cacheKey = `asma:${nameNumber}`;
        if (audioCache.has(cacheKey)) {
          const cached = audioCache.get(cacheKey)!;
          return new NextResponse(cached as unknown as BodyInit, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
              "Content-Length": cached.length.toString(),
            },
          });
        }

        const asmaAudioUrl = `https://6a0371d6d2c0468550d1fdea--gleaming-tapioca-363d34.netlify.app/${nameNumber}.mp3`;
        const buffer = await fetchAudioBuffer(asmaAudioUrl);
        if (buffer) {
          audioCache.set(cacheKey, buffer);
          return new NextResponse(buffer as unknown as BodyInit, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
              "Content-Length": buffer.length.toString(),
            },
          });
        }
      }
    }

    // --------------------------------------------------------------------------
    // 2. Al-Ma'tsurat: Authentic Qari Tajwid Audio (Option A)
    // --------------------------------------------------------------------------
    if (type === "matsurat" && id) {
      const cacheKey = `matsurat:${id}`;
      if (audioCache.has(cacheKey)) {
        const cached = audioCache.get(cacheKey)!;
        return new NextResponse(cached as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
            "Content-Length": cached.length.toString(),
          },
        });
      }

      // 2A. Quranic Verses (Syaikh Mishary Rashid Alafasy) with Sacred Tajwid
      const quranTarget = QURAN_AUDIO_MAP[id];
      if (quranTarget) {
        let finalBuffer: Buffer | null = null;
        if (Array.isArray(quranTarget)) {
          const buffers: Buffer[] = [];
          for (const u of quranTarget) {
            const b = await fetchAudioBuffer(u);
            if (b) buffers.push(b);
          }
          if (buffers.length > 0) {
            finalBuffer = Buffer.concat(buffers);
          }
        } else {
          finalBuffer = await fetchAudioBuffer(quranTarget);
        }

        if (finalBuffer && finalBuffer.length > 0) {
          audioCache.set(cacheKey, finalBuffer);
          return new NextResponse(finalBuffer as unknown as BodyInit, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
              "Content-Length": finalBuffer.length.toString(),
            },
          });
        }
      }

      // 2B. Clean Hadith Supplications with Exact Matching Audio (No Footnotes)
      const dzikirTarget = DZIKIR_AUDIO_MAP[id];
      if (dzikirTarget) {
        const buffer = await fetchAudioBuffer(dzikirTarget, 4000);
        if (buffer && buffer.length > 0) {
          audioCache.set(cacheKey, buffer);
          return new NextResponse(buffer as unknown as BodyInit, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
              "Content-Length": buffer.length.toString(),
            },
          });
        }
      }
      // If item has no static match (e.g. time-varying supplications), fall through to synthesizeText!
    }

    // --------------------------------------------------------------------------
    // 3. Exact Card Text Synthesis (Mahfuzhat, Sirah, & Dynamic Supplications)
    // --------------------------------------------------------------------------
    if (text && text.trim().length > 0) {
      const textBuffer = await synthesizeChunkedTts(text, lang);
      if (textBuffer && textBuffer.length > 0) {
        return new NextResponse(textBuffer as unknown as BodyInit, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
            "Content-Length": textBuffer.length.toString(),
          },
        });
      }
    }

    return new NextResponse("Invalid audio request parameters", { status: 400 });
  } catch (error) {
    console.error("Audio streaming proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
