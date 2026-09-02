export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type QueueRow = {
  status: string | null;
  no_whatsapp: string | null;
  message: string | null;
  error_message: string | null;
  updated_at: string | null;
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

    const { data: queue, error } = await supabase
      .from("whatsapp_queue")
      .select("status, no_whatsapp, message, error_message, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const stats = { total: 0, sent: 0, pending: 0, failed: 0 };
    const rows = (queue || []) as QueueRow[];

    const recent_logs = rows.slice(0, 50).map((q) => ({
      status: q.status,
      to_number: q.no_whatsapp,
      to_name: "",
      message: q.message,
      error_message: q.error_message,
      sent_at: q.updated_at,
      attempts: q.status === "failed" ? 1 : 0,
      max_attempts: 1,
    }));

    rows.forEach((q) => {
      stats.total++;
      if (q.status === "sent") stats.sent++;
      else if (q.status === "failed") stats.failed++;
      else stats.pending++;
    });

    return jsonResponse("success", "Statistik antrean WhatsApp berhasil diambil.", {
      stats,
      recent_logs,
    });
  } catch (err: unknown) {
    return jsonResponse("error", getErrorMessage(err), null, { status: 500 });
  }
}
