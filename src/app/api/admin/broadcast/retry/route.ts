export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit
) => NextResponse.json({ status, message, data }, init);

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Terjadi kesalahan server.";

export async function POST() {
  try {
    const cookieStore = await cookies();
    if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
      return jsonResponse("error", "Forbidden: Admin panel is locked", null, { status: 403 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("whatsapp_queue")
      .update({ status: "pending", error_message: null })
      .eq("status", "failed");

    if (error) throw error;

    return jsonResponse("success", "Semua pesan gagal telah direset menjadi pending.");
  } catch (err: unknown) {
    return jsonResponse("error", getErrorMessage(err), null, { status: 500 });
  }
}
