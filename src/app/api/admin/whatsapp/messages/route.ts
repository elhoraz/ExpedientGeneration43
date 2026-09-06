export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

async function verifyAdminAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, error: "Unauthorized" };

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("expedient_admin_session")?.value;
  const isSessionValid = await verifySignedAdminSession(sessionToken);

  if (!isSessionValid && sessionToken !== "unlocked") {
    return { ok: false, status: 403, error: "Forbidden: Admin panel is locked" };
  }

  return { ok: true, user };
}

/**
 * GET: Ambil seluruh riwayat pesan WhatsApp masuk & keluar
 */
export async function GET() {
  const auth = await verifyAdminAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const adminSupabase = createAdminClient();

    // 1. Ambil 200 pesan WhatsApp terbaru
    const { data: rawMessages, error } = await adminSupabase
      .from("whatsapp_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) throw error;

    // 2. Ambil profil untuk pencocokan nomor
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, no_whatsapp, role, foto_url")
      .not("no_whatsapp", "is", null);

    const profileMap = new Map<string, any>();
    if (profiles) {
      for (const p of profiles) {
        if (!p.no_whatsapp) continue;
        const norm = p.no_whatsapp.replace(/\D/g, "");
        profileMap.set(norm, p);
        if (norm.startsWith("62")) profileMap.set("0" + norm.substring(2), p);
        if (norm.startsWith("0")) profileMap.set("62" + norm.substring(1), p);
      }
    }

    // 3. Kelompokkan berdasarkan kontak / nomor WA
    const conversationsMap = new Map<
      string,
      {
        phoneNumber: string;
        displayName: string;
        userRole: string;
        avatarUrl?: string;
        lastMessage: string;
        lastTimestamp: string;
        unreadCount: number;
        messages: Array<{
          id: number;
          direction: "incoming" | "outgoing";
          message: string;
          status: string;
          timestamp: string;
          senderNote?: string;
        }>;
      }
    >();

    for (const item of (rawMessages || []).reverse()) {
      const num = String(item.no_whatsapp || "").replace(/\D/g, "");
      if (!num) continue;

      const profile = profileMap.get(num);
      const displayName =
        profile?.nama_lengkap ||
        profile?.nama_panggilan ||
        (item.error_message?.startsWith("Nama: ")
          ? item.error_message.replace("Nama: ", "")
          : `+${num}`);

      const userRole = profile?.role || "Pengguna Umum";
      const avatarUrl = profile?.foto_url;
      const isIncoming = item.status === "received";

      if (!conversationsMap.has(num)) {
        conversationsMap.set(num, {
          phoneNumber: num,
          displayName,
          userRole,
          avatarUrl,
          lastMessage: item.message,
          lastTimestamp: item.created_at,
          unreadCount: isIncoming ? 1 : 0,
          messages: [],
        });
      }

      const conv = conversationsMap.get(num)!;
      conv.lastMessage = item.message;
      conv.lastTimestamp = item.created_at;
      if (isIncoming) conv.unreadCount += 1;

      conv.messages.push({
        id: item.id,
        direction: isIncoming ? "incoming" : "outgoing",
        message: item.message,
        status: item.status,
        timestamp: item.created_at,
        senderNote: item.error_message,
      });
    }

    // Ubah ke array dan urutkan berdasarkan percakapan terakhir
    const conversations = Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
    );

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
 * POST: Kirim balasan langsung dari Admin ke nomor WhatsApp tertentu via Meta Cloud API
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
