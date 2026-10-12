export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifySignedAdminSession } from "@/lib/admin-auth";

type WhatsappQueueItem = {
  id: number;
  no_whatsapp: string;
  message: string;
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
    const isCronRequest = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!isCronRequest) {
      if (!user) {
        return jsonResponse("error", "Unauthorized", null, { status: 401 });
      }

      const cookieStore = await cookies();
      const adminToken = cookieStore.get("expedient_admin_session")?.value;
      const isValidSession = await verifySignedAdminSession(adminToken);
      if (!isValidSession) {
        return jsonResponse("error", "Forbidden: Sesi admin diperlukan", null, { status: 403 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
        return jsonResponse("error", "Forbidden: Hanya Admin yang berhak memproses antrian", null, { status: 403 });
      }
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

    const { sendWhatsAppMessageWithDetail } = await import("@/lib/whatsapp");
    let successCount = 0;
    let failCount = 0;

    for (const item of pendingQueue as WhatsappQueueItem[]) {
      try {
        const sendResult = await sendWhatsAppMessageWithDetail(item.no_whatsapp, item.message);

        if (sendResult.success) {
          await supabase.from("whatsapp_queue").update({
            status: "sent",
            updated_at: new Date().toISOString(),
            error_message: null,
          }).eq("id", item.id);
          successCount++;
        } else {
          await supabase.from("whatsapp_queue").update({
            status: "failed",
            error_message: sendResult.reason || "Gagal mengirim melalui Gateway Baileys",
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
