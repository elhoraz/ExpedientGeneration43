export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
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
      // Set cookie untuk menandai bahwa admin sudah unlock
      const cookieStore = await cookies();
      cookieStore.set("expedient_admin_session", "unlocked", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15, // 15 menit
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
