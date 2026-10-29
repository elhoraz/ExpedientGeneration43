export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dispatchSystemAlert, TelemetryEvent } from "@/lib/sentinel/telemetryAlert";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rl = rateLimit(`telemetry-report:${clientIp}`, 10, 5 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ status: "throttled", sent: false, throttled: true }, { status: 429 });
    }

    const originHeader = request.headers.get("origin") || request.headers.get("referer") || "";
    if (originHeader && process.env.NODE_ENV === "production") {
      try {
        const parsedOrigin = new URL(originHeader);
        const siteHost = process.env.NEXT_PUBLIC_SITE_URL
          ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname
          : "expedientgeneration.vercel.app";
        if (
          parsedOrigin.hostname !== siteHost &&
          parsedOrigin.hostname !== "expedientgeneration.vercel.app" &&
          !parsedOrigin.hostname.endsWith(".vercel.app")
        ) {
          return NextResponse.json({ status: "error", message: "Forbidden origin" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ status: "error", message: "Invalid origin" }, { status: 400 });
      }
    }

    const body = (await request.json().catch(() => null)) as TelemetryEvent | null;
    if (!body || !body.message) {
      return NextResponse.json({ status: "error", message: "Invalid telemetry payload" }, { status: 400 });
    }

    // Sanitize message to prevent any oversized payloads
    const sanitizedEvent: TelemetryEvent = {
      category: body.category || "js_crash",
      message: String(body.message || "").slice(0, 500),
      detail: body.detail ? String(body.detail).slice(0, 500) : undefined,
      route: body.route ? String(body.route).slice(0, 100) : "/",
      selector: body.selector ? String(body.selector).slice(0, 200) : undefined,
      stack: body.stack ? String(body.stack).slice(0, 1000) : undefined,
      deviceInfo: body.deviceInfo,
      userContext: body.userContext,
      timestamp: body.timestamp || Date.now(),
    };

    const result = await dispatchSystemAlert(sanitizedEvent);
    return NextResponse.json({
      status: "ok",
      sent: result.success && !result.throttled,
      throttled: Boolean(result.throttled),
      provider: result.provider || "none",
    });
  } catch (err: any) {
    console.error("[API-TELEMETRY-ERROR]", err);
    return NextResponse.json(
      { status: "error", message: err?.message || "Internal telemetry error" },
      { status: 500 }
    );
  }
}
