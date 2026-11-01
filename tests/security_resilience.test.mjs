import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Simulasi Unit Test Ketahanan Keamanan Lokal (Defensive QA Suite)", () => {
  // 1. Verifikasi HMAC Admin Session & Penolakan Cookie Legacy "unlocked"
  it("Skenario 1: Percobaan memalsukan cookie admin ('unlocked' atau signature palsu) -> DITOLAK", async () => {
    process.env.ADMIN_MASTER_PASSWORD = "test-master-password-for-unit-test";
    const {
      createSignedAdminSession,
      verifySignedAdminSession,
      timingSafeEqualString,
    } = await import("../src/lib/admin-auth.ts");

    assert.equal(await verifySignedAdminSession(undefined), false, "Token kosong harus ditolak");
    assert.equal(await verifySignedAdminSession("unlocked"), false, "Bypass legacy 'unlocked' harus ditolak");
    assert.equal(await verifySignedAdminSession("123456.invalidhex"), false, "Signature tidak valid harus ditolak");

    const validToken = await createSignedAdminSession();
    assert.equal(await verifySignedAdminSession(validToken), true, "Token HMAC asli harus diterima");

    // Token kedaluwarsa (> 4 jam)
    const expiredTimestamp = (Date.now() - 5 * 60 * 60 * 1000).toString();
    const parts = validToken.split(".");
    const expiredToken = `${expiredTimestamp}.${parts[1]}`;
    assert.equal(await verifySignedAdminSession(expiredToken), false, "Token kedaluwarsa harus ditolak");

    assert.equal(timingSafeEqualString("secret-123", "secret-123"), true);
    assert.equal(timingSafeEqualString("secret-123", "secret-124"), false);
  });

  // 2. Simulasi Brute-Force & Pemalsuan IP Header (x-forwarded-for)
  it("Skenario 2: Percobaan brute-force password admin & pemalsuan IP -> DIBLOKIR (429 Too Many Requests)", async () => {
    const { rateLimit, getClientIp } = await import("../src/lib/rate-limit.ts");

    // Simulasi request dengan X-Forwarded-For palsu namun Vercel menyertakan x-real-ip asli
    const simulatedReq = new Request("http://localhost:3000/api/admin/unlock", {
      headers: {
        "x-forwarded-for": "10.0.0.1, 192.168.1.1",
        "x-real-ip": "198.51.100.77",
      },
    });
    const detectedIp = getClientIp(simulatedReq);
    assert.equal(detectedIp, "198.51.100.77", "Server harus membaca IP asli dari x-real-ip, bukan X-Forwarded-For palsu");

    // Simulasi 5x percobaan gagal berturut-turut, percobaan ke-6 langsung diblokir
    const key = `admin-unlock:${detectedIp}:${Date.now()}`;
    for (let i = 1; i <= 5; i++) {
      assert.equal(rateLimit(key, 5, 15 * 60 * 1000).success, true);
    }
    const sixthAttempt = rateLimit(key, 5, 15 * 60 * 1000);
    assert.equal(sixthAttempt.success, false, "Percobaan ke-6 harus langsung dikunci (HTTP 429)");
  });

  // 3. Simulasi Webhook Telegram Tanpa Secret Token Resmi
  it("Skenario 3: Pihak luar mengirim request palsu ke Webhook Telegram -> DITOLAK (401 Unauthorized)", async () => {
    process.env.TELEGRAM_ADMIN_CHAT_ID = "8455610044";
    process.env.TELEGRAM_BOT_TOKEN = "test-bot-token-for-simulation";
    process.env.TELEGRAM_WEBHOOK_SECRET = "expected-secret-token";

    const { POST } = await import("../src/app/api/telegram/webhook/route.ts");

    const unauthenticatedWebhookReq = new Request("http://localhost:3000/api/telegram/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-real-ip": "198.51.100.88",
        "x-telegram-bot-api-secret-token": "wrong-token",
      },
      body: JSON.stringify({
        message: { from: { id: 8455610044 }, text: "/status" },
      }),
    });

    const response = await POST(unauthenticatedWebhookReq);
    assert.equal(response.status, 401, "Webhook tanpa secret token yang sah harus ditolak dengan HTTP 401");
  });

  // 4. Simulasi SSRF / Open Proxy pada Endpoint Photobooth Download
  it("Skenario 4: Percobaan menyalahgunakan proxy unduhan ke domain eksternal -> DITOLAK (403 Forbidden)", async () => {
    const { GET } = await import("../src/app/api/photobooth/download/route.ts");
    const { NextRequest } = await import("next/server");

    const untrustedProxyReq = new NextRequest(
      "http://localhost:3000/api/photobooth/download?url=https://example.com/internal-data"
    );
    const response = await GET(untrustedProxyReq);
    assert.equal(response.status, 403, "Domain di luar Supabase Storage resmi harus ditolak dengan HTTP 403");
  });

  // 5. Simulasi Sanitasi HTML & Proteksi Open Redirect
  it("Skenario 5: Injeksi tag berbahaya pada konten & pengalihan URL eksternal -> DIBERSIHKAN / DIALIHKAN", async () => {
    const { sanitizeHtml } = await import("../src/lib/sanitize.ts");

    const dirtyHtml = `<p>Pesan Wasiat</p><script>window.location='https://example.com'</script><svg onload="init()"></svg>`;
    const cleanHtml = sanitizeHtml(dirtyHtml);

    assert.equal(cleanHtml, "<p>Pesan Wasiat</p>", "Seluruh elemen script dan svg berbahaya harus dibuang");
  });
});
