import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Masukkan alamat email Anda terlebih dahulu." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Look up user by email in auth
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const user = users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json(
        { error: "Email ini belum terdaftar. Silakan lakukan inisiasi / registrasi terlebih dahulu." },
        { status: 404 }
      );
    }

    // Directly confirm email in Supabase Auth (solves expired token / prefetch burn issue permanently)
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Set profile is_active to true
    await adminSupabase.from("profiles").update({ is_active: true }).eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: "Akun Anda berhasil disahkan dan diaktifkan! Silakan masukkan kata sandi Anda dan klik Masuk.",
    });
  } catch (err: any) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kendala pada server." },
      { status: 500 }
    );
  }
}
