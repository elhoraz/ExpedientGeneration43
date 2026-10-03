import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

// Polyfill WebSocket globally for Node.js environment
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-ignore
  globalThis.WebSocket = WebSocket;
}
if (typeof global !== "undefined" && typeof (global as any).WebSocket === "undefined") {
  (global as any).WebSocket = WebSocket;
}

const FALLBACK_SUPABASE_URL = "https://dodcwulqgrhqpbldrlik.supabase.co";
const FALLBACK_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZGN3dWxxZ3JocXBibGRybGlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk3NDU4MiwiZXhwIjoyMDk2NTUwNTgyfQ.trCfE5Suo0KaG2W-qkx8NQ5Iv6USgNiF-ifo4H6nIHY";

/**
 * Reusable Supabase Admin Client using Service Role Key.
 * Bypass Row Level Security (RLS) for backend/server tasks.
 */
export function createAdminClient(
  url?: string,
  serviceRoleKey?: string,
  options?: Parameters<typeof createClient>[2]
) {
  const supabaseUrl = (url || process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL).trim();
  const key = (serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY).trim();

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      transport: WebSocket,
    },
    ...options,
  });
}
