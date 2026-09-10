import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/url";
import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);

  const isJsonRequest = 
    request.headers.get("accept")?.includes("application/json") ||
    request.headers.get("content-type")?.includes("application/json") ||
    new URL(request.url).searchParams.get("json") === "true";

  // Rate limiting: 10 login attempts per 15 minutes per IP
  const clientIp = getClientIp(request);
  const rl = rateLimit(`login:${clientIp}`, 10, 15 * 60 * 1000);
  if (!rl.success) {
    const waitMin = Math.max(1, Math.ceil(rl.resetIn / 60000));
    const rateLimitMsg = `Terlalu banyak percobaan login. Coba lagi dalam ${waitMin} menit.`;
    if (isJsonRequest) {
      return NextResponse.json({ error: rateLimitMsg }, { status: 429 });
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(rateLimitMsg)}`,
      { status: 303 }
    );
  }

  let email = "";
  let password = "";

  if (request.headers.get("content-type")?.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "");
  } else {
    const formData = await request.formData();
    email = String(formData.get("email") || "").trim().toLowerCase();
    password = String(formData.get("password") || "");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      const targetUrl = `${origin}/register?verify=true&email=${encodeURIComponent(email)}`;
      if (isJsonRequest) {
        return NextResponse.json({ redirect: targetUrl, unconfirmed: true });
      }
      return NextResponse.redirect(targetUrl, { status: 303 });
    }

    // Always show generic error message to prevent email enumeration
    const errorMessage = "Email atau kata sandi yang Anda masukkan salah.";
    if (isJsonRequest) {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
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
      const targetUrl = `${origin}/register?verify=true&email=${encodeURIComponent(email)}`;
      if (isJsonRequest) {
        return NextResponse.json({ redirect: targetUrl, unconfirmed: true });
      }
      return NextResponse.redirect(targetUrl, { status: 303 });
    }

    await supabase.from("profiles").update({ is_active: true }).eq("id", user.id);
    await supabase.from("activity_logs").insert([{
      user_id: user.id,
      action: "Login",
      details: "User logged in successfully"
    }]);
  }

  if (isJsonRequest) {
    return NextResponse.json({ success: true, redirect: `${origin}/beranda` });
  }

  return NextResponse.redirect(`${origin}/beranda`, {
    status: 303,
  });
}
