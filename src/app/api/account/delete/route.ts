export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Anda harus login untuk menghapus akun." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const confirmationText = String(body.confirmation || "").trim().toUpperCase();

    if (confirmationText !== "HAPUS") {
      return NextResponse.json(
        { error: "Konfirmasi tidak valid. Harap ketik 'HAPUS' untuk menyetujui penghapusan akun." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const userId = user.id;

    // 1. Delete user-owned records
    try {
      await adminSupabase.from("user_biometrics").delete().eq("user_id", userId);
      await adminSupabase.from("wasiat_vault").delete().eq("user_id", userId);
      await adminSupabase.from("syndicate").delete().eq("user_id", userId);
      await adminSupabase.from("activity_logs").delete().eq("user_id", userId);
      await adminSupabase.from("notifications").delete().eq("user_id", userId);
      await adminSupabase.from("user_blocks").delete().or(`blocker_id.eq.${userId},blocked_user_id.eq.${userId}`);
      await adminSupabase.from("profiles").delete().eq("id", userId);
    } catch (dbErr) {
      console.warn("Error deleting sub-records for user:", dbErr);
    }

    // 2. Delete auth user from Supabase GoTrue Auth
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error("Supabase auth deleteUser error:", authDeleteError);
      return NextResponse.json(
        { error: "Gagal menghapus akun dari sistem autentikasi: " + authDeleteError.message },
        { status: 500 }
      );
    }

    // 3. Clear auth cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (c.name.includes("sb-") || c.name.includes("expedient_")) {
        cookieStore.delete(c.name);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Akun dan seluruh data pribadi Anda telah berhasil dihapus secara permanen.",
    });

  } catch (err: unknown) {
    console.error("Account deletion fatal error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses penghapusan akun." },
      { status: 500 }
    );
  }
}
