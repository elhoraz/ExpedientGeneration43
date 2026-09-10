/**
 * Allowed hosts for redirect origin resolution.
 * Prevents open redirect attacks via x-forwarded-host header spoofing.
 */
const ALLOWED_HOSTS = new Set([
  "expedientgeneration.vercel.app",
  "localhost:3000",
  "localhost",
]);

export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    const cleanHost = forwardedHost.split(",")[0].trim().toLowerCase();
    // Only trust x-forwarded-host if it's in our allowed hosts list
    if (ALLOWED_HOSTS.has(cleanHost)) {
      return `${forwardedProto}://${cleanHost}`;
    }
    // Fallback: don't trust the spoofed header
  }

  // Derive from NEXT_PUBLIC_SITE_URL for consistency, or fall back to request URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}
