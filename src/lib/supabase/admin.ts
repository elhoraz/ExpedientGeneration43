import { createClient } from "@supabase/supabase-js";

/**
 * Reusable Supabase Admin Client using Service Role Key.
 * Bypass Row Level Security (RLS) for backend/server tasks.
 */
export function createAdminClient(
  url: string = process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  serviceRoleKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  options?: Parameters<typeof createClient>[2]
) {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !key) {
    throw new Error("Missing Supabase admin environment variables");
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...options,
  });
}
