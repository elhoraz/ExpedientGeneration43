import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Server-Side TTS Proxy Endpoint
 * Streams authentic, native Arabic & Indonesian MP3 audio
 * Bypasses missing OS voice packs and browser SpeechSynthesis limitations.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");
    const lang = searchParams.get("lang") || "ar";

    if (!text || text.trim().length === 0) {
      return new NextResponse("Text parameter is required", { status: 400 });
    }

    // Limit text length to prevent abuse (max 400 characters)
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

    if (!response.ok) {
      return new NextResponse("Failed to fetch audio stream", { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("Audio TTS proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
