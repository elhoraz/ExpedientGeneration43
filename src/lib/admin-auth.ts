// src/lib/admin-auth.ts
// Cryptographic HMAC-SHA256 session token generator & verifier for Admin Panel

async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_MASTER_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_MASTER_PASSWORD environment variable is not configured.");
  }
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

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time comparison of two Uint8Arrays to prevent timing attacks.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
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
 * Verifies the admin session token against HMAC signature and timestamp expiry (4 hours).
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifySignedAdminSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  // Token must be in format <timestamp>.<hmacSignature>
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, signatureHex] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Validate hex format
  if (!/^[0-9a-f]+$/i.test(signatureHex) || signatureHex.length === 0) return false;

  // Max age: 4 hours (240 minutes)
  const maxAgeMs = 4 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  try {
    const key = await getHmacKey();
    const payload = `expedient-admin:${timestampStr}`;
    const enc = new TextEncoder();
    const expectedSigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expectedSigBytes = new Uint8Array(expectedSigBuffer);
    const providedSigBytes = hexToUint8Array(signatureHex);

    // Constant-time comparison to prevent timing attacks
    return timingSafeEqual(expectedSigBytes, providedSigBytes);
  } catch {
    return false;
  }
}
