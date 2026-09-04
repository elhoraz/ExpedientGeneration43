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
    if (error.message.includes("Email not confirmed")) {
      return NextResponse.redirect(
        `${origin}/register?verify=true&email=${encodeURIComponent(email)}`,
        { status: 303 }
      );
    }

    let errorMessage = "Email atau kata sandi yang Anda masukkan salah.";
    if (error.message.includes("Invalid login credentials")) {
      errorMessage = "Email atau kata sandi yang Anda masukkan salah.";
    } else {
      errorMessage = error.message;
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorMessage)}&email=${encodeURIComponent(email)}`,
      { status: 303 }
    );
  }

  // Ensure user is confirmed and profile is active
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", user.id).single();
    if (profile && profile.is_active === false && !user.email_confirmed_at) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/register?verify=true&email=${encodeURIComponent(email)}`,
        { status: 303 }
      );
    }

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
