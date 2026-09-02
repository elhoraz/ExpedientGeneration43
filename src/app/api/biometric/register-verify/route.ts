import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Authorization check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const cookieStore = await cookies();
    const cookieChallenge = cookieStore.get("webauthn_reg_challenge")?.value;

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_challenge")
      .eq("id", user.id)
      .maybeSingle();

    const expectedChallenge = profile?.current_challenge || cookieChallenge;

    if (!expectedChallenge) {
      return NextResponse.json({ error: "No active challenge found" }, { status: 400 });
    }

    const originHeader = req.headers.get("origin") || req.headers.get("referer");
    const origin = originHeader
      ? new URL(originHeader).origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const hostname = hostHeader.split(":")[0];
    const rpID = hostname || new URL(origin).hostname;

    const allowedOrigins = Array.from(new Set([
      origin,
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : [])
    ].filter(Boolean)));

    const allowedRPIDs = Array.from(new Set([
      rpID,
      "localhost",
      "127.0.0.1",
      ...(process.env.NEXT_PUBLIC_SITE_URL ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname] : [])
    ].filter(Boolean)));

    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: allowedOrigins,
      expectedRPID: allowedRPIDs,
      requireUserVerification: false,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Save credential to DB (check existing credential first to avoid ON CONFLICT constraint error)
      const { data: existingCred } = await supabaseAdmin
        .from("user_biometrics")
        .select("id")
        .eq("credential_id", credential.id)
        .maybeSingle();

      const primaryPayload: Record<string, any> = {
        user_id: user.id,
        credential_id: credential.id,
        public_key: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        sign_count: credential.counter,
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
        transports: body.response?.transports || []
      };

      const fallbackPayload: Record<string, any> = {
        user_id: user.id,
        credential_id: credential.id,
        public_key: Buffer.from(credential.publicKey).toString("base64url"),
        sign_count: credential.counter
      };

      if (existingCred) {
        const { error: updateErr } = await supabaseAdmin
          .from("user_biometrics")
          .update(primaryPayload)
          .eq("id", existingCred.id);

        if (updateErr) {
          const { error: fallbackUpdateErr } = await supabaseAdmin
            .from("user_biometrics")
            .update(fallbackPayload)
            .eq("id", existingCred.id);

          if (fallbackUpdateErr) {
            throw new Error("Gagal memperbarui kredensial biometrik: " + fallbackUpdateErr.message);
          }
        }
      } else {
        const { error: insertErr } = await supabaseAdmin
          .from("user_biometrics")
          .insert(primaryPayload);

        if (insertErr) {
          const { error: fallbackInsertErr } = await supabaseAdmin
            .from("user_biometrics")
            .insert(fallbackPayload);

          if (fallbackInsertErr) {
            throw new Error("Gagal menyimpan kredensial biometrik: " + fallbackInsertErr.message);
          }
        }
      }

      // Clear the challenge
      await supabaseAdmin.from("profiles").update({ current_challenge: null }).eq("id", user.id);

      const response = NextResponse.json({ verified: true });
      response.cookies.delete("webauthn_reg_challenge");
      return response;
    } else {
      return NextResponse.json({ verified: false, error: "Verifikasi biometrik tidak valid." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("Verify Registration Error:", err);
    return NextResponse.json({ error: err.message || "Gagal verifikasi registrasi biometrik" }, { status: 500 });
  }
}
