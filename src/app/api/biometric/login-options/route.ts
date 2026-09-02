export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Masukkan alamat email Anda terlebih dahulu untuk verifikasi biometrik." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Cari user di auth.users berdasarkan email
    const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (userError) {
      throw new Error("Gagal mengambil data user: " + userError.message);
    }

    const targetUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: "Email belum terdaftar di direktori alumni. Silakan lakukan registrasi terlebih dahulu." },
        { status: 404 }
      );
    }

    // 2. Ambil credential biometrik pengguna yang sudah terdaftar
    const { data: biometrics, error: bioError } = await supabaseAdmin
      .from("user_biometrics")
      .select("*")
      .eq("user_id", targetUser.id);

    if (bioError) {
      throw new Error("Gagal memeriksa data biometrik: " + bioError.message);
    }

    if (!biometrics || biometrics.length === 0) {
      return NextResponse.json(
        { 
          error: "Akun ini belum mendaftarkan perangkat biometrik (Passkey / FaceID / Sidik Jari). Silakan masuk dengan kata sandi terlebih dahulu, lalu daftarkan biometrik Anda di menu Profil." 
        },
        { status: 400 }
      );
    }

    // 3. Resolusi RP ID dinamis dari Host header / Request URL
    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const hostname = hostHeader.split(":")[0];
    const rpID = hostname || new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").hostname;

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials: biometrics.map((b: any) => ({
        id: b.credential_id,
        type: "public-key" as const,
        transports: b.transports || undefined,
      })),
    });

    const response = NextResponse.json(options);
    response.cookies.set("webauthn_challenge", options.challenge, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300, // 5 minutes
    });

    return response;
  } catch (err: any) {
    console.error("Generate Auth Options error:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses opsi biometrik" }, { status: 500 });
  }
}
