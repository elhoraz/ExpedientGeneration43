import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleAdminAutoRemediation } from "@/lib/sentinel/autoRemediator";

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
 * POST Handler: Menerima pesan masuk dari Fonnte / Meta WhatsApp Gateway
 * Mendukung Auto-Remediasi 24 Jam saat Admin membalas pesan peringatan (PERBAIKI / !fix / !status)
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const incomingList: Array<{
      sender: string;
      messageText: string;
      senderName?: string;
      device?: string;
    }> = [];

    // 1. Parsing JSON Payload (Fonnte atau Meta)
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));

      // A. Format Webhook Fonnte
      if (body.sender || body.message || body.text) {
        incomingList.push({
          sender: String(body.sender || ""),
          messageText: String(body.message || body.text || ""),
          senderName: String(body.name || ""),
          device: String(body.device || ""),
        });
      }
      // B. Format Webhook Resmi Meta Cloud API
      else if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
        const value = body.entry[0].changes[0].value;
        const contact = value.contacts?.[0];
        const metaSenderName = contact?.profile?.name || "";

        for (const msg of value.messages) {
          let text = "";
          if (msg.type === "text") {
            text = msg.text?.body || "";
          } else if (msg.type === "interactive") {
            text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "[Interaktif]";
          } else if (msg.type === "button") {
            text = msg.button?.text || "[Pilihan Tombol]";
          } else if (msg.type === "image") {
            text = msg.image?.caption || "[Gambar Terkirim]";
          } else {
            text = `[Pesan ${msg.type || "Media"}]`;
          }

          incomingList.push({
            sender: String(msg.from || ""),
            messageText: text,
            senderName: metaSenderName,
          });
        }
      }
    }
    // 2. Parsing Form-Data / URL-Encoded (Fonnte default POST)
    else if (contentType.includes("form-data") || contentType.includes("urlencoded")) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        incomingList.push({
          sender: String(formData.get("sender") || ""),
          messageText: String(formData.get("message") || formData.get("text") || ""),
          senderName: String(formData.get("name") || ""),
          device: String(formData.get("device") || ""),
        });
      }
    }

    const adminPhoneEnv = (process.env.ADMIN_WA_PHONE || "6282142877426").replace(/\D/g, "");
    const adminSupabase = createAdminClient();

    for (const item of incomingList) {
      const rawSender = item.sender.trim();
      const messageText = item.messageText.trim();
      if (!rawSender || !messageText) continue;

      let numNorm = rawSender.replace(/\D/g, "");
      if (numNorm.startsWith("0")) numNorm = "62" + numNorm.substring(1);

      // Cek apakah pesan berasal dari Nomor WhatsApp Admin
      const isSenderAdmin =
        numNorm === adminPhoneEnv ||
        numNorm.endsWith(adminPhoneEnv.slice(-9)) ||
        adminPhoneEnv.endsWith(numNorm.slice(-9));

      if (isSenderAdmin) {
        console.log(`[SENTINEL-ADMIN-INCOMING] Pesan dari Admin (${numNorm}): "${messageText}"`);

        // 1. Jalankan engine reflex perbaikan cepat (jika perintah keyword spesifik)
        const remediationResult = await handleAdminAutoRemediation(numNorm, messageText);
        if (remediationResult.action !== "not_a_sentinel_command") {
          console.log(`[SENTINEL-REMEDIATION-EXECUTED]: ${remediationResult.action} - ${remediationResult.success}`);
          return NextResponse.json({
            status: "REMEDIATION_EXECUTED",
            reply: remediationResult.message,
          });
        }

        // 2. Jika pesan percakapan bebas / permintaan fitur / pertanyaan santai:
        // Gunakan AI Conversational Agent (Gemini 3.8 Flash)
        const { handleAdminConversationalMessage } = await import("@/lib/sentinel/conversationalAgent");
        const convResult = await handleAdminConversationalMessage(numNorm, messageText);
        return NextResponse.json({
          status: "CONVERSATIONAL_AI_PROCESSED",
          success: convResult.success,
        });
      }

      // Jika pesan dari pengunjung biasa / alumni:
      // Berikan respons otomatis ramah 24 jam dengan akses database & Gemini 3.8 Flash!
      const altLocalNum = numNorm.startsWith("62") ? "0" + numNorm.substring(2) : numNorm;
      const { data: matchedProfiles } = await adminSupabase
        .from("profiles")
        .select("id, nama_lengkap, nama_panggilan, role, kelas, is_active")
        .or(`no_whatsapp.eq.${numNorm},no_whatsapp.eq.${altLocalNum}`)
        .limit(1);

      const matchedUser = matchedProfiles?.[0];
      const userDisplayName = matchedUser?.nama_panggilan || matchedUser?.nama_lengkap || item.senderName || "Sahabat";
      const senderTag = matchedUser
        ? `${userDisplayName} (${matchedUser.role || "Alumni"})`
        : item.senderName || `Pengguna WhatsApp`;

      console.log(`[WA-USER-INCOMING] Pesan dari ${numNorm} (${senderTag}): "${messageText}"`);

      // 1. Eksekusi AI Concierge Alumni (Gemini 3.8 Flash + Supabase Database Query)
      const { handleUserWhatsAppMessage } = await import("@/lib/whatsapp/alumniBot");
      const userAiRes = await handleUserWhatsAppMessage(numNorm, messageText, matchedUser);

      // 2. Simpan riwayat interaksi ke antrean database
      await adminSupabase.from("whatsapp_queue").insert([
        {
          no_whatsapp: numNorm,
          message: messageText,
          status: "replied",
          error_message: `Dibalas AI: "${userAiRes.replyText.slice(0, 150)}" (User: ${senderTag})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      // 3. Notifikasi Lonceng In-App untuk Admin Dashboard
      try {
        const { data: adminProfiles } = await adminSupabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "superadmin"]);

        if (adminProfiles && adminProfiles.length > 0) {
          const notifRecords = adminProfiles.map((adm) => ({
            user_id: adm.id,
            title: `💬 WA Alumni: ${userDisplayName}`,
            message: messageText.length > 80 ? messageText.substring(0, 77) + "..." : messageText,
            link: "/admin/broadcast",
            is_read: false,
            created_at: new Date().toISOString(),
          }));
          await adminSupabase.from("notifications").insert(notifRecords);
        }
      } catch (notifErr) {
        console.warn("[WA-NOTIF-ERROR]: Gagal membuat notifikasi admin:", notifErr);
      }

      return NextResponse.json({
        status: "USER_MESSAGE_REPLIED",
        reply: userAiRes.replyText,
      });
    }

    return NextResponse.json({ status: "SUCCESS" });
  } catch (error) {
    console.error("[WHATSAPP WEBHOOK ERROR]:", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
