export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dispatchSystemAlert, TelemetryEvent } from "@/lib/sentinel/telemetryAlert";

export async function POST(request: Request) {
  try {
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
