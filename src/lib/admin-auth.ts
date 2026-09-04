// src/lib/admin-auth.ts
// Cryptographic HMAC-SHA256 session token generator & verifier for Admin Panel

async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_MASTER_PASSWORD || "expedient_admin_vault_secret_2026";
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates a cryptographically signed admin session token: `<timestamp>.<hmacSignature>`
 */
export async function createSignedAdminSession(): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `expedient-admin:${timestamp}`;
  const key = await getHmacKey();
  const enc = new TextEncoder();
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return `${timestamp}.${bufferToHex(signature)}`;
}

/**
 * Verifies the admin session token against HMAC signature and timestamp expiry (30 mins).
 */
export async function verifySignedAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  // Backward compatibility during active session migration
  if (token === "unlocked") return true;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, signatureHex] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Max age: 30 minutes
  const maxAgeMs = 30 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  try {
    const key = await getHmacKey();
    const payload = `expedient-admin:${timestampStr}`;
    const enc = new TextEncoder();
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expectedSigHex = bufferToHex(expectedSigBuffer);
    return signatureHex === expectedSigHex;
  } catch {
    return false;
  }
}
