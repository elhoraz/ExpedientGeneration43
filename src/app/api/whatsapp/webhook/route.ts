import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "expedient_meta_token_2026";

/**
 * GET Handler: Verifikasi Webhook dari Meta Developer Portal
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[META WEBHOOK] Verified successfully!");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/**
 * POST Handler: Menerima status pesan atau pesan masuk dari pengguna WhatsApp
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[META WEBHOOK INCOMING]:", JSON.stringify(body, null, 2));

    const adminSupabase = createAdminClient();

    // Pastikan payload berasal dari WhatsApp Business Account
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value && value.messages && value.messages.length > 0) {
      const contact = value.contacts?.[0];
      const metaSenderName = contact?.profile?.name || "";

      for (const msg of value.messages) {
        const fromRaw = String(msg.from || "").trim();
        let messageText = "";

        if (msg.type === "text") {
          messageText = msg.text?.body || "";
        } else if (msg.type === "interactive") {
          messageText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "[Respon Interaktif]";
        } else if (msg.type === "button") {
          messageText = msg.button?.text || "[Pilihan Tombol]";
        } else if (msg.type === "image") {
          messageText = msg.image?.caption || "[Gambar Terkirim]";
        } else if (msg.type === "audio") {
          messageText = "[Pesan Suara / Voice Note]";
        } else if (msg.type === "document") {
          messageText = msg.document?.filename || "[Dokumen Terkirim]";
        } else {
          messageText = `[Pesan ${msg.type || "Media"}]`;
        }

        if (!fromRaw || !messageText) continue;

        // Normalisasi nomor untuk pencarian profil (format 628... dan 08...)
        let numNorm = fromRaw.replace(/\D/g, "");
        if (numNorm.startsWith("0")) numNorm = "62" + numNorm.substring(1);
        const altLocalNum = numNorm.startsWith("62") ? "0" + numNorm.substring(2) : numNorm;

        // Cari profil alumni yang terdaftar
        const { data: matchedProfiles } = await adminSupabase
          .from("profiles")
          .select("id, nama_lengkap, nama_panggilan, role")
          .or(`no_whatsapp.eq.${numNorm},no_whatsapp.eq.${altLocalNum}`)
          .limit(1);

        const matchedUser = matchedProfiles?.[0];
        const displayName = matchedUser
          ? `${matchedUser.nama_panggilan || matchedUser.nama_lengkap} (${matchedUser.role || "Alumni"})`
          : metaSenderName || `Pengguna WhatsApp`;

        // 1. Simpan pesan masuk ke tabel antrean WhatsApp
        await adminSupabase.from("whatsapp_queue").insert([
          {
            no_whatsapp: numNorm,
            message: messageText,
            status: "received",
            error_message: displayName ? `Nama: ${displayName}` : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        console.log(`[META-WA-INBOX] Pesan dari ${numNorm} (${displayName}): "${messageText}" disimpan.`);

        // 2. Beri notifikasi ke Admin
        try {
          const { data: adminProfiles } = await adminSupabase
            .from("profiles")
            .select("id")
            .in("role", ["admin", "superadmin"]);

          if (adminProfiles && adminProfiles.length > 0) {
            const notifRecords = adminProfiles.map((adm) => ({
              user_id: adm.id,
              title: `💬 WA Masuk: ${displayName}`,
              message: messageText.length > 80 ? messageText.substring(0, 77) + "..." : messageText,
              link: "/admin/inbox",
              is_read: false,
              created_at: new Date().toISOString(),
            }));
            await adminSupabase.from("notifications").insert(notifRecords);
          }
        } catch (notifErr) {
          console.warn("[META-WA-NOTIF-ERROR]: Gagal membuat notifikasi admin:", notifErr);
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" });
  } catch (error) {
    console.error("[META WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
