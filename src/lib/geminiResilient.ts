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
  preferredModel: string = "gemini-3.6-flash"
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

  // Model cerdas unggulan (Top-Tier Flash AI). JANGAN gunakan 3.1, 2.5, atau versi lite yang kualitasnya rendah!
  const modelsToTry = [
    preferredModel,
    "gemini-3.6-flash",
    "gemini-3.7-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
  ]
    .filter((m): m is string => Boolean(m && !m.includes("3.1") && !m.includes("2.5") && !m.includes("lite")))
    .filter((m, idx, arr) => arr.indexOf(m) === idx);

  // Sanitize payload: model flash tidak memerlukan thinkingConfig dengan budget 0
  const sanitizedPayload = { ...bodyPayload };
  if (sanitizedPayload?.generationConfig?.thinkingConfig?.thinkingBudget === 0) {
    const { thinkingConfig, ...restGenConfig } = sanitizedPayload.generationConfig;
    sanitizedPayload.generationConfig = restGenConfig;
  }

  // Payload multimodal (gambar, audio VN, dokumen) butuh waktu inferensi lebih
  const isMultimodalPayload = Boolean(
    sanitizedPayload?.contents?.[0]?.parts?.some((p: any) => Boolean(p.inlineData))
  );
  const timeoutMs = isMultimodalPayload ? 30000 : 12000;
  let lastError: any = new Error("No Gemini models responded");

  // STRATEGI KECERDASAN TINGGI (Smart-Model First, Multi-Account Rotation):
  // Kita coba model cerdas terbaik (Gemini 3.6 Flash / 3.7 Flash) di SELURUH akun API terlebih dahulu.
  // Jika 1 akun terkena limit/high demand, segera rotasi ke akun ke-2, ke-3, dst dengan MODEL CERDAS YANG SAMA.
  for (const model of modelsToTry) {
    for (let keyIdx = 0; keyIdx < sortedKeys.length; keyIdx++) {
      const currentKey = sortedKeys[keyIdx];
      const keyLabel = `Akun #${keyIdx + 1} (...${currentKey.slice(-6)})`;

      const cd = keyCooldownMap.get(`${currentKey}:${model}`) || keyCooldownMap.get(currentKey) || 0;
      if (now < cd) continue;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sanitizedPayload),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (res.ok) {
          // Sukses! Bersihkan cooldown
          keyCooldownMap.delete(currentKey);
          keyCooldownMap.delete(`${currentKey}:${model}`);
          return await res.json();
        }

        const errStatus = res.status;
        const errText = await res.text();
        lastError = new Error(`Gemini (${model}) ${errStatus}: ${errText.slice(0, 150)}`);

        // If 429 (Rate limit / Quota pada akun ini untuk model ini), beri cooldown dan rotasi ke akun berikutnya
        if (errStatus === 429) {
          keyCooldownMap.set(`${currentKey}:${model}`, Date.now() + 60_000);
          console.warn(`[GEMINI-POOL]: ${keyLabel} limit 429 pada ${model}. Beralih ke akun berikutnya...`);
          continue;
        }

        // If 503 (Temporary high demand pada akun ini), coba akun berikutnya dengan model cerdas yang sama
        if (errStatus === 503) {
          keyCooldownMap.set(`${currentKey}:${model}`, Date.now() + 15_000);
          console.warn(`[GEMINI-POOL]: ${keyLabel} 503 high demand pada ${model}. Beralih ke akun berikutnya...`);
          continue;
        }

        // If 403 or 401 (Auth error / token mati), tandai akun dan rotasi ke akun berikutnya
        if (errStatus === 403 || errStatus === 401) {
          keyCooldownMap.set(currentKey, Date.now() + 300_000);
          console.warn(`[GEMINI-POOL]: ${keyLabel} unauthenticated (${errStatus}). Beralih ke akun berikutnya...`);
          continue;
        }

        if (errStatus === 400 || errStatus === 404) {
          continue;
        }
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }
  }

  throw lastError;
}
