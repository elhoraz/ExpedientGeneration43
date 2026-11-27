import { createAdminClient } from "@/lib/supabase/admin";

// lib/rate-limit.ts
// Hybrid distributed rate limiter:
// 1. Upstash Redis REST (when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN exist)
// 2. Supabase Postgres atomic RPC consume_rate_limit (when NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY exist)
// 3. In-memory fallback map (per serverless instance / local tests)
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

function isUnitTestRuntime(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.execArgv.some((arg) => arg.includes("--test")) ||
    process.argv.some((arg) => arg.includes("--test"))
  );
}

/**
 * Distributed rate limiter for Vercel serverless & multi-instance deployments:
 * 1. Upstash Redis REST if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 * 2. Supabase Postgres RPC `consume_rate_limit` if SUPABASE_SERVICE_ROLE_KEY is set.
 * 3. Automatic fallback to in-memory `rateLimit()` on timeout, error, or test runtime.
 */
export async function rateLimitDistributed(
  key: string,
  limit: number = 10,
  windowMs: number = 15 * 60 * 1000
): Promise<{ success: boolean; remaining: number; resetIn: number }> {
  if (isUnitTestRuntime()) {
    return rateLimit(key, limit, windowMs);
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (redisUrl && redisToken) {
    try {
      const redisKey = `rl:${key}`;
      const res = await fetch(`${redisUrl.replace(/\/+$/, "")}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["PEXPIRE", redisKey, windowMs, "NX"],
          ["PTTL", redisKey],
        ]),
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      });

      if (res.ok) {
        const pipeline = (await res.json()) as Array<{ result?: number }>;
        const count = Number(pipeline?.[0]?.result ?? 1);
        const ttl = Number(pipeline?.[2]?.result ?? windowMs);
        const resetIn = ttl > 0 ? ttl : windowMs;

        if (count > limit) {
          return { success: false, remaining: 0, resetIn };
        }
        return { success: true, remaining: Math.max(0, limit - count), resetIn };
      }
    } catch {
      // Fall through to Supabase RPC / local fallback
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceKey) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const supabaseAdmin = createAdminClient();
      const rpcPromise = supabaseAdmin.rpc("consume_rate_limit", {
        p_key: key,
        p_limit: limit,
        p_window_ms: windowMs,
      });

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) => {
        timeoutId = setTimeout(() => resolve({ data: null, error: new Error("rateLimit RPC timeout") }), 1500);
      });

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

      if (!error && data) {
        const row = Array.isArray(data) ? data[0] : data;
        if (row && typeof row.allowed === "boolean") {
          return {
            success: row.allowed,
            remaining: Math.max(0, Number(row.remaining ?? 0)),
            resetIn: Math.max(0, Number(row.reset_in_ms ?? windowMs)),
          };
        }
      }
    } catch {
      // Fall back to in-memory limiter so slow DB never breaks auth/API availability
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  return rateLimit(key, limit, windowMs);
}

/**
 * Extract client identifier from request for rate limiting.
 * Prefers Vercel's trusted x-real-ip header to prevent X-Forwarded-For spoofing.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1].trim() || parts[0].trim();
  }
  return "unknown";
}
