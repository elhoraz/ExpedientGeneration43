export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type FonnteDeviceResponse = {
  status?: boolean;
  device?: string;
  device_status?: string;
  reason?: string;
  quota?: string | number;
  package?: string;
  expired?: string;
};

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

    const token = process.env.FONNTE_TOKEN;
    if (!token) {
      return jsonResponse("success", "FONNTE_TOKEN not set in environment", {
        api_ok: false,
        reason: "FONNTE_TOKEN not set in environment",
      });
    }

    try {
      const res = await fetch("https://api.fonnte.com/device", {
        method: "POST",
        headers: { ["Authorization"]: token },
      });
      const data = await res.json() as FonnteDeviceResponse;
      
      const isConnected = Boolean(data.status && data.device_status === "connect");
      let reason = "";
      if (isConnected) {
        reason = `Terhubung (${data.device}) · Kuota: ${data.quota ?? 'N/A'}`;
      } else if (data.device_status === "disconnect") {
        reason = `WhatsApp Terputus (${data.device || 'Device'}) · Silakan scan QR ulang di fonnte.com`;
      } else if (data.device_status === "pairing") {
        reason = `Menunggu Scan QR (${data.device || 'Device'}) · Buka fonnte.com untuk scan`;
      } else {
        reason = data.reason || `Status device: ${data.device_status || 'Tidak diketahui'}`;
      }

      return jsonResponse("success", reason, {
        api_ok: isConnected,
        device_status: data.device_status,
        device: data.device,
        quota: data.quota,
        reason,
        token_value: "******" + token.slice(-4),
      });
    } catch (err: unknown) {
      const reason = getErrorMessage(err);
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
