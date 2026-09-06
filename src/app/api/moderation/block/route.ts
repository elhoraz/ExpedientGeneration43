export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Harap login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { target_user_id, action = "block" } = body;

    if (!target_user_id) {
      return NextResponse.json(
        { error: "Target pengguna wajib ditentukan." },
        { status: 400 }
      );
    }

    if (target_user_id === user.id) {
      return NextResponse.json(
        { error: "Anda tidak dapat memblokir akun Anda sendiri." },
        { status: 400 }
      );
    }

    if (action === "block") {
      const { error } = await supabase
        .from("user_blocks")
        .upsert(
          [
            {
              blocker_id: user.id,
              blocked_user_id: target_user_id,
            },
          ],
          { onConflict: "blocker_id,blocked_user_id" }
        );

      if (error) {
        console.error("Block user error:", error);
        return NextResponse.json(
          { error: "Gagal memblokir pengguna: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        isBlocked: true,
        message: "Pengguna berhasil diblokir. Pesan dan aktivitas mereka tidak akan ditampilkan lagi.",
      });
    } else if (action === "unblock") {
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_user_id", target_user_id);

      if (error) {
        console.error("Unblock user error:", error);
        return NextResponse.json(
          { error: "Gagal membuka blokir pengguna: " + error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        isBlocked: false,
        message: "Blokir pengguna berhasil dicabut.",
      });
    }

    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });

  } catch (err: any) {
    console.error("Block API error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses permintaan." },
      { status: 500 }
    );
  }
}
