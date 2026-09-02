import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { addPrestise } from "@/lib/gamification";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const actualPesan = (body.pesan || body.message || "").trim();
  let actualNama = (body.nama || "").trim();

  if (!actualPesan) {
    return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
  }

  // If signature name is empty, fetch user profile name
  if (!actualNama) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nama_panggilan, nama_lengkap")
      .eq("id", user.id)
      .maybeSingle();
    
    actualNama = profile?.nama_panggilan || profile?.nama_lengkap || user.user_metadata?.nama_panggilan || user.user_metadata?.nama_lengkap || "Hamba Allah";
  }

  // Insert into buku_tamu using correct columns: user_id, nama, pesan
  const { data, error } = await supabase
    .from("buku_tamu")
    .insert([{ user_id: user.id, nama: actualNama, pesan: actualPesan }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const inserted = data && data.length > 0 ? data[0] : { user_id: user.id, nama: actualNama, pesan: actualPesan, created_at: new Date().toISOString() };

  // Map database response to match both formats if necessary
  const result = {
    ...inserted,
    nama: inserted.nama || actualNama,
    message: inserted.pesan || actualPesan,
  };

  // Add Prestise Points (Guestbook Entry) - 1x lifetime limit
  await addPrestise(supabase as any, user.id, 'GUESTBOOK_ENTRY', 10);

  return NextResponse.json(result, { status: 200 });
}
