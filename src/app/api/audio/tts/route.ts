import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Server-Side Audio Streaming Engine & Proxy
 * High-reliability text-to-speech engine that recites the EXACT text from the cards
 * using chunked synthesis to avoid length restrictions.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");
    const lang = searchParams.get("lang") || "ar";

    // --------------------------------------------------------------------------
    // 1. Text-to-Speech: Exact Text Pronunciation (Chunked for reliability)
    // --------------------------------------------------------------------------
    if (text && text.trim().length > 0) {
      const clean = text
        .replace(/[۝«»""'']/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (clean.length > 0) {
        // Split text by words into chunks of <= 120 characters
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

          const response = await fetch(googleTtsUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              Accept: "*/*",
            },
          });

          if (response.ok) {
            const arr = await response.arrayBuffer();
            buffers.push(Buffer.from(arr));
          }
        }

        if (buffers.length > 0) {
          const finalBuffer = Buffer.concat(buffers);
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
    }

    return new NextResponse("Invalid audio request parameters", { status: 400 });
  } catch (error) {
    console.error("Audio streaming proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
