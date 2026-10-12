export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit
) => NextResponse.json({ status, message, data }, init);

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Terjadi kesalahan server.";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse("error", "Unauthorized", null, { status: 401 });
    }

    const gatewayUrl = (process.env.WA_GATEWAY_URL || "https://expedient43-bot.onrender.com").replace(/\/+$/, "");

    try {
      const res = await fetch(`${gatewayUrl}/api/status`, {
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => ({}));
      const isConnected = Boolean(data.gatewayStatus === "connected");
      const deviceName = data.activeUser?.name || data.activeUser?.id || "Bot Expedient 43";
      
      let reason = "";
      if (isConnected) {
        reason = `Terhubung (${deviceName}) · Baileys Live Gateway (Uptime: ${data.uptimeSeconds || 0}s)`;
      } else {
        reason = `WhatsApp Terputus (${data.gatewayStatus || "Offline"}) · ${data.lastDisconnectInfo || "Silakan hubungkan gateway"}`;
      }

      return jsonResponse("success", reason, {
        api_ok: isConnected,
        device_status: data.gatewayStatus,
        device: deviceName,
        quota: "Unlimited (Self-Hosted)",
        reason,
        gateway_url: gatewayUrl,
      });
    } catch (err: unknown) {
      const reason = `Gateway Baileys unreachable (${getErrorMessage(err)})`;
      return jsonResponse("success", reason, {
        api_ok: false,
        reason,
      });
    }
  } catch (err: unknown) {
    const reason = getErrorMessage(err);
    return jsonResponse("error", reason, {
      api_ok: false,
      reason,
    }, { status: 500 });
  }
}
