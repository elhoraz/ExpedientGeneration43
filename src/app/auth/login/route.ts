import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/url";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  const formData = await request.formData();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let errorMessage = "Kredensial tidak valid atau akun belum diverifikasi.";
    let isUnconfirmed = false;
    if (error.message.includes("Email not confirmed")) {
      errorMessage = "Email Anda belum diverifikasi atau tautan telah kedaluwarsa. Silakan kirim lagi verifikasinya di bawah.";
      isUnconfirmed = true;
    } else if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Email atau kata sandi salah.";
    } else {
      errorMessage = error.message;
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}&email=${encodeURIComponent(email)}${isUnconfirmed ? "&unconfirmed=true&expired=true" : ""}`,
      { status: 303 }
    );
  }

  // Log activity and ensure is_active is true (since login succeeded, email must be confirmed)
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ is_active: true }).eq("id", user.id);
    await supabase.from("activity_logs").insert([{
      user_id: user.id,
      action: "Login",
      details: "User logged in successfully"
    }]);
  }

  return NextResponse.redirect(`${origin}/beranda`, {
    status: 303,
  });
}
