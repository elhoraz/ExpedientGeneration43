import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    // Authorization check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("nama_panggilan, nama_lengkap")
      .eq("id", user.id)
      .maybeSingle();

    // Fetch existing credentials to exclude
    const { data: existingBiometrics } = await supabase
      .from("user_biometrics")
      .select("credential_id")
      .eq("user_id", user.id);

    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const hostname = hostHeader.split(":")[0];
    const rpID = hostname || new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").hostname;

    const userEmail = user.email || "user@expedient.app";
    const displayName = profile?.nama_panggilan || profile?.nama_lengkap || user.user_metadata?.nama_panggilan || userEmail;

    const options = await generateRegistrationOptions({
      rpName: "Expedient Generation",
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: userEmail,
      userDisplayName: displayName,
      attestationType: "none",
      excludeCredentials: existingBiometrics?.map(b => ({
        id: b.credential_id,
        type: "public-key" as const,
      })) || [],
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform",
      },
    });

    // Store challenge in profiles using service role client
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabaseAdmin.from("profiles").update({ current_challenge: options.challenge }).eq("id", user.id);

    const response = NextResponse.json(options);
    response.cookies.set("webauthn_reg_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300, // 5 minutes
    });

    return response;

  } catch (err: any) {
    console.error("Generate Registration Options error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses opsi registrasi" }, { status: 500 });
  }
}
