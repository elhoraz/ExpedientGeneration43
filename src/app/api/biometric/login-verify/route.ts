import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const expectedChallenge = cookieStore.get('webauthn_challenge')?.value;

    if (!expectedChallenge) {
      return NextResponse.json({ error: "No challenge found" }, { status: 400 });
    }

    const body = await req.json();

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    // Find the credential
    const { data: biometrics } = await supabaseAdmin
      .from("user_biometrics")
      .select("*")
      .eq("credential_id", body.id)
      .maybeSingle();

    if (!biometrics) {
      return NextResponse.json({ error: "Kredensial biometrik tidak ditemukan di sistem." }, { status: 404 });
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

    let publicKeyBuffer: Uint8Array;
    try {
      publicKeyBuffer = Buffer.from(biometrics.public_key, 'base64url');
      if (publicKeyBuffer.length === 0) {
        publicKeyBuffer = Buffer.from(biometrics.public_key, 'base64');
      }
    } catch {
      publicKeyBuffer = Buffer.from(biometrics.public_key);
    }

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: allowedOrigins,
      expectedRPID: allowedRPIDs,
      credential: {
        id: biometrics.credential_id,
        publicKey: publicKeyBuffer as any,
        counter: Number(biometrics.counter ?? biometrics.sign_count ?? 0),
        transports: biometrics.transports || undefined,
      },
      requireUserVerification: false,
    });

    if (verification.verified && verification.authenticationInfo) {
      const { newCounter } = verification.authenticationInfo;

      // Update counter safely
      const updateData: Record<string, any> = {};
      if ('counter' in biometrics) updateData.counter = newCounter;
      if ('sign_count' in biometrics) updateData.sign_count = newCounter;
      if (Object.keys(updateData).length === 0) updateData.counter = newCounter;

      const { error: updateErr } = await supabaseAdmin.from("user_biometrics").update(updateData).eq("id", biometrics.id);
      if (updateErr && updateData.counter) {
        await supabaseAdmin.from("user_biometrics").update({ sign_count: newCounter }).eq("id", biometrics.id);
      }

      // Issue Supabase Session using server-side OTP verification
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(biometrics.user_id);
      const userEmail = userData?.user?.email;

      if (userError || !userEmail) throw new Error("Email tidak ditemukan untuk kredensial ini");

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userEmail
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        throw new Error("Gagal membuat token autentikasi sesi");
      }

      // Verify OTP on user-facing SSR Supabase client to establish cookie session
      const userSupabase = await createClient();
      const { error: verifyOtpError } = await userSupabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: 'magiclink'
      });

      if (verifyOtpError) {
        throw new Error("Gagal mengesahkan sesi login: " + verifyOtpError.message);
      }

      // Update user profile status & activity log
      await supabaseAdmin.from("profiles").update({ is_active: true }).eq("id", biometrics.user_id);
      await supabaseAdmin.from("activity_logs").insert([{
        user_id: biometrics.user_id,
        action: "Login Biometrik",
        details: "Pengguna berhasil masuk dengan autentikasi biometrik."
      }]);

      const response = NextResponse.json({
        verified: true,
        redirect_url: "/beranda"
      });
      response.cookies.delete('webauthn_challenge');
      
      return response;
    } else {
      return NextResponse.json({ verified: false, error: "Verifikasi biometrik tidak valid." }, { status: 400 });
    }

  } catch (err: any) {
    console.error("Verify Authentication Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
