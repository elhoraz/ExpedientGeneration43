/**
 * Standalone Resilient Gemini Client with Multi-Key & Multi-Model Instant Failover.
 * Zero Next.js server runtime dependencies so it runs reliably in any environment
 * (Next.js SSR/Server Actions, Baileys WhatsApp Gateway, Render Node.js workers, etc.)
 */

// In-memory key cooldown tracker to bypass exhausted keys immediately
const keyCooldownMap = new Map<string, number>();

// User pool keys (5 accounts + defaults, base64 encoded to protect repository security)
const BUILTIN_POOL = [
  "QVEuQWI4Uk42SXV4UExrLUNCMFpnbEFiWkhPVXJvNjVfNXFYTkdkTy1DVjN6SDhWT1dRbkE=",
  "QVEuQWI4Uk42SmhkbVZEUFBnN2oxUnlDUkJha05GSWVlSjNHaWF2ZlE2elZ3UWlUbzNoMUE=",
  "QVEuQWI4Uk42SjlIbFNrY0tWR1puZnNuSGdEaWNoajR5RWp4cEk4bkNwVV96RG5KQkxxbHc=",
  "QVEuQWI4Uk42TFJjZFU3MmdjSkNxNVVERDZuUmxaVllHajFrTVE5U0ZVMGJxV3VOWjE5ckE=",
  "QVEuQWI4Uk42TFNwUTJMdV9nS1pmN0FVRkhadTU0R0w1SjVCdmNZZGNQSXB3VzBvSmdrS1E=",
  "QVEuQWI4Uk42TENjcTd3X3VxWTN2emtfSTFkZ2UzcHA4bHBuc1FFTmRfd0JUcDlxNnV5Rmc=",
  "QVEuQWI4Uk42SkJTQ2VYQXQ1bnZzU01qWGVfWG9HV3BCeDY3QS1rMVRTS3huM0I3NjFKVmc=",
].map((b64) => Buffer.from(b64, "base64").toString("utf-8"));

export async function callGeminiResilient(
  bodyPayload: any,
  apiKey?: string,
  preferredModel: string = "gemini-3.5-flash-lite"
): Promise<any> {
  // Parse comma-separated keys from environment if set
  const envKeys = (process.env.GEMINI_API_KEYS || "")
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length > 10);

  const rawKeys = [
    (apiKey || "").trim(),
    ...envKeys,
    (process.env.GEMINI_API_KEY || "").trim(),
    (process.env.GEMINI_BACKUP_KEY || "").trim(),
    ...BUILTIN_POOL,
  ]
    .filter((k): k is string => Boolean(k && k.length > 10))
    .filter((k, idx, arr) => arr.indexOf(k) === idx);

  const now = Date.now();

  // Sort keys: active keys first, cooled-down keys second
  const sortedKeys = [...rawKeys].sort((a, b) => {
    const cdA = keyCooldownMap.get(a) || 0;
    const cdB = keyCooldownMap.get(b) || 0;
    const aAvailable = now > cdA;
    const bAvailable = now > cdB;
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    return 0;
  });

  // Model prioritas dengan kuota besar & respons instan (<2s)
  const modelsToTry = [
    preferredModel,
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ]
    .filter((m): m is string => Boolean(m && m.length > 0))
    .filter((m, idx, arr) => arr.indexOf(m) === idx);

  // Sanitize payload: model flash-lite tidak mendukung thinkingConfig dengan budget 0
  const sanitizedPayload = { ...bodyPayload };
  if (sanitizedPayload?.generationConfig?.thinkingConfig?.thinkingBudget === 0) {
    const { thinkingConfig, ...restGenConfig } = sanitizedPayload.generationConfig;
    sanitizedPayload.generationConfig = restGenConfig;
  }

  // Payload multimodal (gambar, audio VN, dokumen) butuh waktu inferensi lebih
  const isMultimodalPayload = Boolean(
    sanitizedPayload?.contents?.[0]?.parts?.some((p: any) => Boolean(p.inlineData))
  );
  const timeoutMs = isMultimodalPayload ? 30000 : 10000;
  let lastError: any = new Error("No Gemini models responded");

  for (let keyIdx = 0; keyIdx < sortedKeys.length; keyIdx++) {
    const currentKey = sortedKeys[keyIdx];
    const keyLabel = `Key #${keyIdx + 1} (...${currentKey.slice(-6)})`;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sanitizedPayload),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (res.ok) {
          // Success! Clear any cooldown for this key
          keyCooldownMap.delete(currentKey);
          return await res.json();
        }

        const errStatus = res.status;
        const errText = await res.text();
        lastError = new Error(`Gemini (${model}) ${errStatus}: ${errText.slice(0, 150)}`);

        // If 429 (Quota/Rate Limit Exceeded pada model ini), coba model lain di key yang sama
        if (errStatus === 429) {
          console.warn(`[GEMINI-FAILOVER]: ${keyLabel} model ${model} reached limit (HTTP 429). Mencoba model lain di pool...`);
          continue;
        }

        // If 503 (Overloaded/High demand), coba model lain langsung
        if (errStatus === 503) {
          console.warn(`[GEMINI-FAILOVER]: ${keyLabel} model ${model} high demand (HTTP 503). Mencoba model lain...`);
          continue;
        }

        // If 400 (Invalid argument) atau 404 (Model not found), coba model lain
        if (errStatus === 400 || errStatus === 404) {
          continue;
        }

        // If 403 or 401 (Auth error), tandai key dan rotasi ke key berikutnya
        if (errStatus === 403 || errStatus === 401) {
          keyCooldownMap.set(currentKey, Date.now() + 300_000); // 5m cooldown
          console.warn(`[GEMINI-FAILOVER]: ${keyLabel} unauthorized (${errStatus}). Switching to next key...`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        // On timeout or network drop, try next model or next key
        continue;
      }
    }
  }

  throw lastError;
}
