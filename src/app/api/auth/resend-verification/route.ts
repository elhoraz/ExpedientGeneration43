import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getRequestOrigin } from "@/lib/url";

export async function POST(request: Request) {
  try {
    const origin = getRequestOrigin(request);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const mode = body.mode || "resend_email"; // "resend_email" or "direct_activate"

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
        { error: "Email ini belum terdaftar. Silakan lakukan registrasi / inisiasi terlebih dahulu." },
        { status: 404 }
      );
    }

    // If user is already confirmed, activate profile and notify
    if (user.email_confirmed_at) {
      await adminSupabase.from("profiles").update({ is_active: true }).eq("id", user.id);
      return NextResponse.json({
        success: true,
        mode: "already_confirmed",
        message: "Akun Anda sudah terverifikasi & aktif! Silakan langsung masukkan kata sandi dan klik Masuk.",
      });
    }

    // Direct Instant Activation Mode
    if (mode === "direct_activate") {
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      await adminSupabase.from("profiles").update({ is_active: true }).eq("id", user.id);

      return NextResponse.json({
        success: true,
        mode: "direct_activate",
        message: "Akun Anda berhasil disahkan dan aktif! Silakan masukkan kata sandi Anda dan klik Masuk.",
      });
    }

    // Resend Email Mode (Sends a new, fresh confirmation email to user inbox)
    const { error: resendError } = await adminSupabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (resendError) {
      if (resendError.message.includes("security purposes") || resendError.message.includes("rate limit") || resendError.message.includes("once every")) {
        return NextResponse.json(
          { error: "Email verifikasi baru saja dikirim. Mohon tunggu 60 detik sebelum meminta pengiriman ulang berikutnya." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: resendError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mode: "resend_email",
      message: "Tautan verifikasi baru berhasil dikirimkan ke email Anda! Silakan periksa kotak masuk atau folder spam.",
    });
  } catch (err: any) {
    console.error("Resend verification error:", err);
    return NextResponse.json(
      { error: err.message || "Terjadi kendala pada server." },
      { status: 500 }
    );
  }
}
