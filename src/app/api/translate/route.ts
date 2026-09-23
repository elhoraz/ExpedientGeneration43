import { NextRequest, NextResponse } from "next/server";

// Server-side in-memory translation cache (LRU-like cache of 5,000 entries)
const translationCache = new Map<string, string>();
const MAX_CACHE_SIZE = 5000;

function getCacheKey(text: string, to: string, from: string): string {
  return `${from}:${to}:${text.trim()}`;
}

async function translateSingle(text: string, to: string, from: string = "auto"): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  // Don't translate pure numbers, symbols, emails, or URLs
  if (/^[\d\s.,:;!?%&+\-*/=()#@$€£¥_<>]+$/.test(trimmed)) return text;
  if (/^https?:\/\//i.test(trimmed)) return text;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return text;

  const cacheKey = getCacheKey(trimmed, to, from);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      from
    )}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: 86400 }, // Cache on edge/Next.js for 24 hours
    });

    if (!res.ok) {
      throw new Error(`Translation API responded with status ${res.status}`);
    }

    const data = await res.json();
    // Google Translate GTX response format: [[["translated text", "original text", ...], ...]]
    let translated = "";
    if (Array.isArray(data) && Array.isArray(data[0])) {
      translated = data[0].map((chunk: any) => chunk[0] || "").join("");
    }

    if (translated) {
      // Store in memory cache
      if (translationCache.size >= MAX_CACHE_SIZE) {
        const firstKey = translationCache.keys().next().value;
        if (firstKey) translationCache.delete(firstKey);
      }
      translationCache.set(cacheKey, translated);
      return translated;
    }

    return text;
  } catch (err) {
    console.warn(`[Translate API] Failed to translate: "${trimmed.slice(0, 30)}..."`, err);
    return text; // Graceful fallback: return original text
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texts, text, to = "en", from = "auto" } = body;

    if (!["en", "ar", "id"].includes(to)) {
      return NextResponse.json({ error: "Unsupported target language" }, { status: 400 });
    }

    // Support single text or array of texts
    const inputTexts: string[] = Array.isArray(texts)
      ? texts
      : typeof text === "string"
      ? [text]
      : [];

    if (inputTexts.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    // Limit batch size to 50 items per request to ensure ultra-fast response
    const limitedTexts = inputTexts.slice(0, 50);

    // Translate all items concurrently
    const results = await Promise.all(
      limitedTexts.map(async (t) => {
        const translated = await translateSingle(t, to, from);
        return { original: t, translated };
      })
    );

    const translationsMap: Record<string, string> = {};
    for (const r of results) {
      translationsMap[r.original] = r.translated;
    }

    return NextResponse.json(
      {
        success: true,
        to,
        from,
        translations: translationsMap,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error: any) {
    console.error("[Translate API] Error:", error);
    return NextResponse.json({ error: error.message || "Translation failed" }, { status: 500 });
  }
}
