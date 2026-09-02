export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type WhatsappQueueItem = {
  id: number;
  no_whatsapp: string;
  message: string;
};

type FonnteResponse = {
  status?: boolean;
  reason?: string;
};

const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit
) => NextResponse.json({ status, message, data }, init);

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Terjadi kesalahan server.";

// Endpoint ini bisa dipanggil manual dari admin panel atau cron dengan CRON_SECRET.
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isCronRequest = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);
    if (!user && !isCronRequest) {
      return jsonResponse("error", "Unauthorized", null, { status: 401 });
    }

    const { data: pendingQueue, error: fetchError } = await supabase
      .from("whatsapp_queue")
      .select("id, no_whatsapp, message")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    if (!pendingQueue || pendingQueue.length === 0) {
      return jsonResponse("success", "Queue is empty.", {
        processed: 0,
        sent: 0,
        failed: 0,
      });
    }

    const fonnteToken = process.env.FONNTE_TOKEN;
    if (!fonnteToken) {
      return jsonResponse("error", "FONNTE_TOKEN not set", null, { status: 500 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const item of pendingQueue as WhatsappQueueItem[]) {
      try {
        const payload = new URLSearchParams({
          target: item.no_whatsapp,
          message: item.message,
          delay: "1",
        });

        const response = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            ["Authorization"]: fonnteToken,
          },
          body: payload,
        });

        const result = await response.json() as FonnteResponse;

        if (result.status) {
          await supabase.from("whatsapp_queue").update({
            status: "sent",
            updated_at: new Date().toISOString(),
            error_message: null,
          }).eq("id", item.id);
          successCount++;
        } else {
          await supabase.from("whatsapp_queue").update({
            status: "failed",
            error_message: result.reason || "Fonnte rejected",
            updated_at: new Date().toISOString(),
          }).eq("id", item.id);
          failCount++;
        }
      } catch (err: unknown) {
        await supabase.from("whatsapp_queue").update({
          status: "failed",
          error_message: getErrorMessage(err),
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        failCount++;
      }
    }

    return jsonResponse("success", "Antrian WhatsApp selesai diproses.", {
      processed: pendingQueue.length,
      sent: successCount,
      failed: failCount,
    });
  } catch (err: unknown) {
    return jsonResponse("error", getErrorMessage(err), null, { status: 500 });
  }
}
