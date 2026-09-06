export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { getWhatsAppConversations } from "@/lib/whatsapp-inbox";

async function verifyAdminAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized: Harap login terlebih dahulu" };
  }

  return { ok: true, user };
}

/**
 * GET: Ambil seluruh riwayat percakapan WhatsApp
 */
export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const conversations = await getWhatsAppConversations();

    return NextResponse.json({
      status: "success",
      conversations,
      totalContacts: conversations.length,
    });
  } catch (err: any) {
    console.error("[GET-WA-INBOX-ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memuat pesan WhatsApp." },
      { status: 500 }
    );
  }
}

/**
 * POST: Kirim balasan langsung dari Admin ke WhatsApp nomor tertentu via Meta Cloud API
 */
export async function POST(req: Request) {
  const auth = await verifyAdminAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: "Nomor tujuan ('to') dan isi pesan ('message') wajib diisi." },
        { status: 400 }
      );
    }

    const cleanNum = String(to).replace(/\D/g, "");
    let targetNum = cleanNum;
    if (targetNum.startsWith("0")) targetNum = "62" + targetNum.substring(1);
    else if (!targetNum.startsWith("62")) targetNum = "62" + targetNum;

    // Kirim langsung melalui Meta WhatsApp Cloud API resmi
    const sent = await sendWhatsAppMessage(targetNum, message);

    if (!sent) {
      return NextResponse.json(
        { error: "Gagal mengirim pesan melalui Meta WhatsApp Cloud API." },
        { status: 502 }
      );
    }

    // Catat pesan keluar ke database
    const adminSupabase = createAdminClient();
    const { data: inserted, error: insertError } = await adminSupabase
      .from("whatsapp_queue")
      .insert([
        {
          no_whatsapp: targetNum,
          message: message,
          status: "sent",
          error_message: "Admin Reply via Meta Cloud API",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.warn("[LOG-OUTGOING-ERROR]:", insertError);
    }

    return NextResponse.json({
      status: "success",
      message: "Pesan balasan berhasil terkirim ke WhatsApp pengguna.",
      data: inserted,
    });
  } catch (err: any) {
    console.error("[POST-WA-REPLY-ERROR]:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses pengiriman balasan." },
      { status: 500 }
    );
  }
}
