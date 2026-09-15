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
    // 3. Dynamic Speech Synthesis Fallback
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
