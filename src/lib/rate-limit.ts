// lib/rate-limit.ts
// In-memory rate limiter (per serverless instance).
//
// IMPORTANT: On Vercel serverless, each function instance has its own Map.
// This provides per-instance protection (still blocks rapid bursts from the
// same client hitting the same instance), but is NOT a distributed rate limiter.
// For strict distributed rate limiting, migrate to @upstash/ratelimit with Redis.
//
// The setInterval-based cleanup was removed because serverless functions are
// frozen between invocations — intervals never fire. Instead, stale entries
// are cleaned up inline during each rateLimit() call.

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Max entries to prevent unbounded memory growth in long-lived instances
const MAX_ENTRIES = 10000;

/**
 * Inline cleanup: remove expired entries when the map grows too large.
 * Called automatically during rateLimit() — no setInterval needed.
 */
function cleanupStaleEntries(now: number): void {
  if (rateLimitMap.size <= MAX_ENTRIES) return;

  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Simple in-memory rate limiter with per-access stale cleanup.
 * @param key - Unique identifier (e.g., IP address or user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns { success: boolean, remaining: number, resetIn: number }
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 15 * 60 * 1000
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now();

  // Inline cleanup instead of setInterval (serverless-compatible)
  cleanupStaleEntries(now);

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window — also cleans up the expired entry implicitly
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (entry.count >= limit) {
    // Rate limited
    return { success: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  // Increment
  entry.count++;
  return { success: true, remaining: limit - entry.count, resetIn: entry.resetTime - now };
}

/**
 * Extract client identifier from request for rate limiting.
 * Uses X-Forwarded-For header (Vercel) or falls back to a default.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
