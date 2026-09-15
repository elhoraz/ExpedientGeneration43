import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Server-Side Audio Streaming Engine & Proxy
 * 1. type=asma&id=N: Authentic human Qari tartil recitation for 99 Asmaul Husna with tajwid
 * 2. type=quran&ayah=SSSSAAA: Authentic Mishary Rashid Alafasy Quran recitation
 * 3. text=...&lang=...: Dynamic Arabic/Indonesian speech fallback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const ayah = searchParams.get("ayah");
    const text = searchParams.get("text");
    const lang = searchParams.get("lang") || "ar";

    // --------------------------------------------------------------------------
    // 1. Authentic Human Qari Tartil for 99 Asmaul Husna
    // --------------------------------------------------------------------------
    if (type === "asma" && id) {
      const nameNumber = parseInt(id, 10);
      if (!isNaN(nameNumber) && nameNumber >= 1 && nameNumber <= 99) {
        const asmaAudioUrl = `https://6a0371d6d2c0468550d1fdea--gleaming-tapioca-363d34.netlify.app/${nameNumber}.mp3`;
        try {
          const response = await fetch(asmaAudioUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            },
          });

          if (response.ok) {
            const buffer = await response.arrayBuffer();
            return new NextResponse(buffer, {
              status: 200,
              headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
                "Content-Length": buffer.byteLength.toString(),
              },
            });
          }
        } catch (fetchErr) {
          console.warn(`Asma human audio fetch error for #${id}:`, fetchErr);
        }
      }
    }

    // --------------------------------------------------------------------------
    // 2. Authentic Quranic Recitation (Mishary Rashid Alafasy)
    // --------------------------------------------------------------------------
    if (type === "quran" && ayah) {
      const quranUrl = `https://verses.quran.com/Alafasy/mp3/${ayah}.mp3`;
      try {
        const response = await fetch(quranUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          },
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
              "Content-Length": buffer.byteLength.toString(),
            },
          });
        }
      } catch (fetchErr) {
        console.warn(`Quran ayah audio fetch error for #${ayah}:`, fetchErr);
      }
    }

    // --------------------------------------------------------------------------
    // 3. Authentic Tajwid Recitation for Al-Ma'tsurat (Hisn al-Muslim & Alafasy)
    // --------------------------------------------------------------------------
    if (type === "matsurat" && id) {
      const MATSURAT_AUDIO_MAP: Record<string, string | string[]> = {
        taawwudz: "https://everyayah.com/data/Alafasy_128kbps/001001.mp3",
        fatihah: "https://server8.mp3quran.net/afs/001.mp3",
        baqarah_awal: [
          "https://everyayah.com/data/Alafasy_128kbps/002001.mp3",
          "https://everyayah.com/data/Alafasy_128kbps/002002.mp3",
          "https://everyayah.com/data/Alafasy_128kbps/002003.mp3",
          "https://everyayah.com/data/Alafasy_128kbps/002004.mp3",
          "https://everyayah.com/data/Alafasy_128kbps/002005.mp3",
        ],
        ayat_kursi: "https://verses.quran.com/Alafasy/mp3/002255.mp3",
        baqarah_akhir: [
          "https://everyayah.com/data/Alafasy_128kbps/002284.mp3",
          "https://everyayah.com/data/Alafasy_128kbps/002285.mp3",
          "https://everyayah.com/data/Alafasy_128kbps/002286.mp3",
        ],
        ikhlas: "https://server8.mp3quran.net/afs/112.mp3",
        falaq: "https://server8.mp3quran.net/afs/113.mp3",
        nas: "https://server8.mp3quran.net/afs/114.mp3",
        doa_asbahna_amsayna: "http://www.hisnmuslim.com/audio/ar/77.mp3",
        doa_fithrah: "http://www.hisnmuslim.com/audio/ar/90.mp3",
        doa_nikmat: "http://www.hisnmuslim.com/audio/ar/84.mp3",
        doa_syukur: "http://www.hisnmuslim.com/audio/ar/81.mp3",
        pujian_agung: "http://www.hisnmuslim.com/audio/ar/89.mp3",
        ridha_iman: "http://www.hisnmuslim.com/audio/ar/87.mp3",
        tasbih_makhluk: "http://www.hisnmuslim.com/audio/ar/94.mp3",
        bismillahilladzi: "http://www.hisnmuslim.com/audio/ar/86.mp3",
        doa_syirik: "http://www.hisnmuslim.com/audio/ar/203.mp3",
        a_udzu_bikalimatillah: "http://www.hisnmuslim.com/audio/ar/97.mp3",
        doa_bebas_hutang: "http://www.hisnmuslim.com/audio/ar/137.mp3",
        doa_afiyah: "http://www.hisnmuslim.com/audio/ar/82.mp3",
        sayyidul_istighfar: "http://www.hisnmuslim.com/audio/ar/79.mp3",
        istighfar_100: "http://www.hisnmuslim.com/audio/ar/96.mp3",
        hasbiyallah: "http://www.hisnmuslim.com/audio/ar/83.mp3",
        shalawat_nabi: "http://www.hisnmuslim.com/audio/ar/98.mp3",
        tasbih_100: "http://www.hisnmuslim.com/audio/ar/91.mp3",
        tahlil_10: "http://www.hisnmuslim.com/audio/ar/92.mp3",
        doa_rabithah: [
          "https://everyayah.com/data/Alafasy_128kbps/003026.mp3",
          "https://everyayah.com/data/Alafasy_128kbps/003027.mp3",
        ],
      };

      const target = MATSURAT_AUDIO_MAP[id];
      if (target) {
        try {
          const fetchUrl = async (url: string): Promise<Buffer | null> => {
            const res = await fetch(url, {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              },
            });
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              return Buffer.from(arrayBuf);
            }
            return null;
          };

          let finalBuffer: Buffer | null = null;

          if (Array.isArray(target)) {
            const buffers = await Promise.all(target.map((u) => fetchUrl(u)));
            const validBuffers = buffers.filter((b): b is Buffer => b !== null);
            if (validBuffers.length > 0) {
              finalBuffer = Buffer.concat(validBuffers);
            }
          } else {
            finalBuffer = await fetchUrl(target);
          }

          if (finalBuffer && finalBuffer.length > 0) {
            return new NextResponse(finalBuffer as unknown as BodyInit, {
              status: 200,
              headers: {
                "Content-Type": "audio/mpeg",
                "Cache-Control": "public, max-age=2592000, s-maxage=31536000, immutable",
                "Content-Length": finalBuffer.length.toString(),
              },
            });
          }
        } catch (fetchErr) {
          console.warn(`Matsurat audio fetch error for #${id}:`, fetchErr);
        }
      }
    }

    // --------------------------------------------------------------------------
    // 4. Dynamic Speech Synthesis Fallback
    // --------------------------------------------------------------------------
    if (text && text.trim().length > 0) {
      const sanitizedText = text.trim().slice(0, 400);
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(
        lang
      )}&client=tw-ob&q=${encodeURIComponent(sanitizedText)}`;

      const response = await fetch(googleTtsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "*/*",
        },
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
            "Content-Length": audioBuffer.byteLength.toString(),
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
