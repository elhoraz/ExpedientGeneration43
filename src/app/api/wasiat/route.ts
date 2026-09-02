import { createClient } from "@/lib/supabase/server";
import { addPrestise } from "@/lib/gamification";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * POST /api/wasiat
 * Body: { wasiat_id: string, passphrase_hash: string }
 * Called client-side after successful local AES-GCM decryption.
 * Verifies the SHA-256 hash matches the bcrypt hash stored in DB, then awards Prestise.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ status: "error", msg: "Unauthorized" }, { status: 401 });
    }

    const { wasiat_id, passphrase_hash } = await req.json();

    if (!wasiat_id || !passphrase_hash) {
      return NextResponse.json({ status: "error", msg: "Missing params" }, { status: 400 });
    }

    // Fetch the stored passphrase_hash
    const { data: wasiat, error } = await supabase
      .from("wasiats")
      .select("passphrase_hash")
      .eq("id", wasiat_id)
      .single();

    if (error || !wasiat) {
      return NextResponse.json({ status: "error", msg: "Wasiat not found" }, { status: 404 });
    }

    // The CI4 version stores bcrypt(SHA256(passphrase))
    // In Next.js we store the raw SHA-256 hex directly as the passphrase_hash
    // so we compare directly (no bcrypt needed on the server)
    if (wasiat.passphrase_hash !== passphrase_hash) {
      return NextResponse.json({ status: "error", msg: "Unauthorized" }, { status: 403 });
    }

    // Award Prestise: WASIAT_UNLOCK (20 pts) — one per wasiat per user
    await addPrestise(supabase as any, user.id, `WASIAT_UNLOCK_${wasiat_id}`, 20);

    return NextResponse.json({ status: "success" });
  } catch (err: any) {
    return NextResponse.json({ status: "error", msg: err.message }, { status: 500 });
  }
}
