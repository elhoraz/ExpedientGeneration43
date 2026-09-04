import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, any> = {
    server: "online",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || "production",
  };

  let isHealthy = true;

  // 1. Check Database Connectivity
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      checks.database = { status: "misconfigured", message: "Supabase environment keys missing" };
      isHealthy = false;
    } else {
      const supabase = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      });

      const dbStart = Date.now();
      const { error } = await supabase.from("site_content").select("content_key").limit(1);
      const dbLatency = Date.now() - dbStart;

      if (error && error.code !== "PGRST116") {
        checks.database = { status: "degraded", latencyMs: dbLatency, error: error.message };
        isHealthy = false;
      } else {
        checks.database = { status: "connected", latencyMs: dbLatency };
      }
    }
  } catch (err: any) {
    checks.database = { status: "error", error: err?.message || "Connection failed" };
    isHealthy = false;
  }

  // 2. Check Essential Environment Secrets
  const envCheck = {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    fonnte: !!process.env.FONNTE_TOKEN,
    adminMaster: !!process.env.ADMIN_MASTER_PASSWORD,
    smtp: !!(process.env.SMTP_USER || process.env.SUPABASE_CUSTOM_SMTP_USER),
  };
  checks.servicesConfigured = envCheck;

  const totalLatency = Date.now() - startTime;
  checks.latencyMs = totalLatency;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      service: "expedient-next-api",
      version: "2.4.0",
      ...checks,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Health-Check": isHealthy ? "PASS" : "FAIL",
      },
    }
  );
}
