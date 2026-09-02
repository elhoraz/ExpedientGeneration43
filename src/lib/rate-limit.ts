// lib/rate-limit.ts
// In-memory rate limiter (per serverless instance)
// For distributed rate limiting, use @upstash/ratelimit with Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Simple in-memory rate limiter.
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
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
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
