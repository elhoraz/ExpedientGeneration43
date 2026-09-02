export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("expedient_admin_session");
    
    return NextResponse.json({ status: "success", message: "Sesi Admin terkunci." });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Gagal mengunci sesi." },
      { status: 500 }
    );
  }
}
