export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSignedAdminSession } from "@/lib/admin-auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rl = rateLimit(`admin-unlock:${clientIp}`, 5, 15 * 60 * 1000);
    if (!rl.success) {
      return NextResponse.json(
        { status: "error", message: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_MASTER_PASSWORD;

    if (!adminPassword) {
      console.error("ADMIN_MASTER_PASSWORD is not configured in environment variables.");
      return NextResponse.json(
        { status: "error", message: "Konfigurasi keamanan server belum lengkap." },
        { status: 500 }
      );
    }

    if (password && password === adminPassword) {
      // Set cryptographic HMAC-signed session token
      const signedToken = await createSignedAdminSession();
      const cookieStore = await cookies();
      cookieStore.set("expedient_admin_session", signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 4, // 4 jam
      });

      return NextResponse.json({ status: "success", message: "Akses Admin diberikan." });
    }

    return NextResponse.json(
      { status: "error", message: "Sandi Akses tidak valid." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
