export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Harap login untuk melaporkan konten." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { reported_user_id, content_type = "user_profile", content_id, reason, details } = body;

    if (!reported_user_id || !reason) {
      return NextResponse.json(
        { error: "Target pengguna dan alasan pelaporan wajib diisi." },
        { status: 400 }
      );
    }

    if (reported_user_id === user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat melaporkan akun Anda sendiri." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_reports")
      .insert([
        {
          reporter_id: user.id,
          reported_user_id,
          content_type,
          content_id: content_id || null,
          reason,
          details: details || "",
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating user report:", error);
      return NextResponse.json(
        { error: "Gagal mengirim laporan: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Terima kasih. Laporan Anda telah diterima dan akan segera ditinjau oleh tim moderator Expedient 43.",
      report: data,
    });

  } catch (err: any) {
    console.error("Report API error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses laporan." },
      { status: 500 }
    );
  }
}
