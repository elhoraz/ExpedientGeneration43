import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lat, lng } = await req.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ lat, lng })
      .eq("id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Lokasi berhasil diperbarui." });
  } catch (err: any) {
    console.error("Location update error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
