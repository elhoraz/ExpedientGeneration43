export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type BroadcastTarget = {
  id: string;
  no_whatsapp: string;
  nama_panggilan: string | null;
  nama_lengkap: string | null;
};

const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit
) => NextResponse.json({ status, message, data }, init);

const getErrorMessage = (err: unknown) =>
  err instanceof Error ? err.message : "Terjadi kesalahan server.";

const normalizeNumber = (number: string) => {
  let num = number.replace(/\D/g, "");
  if (num.startsWith("0")) {
    num = "62" + num.substring(1);
  } else if (!num.startsWith("62")) {
    num = "62" + num;
  }
  return num;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse("error", "Unauthorized", null, { status: 401 });
    }

    const cookieStore = await cookies();
    if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
      return jsonResponse("error", "Forbidden: Admin panel is locked", null, { status: 403 });
    }

    const { targetRole, message } = await req.json();

    if (!message) {
      return jsonResponse("error", "Message is required", null, { status: 400 });
    }

    let query = supabase
      .from("profiles")
      .select("id, no_whatsapp, nama_panggilan, nama_lengkap")
      .not("no_whatsapp", "is", null)
      .neq("no_whatsapp", "");

    if (targetRole !== "all") {
      query = query.eq("role", targetRole);
    }

    const { data: targets, error } = await query;

    if (error) throw error;

    if (!targets || targets.length === 0) {
      return jsonResponse("error", "No valid targets found", null, { status: 404 });
    }

    const details: Array<{ name: string; number: string; status: "queued" }> = [];
    const queueData = (targets as BroadcastTarget[]).map((target) => {
      const normalizedNumber = normalizeNumber(target.no_whatsapp);
      const name = target.nama_panggilan || target.nama_lengkap || "Anggota";
      const personalizedMessage = String(message).replace(/\{nama\}/g, name);

      details.push({ name, number: normalizedNumber, status: "queued" });

      return {
        no_whatsapp: normalizedNumber,
        message: personalizedMessage,
        status: "pending",
      };
    });

    const { error: insertError } = await supabase.from("whatsapp_queue").insert(queueData);
    if (insertError) throw insertError;

    return jsonResponse("success", "Pesan berhasil dimasukkan ke antrean WhatsApp.", {
      sent: 0,
      queued: queueData.length,
      failed: 0,
      details,
    });
  } catch (err: unknown) {
    console.error("Broadcast error:", err);
    return jsonResponse("error", getErrorMessage(err), null, { status: 500 });
  }
}
