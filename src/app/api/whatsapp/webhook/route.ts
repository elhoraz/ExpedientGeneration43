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
      member?: string;
      group?: string;
      isGroup?: boolean;
    }> = [];

    let rawBody: any = null;
    try {
      if (contentType.includes("application/json")) {
        rawBody = await request.json().catch(() => ({}));
      } else if (contentType.includes("form-data") || contentType.includes("urlencoded")) {
        const formData = await request.formData().catch(() => null);
        if (formData) {
          rawBody = {};
          for (const [k, v] of formData.entries()) {
            rawBody[k] = v;
          }
        }
      } else {
        const rawText = await request.text().catch(() => "");
        try {
          rawBody = JSON.parse(rawText);
        } catch {
          const params = new URLSearchParams(rawText);
          rawBody = Object.fromEntries(params.entries());
        }
      }
    } catch (parseErr) {
      console.warn("[WEBHOOK-PARSE-ERR]", parseErr);
      rawBody = {};
    }

    const bodies = Array.isArray(rawBody) ? rawBody : [rawBody];
    for (const body of bodies) {
      if (!body) continue;

      // A. Format Webhook Fonnte
      if (body.sender || body.message || body.text) {
        const senderStr = String(body.sender || "").trim();
        const memberStr = String(body.member || "").trim();
        const groupStr = String(body.group || body.group_id || body.chatid || "").trim();
        const isGrp = Boolean(
          memberStr ||
          groupStr ||
          senderStr.includes("@g.us") ||
          senderStr.startsWith("120363") ||
          memberStr.includes("@g.us") ||
          groupStr.includes("@g.us")
        );

        let msgText = "";
        if (typeof body.message === "string") {
          msgText = body.message;
        } else if (body.message && typeof body.message === "object") {
          msgText = body.message.text || body.message.caption || JSON.stringify(body.message);
        } else {
          msgText = String(body.text || "");
        }

        incomingList.push({
          sender: senderStr,
          messageText: msgText,
          senderName: String(body.name || ""),
          device: String(body.device || ""),
          member: memberStr,
          group: groupStr,
          isGroup: isGrp,
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

    const adminPhoneEnv = (process.env.ADMIN_WA_PHONE || "6282142877426").replace(/\D/g, "");
    const adminSupabase = createAdminClient();

    for (const item of incomingList) {
      const rawSender = item.sender.trim();
      const messageText = item.messageText.trim();
      if (!rawSender || !messageText) continue;

      // =====================================================================
      // 1. PENANGANAN PESAN DARI GRUP WHATSAPP (Grup Non-Resmi / Komunitas)
      // =====================================================================
      const communityGroupDefault = (process.env.WA_GROUP_COMMUNITY_ID || "120363388633880584@g.us").trim();
      let isGroupMsg = false;
      let targetGroupId = "";
      let participantPhone = "";

      if (rawSender.includes("@g.us") || rawSender.startsWith("120363")) {
        isGroupMsg = true;
        targetGroupId = rawSender.includes("@g.us") ? rawSender : `${rawSender}@g.us`;
        participantPhone = item.member || rawSender;
      } else if (item.member && (item.member.includes("@g.us") || item.member.startsWith("120363"))) {
        isGroupMsg = true;
        targetGroupId = item.member.includes("@g.us") ? item.member : `${item.member}@g.us`;
        participantPhone = rawSender;
      } else if (item.group && (item.group.includes("@g.us") || item.group.startsWith("120363"))) {
        isGroupMsg = true;
        targetGroupId = item.group.includes("@g.us") ? item.group : `${item.group}@g.us`;
        participantPhone = rawSender;
      } else if (item.isGroup) {
        isGroupMsg = true;
        targetGroupId = communityGroupDefault;
        participantPhone = item.member || rawSender;
      }

      if (targetGroupId && !targetGroupId.includes("@g.us")) {
        targetGroupId = `${targetGroupId}@g.us`;
      }

      if (isGroupMsg && targetGroupId) {
        const memberName = item.senderName || "Sahabat";
        console.log(`[WA-GROUP-INCOMING] Grup: ${targetGroupId} | Dari: ${participantPhone} (${memberName}): "${messageText}"`);

        const { handleIncomingGroupMessage } = await import("@/lib/whatsapp/groupManager");
        const groupRes = await handleIncomingGroupMessage(targetGroupId, participantPhone, memberName, messageText);

        return NextResponse.json({
          status: groupRes.responded ? "GROUP_MESSAGE_REPLIED" : "GROUP_MESSAGE_IGNORED",
          reply: groupRes.replyText || null,
        });
      }

      // =====================================================================
      // 2. PENANGANAN PESAN PERSONAL (1-ON-1)
      // =====================================================================
      let numNorm = rawSender.replace(/\D/g, "");
      if (numNorm.startsWith("0")) numNorm = "62" + numNorm.substring(1);

      // Cek apakah pesan berasal dari Nomor WhatsApp Admin
      const isSenderAdmin =
        numNorm === adminPhoneEnv ||
        numNorm.endsWith(adminPhoneEnv.slice(-9)) ||
        adminPhoneEnv.endsWith(numNorm.slice(-9));

      if (isSenderAdmin) {
        console.log(`[SENTINEL-ADMIN-INCOMING] Pesan dari Admin (${numNorm}): "${messageText}"`);

        // A. Cek Perintah Approval Broadcast Resmi (KIRIM RESMI / TOLAK)
        const cleanAdminCmd = messageText.trim().toLowerCase();
        if (
          cleanAdminCmd.includes("kirim resmi") ||
          cleanAdminCmd.includes("post resmi") ||
          cleanAdminCmd.includes("publish resmi") ||
          cleanAdminCmd.includes("setujui") ||
          cleanAdminCmd === "setuju" ||
          cleanAdminCmd === "ya" ||
          cleanAdminCmd === "kirim"
        ) {
          const { approvePendingBroadcast } = await import("@/lib/whatsapp/groupManager");
          const approveRes = await approvePendingBroadcast(numNorm);
          const { sendWhatsAppMessageWithDetail } = await import("@/lib/whatsapp");
          await sendWhatsAppMessageWithDetail(numNorm, approveRes.message);
          return NextResponse.json({
            status: "BROADCAST_APPROVED",
            message: approveRes.message,
          });
        }

        if (
          cleanAdminCmd.includes("tolak") ||
          cleanAdminCmd.includes("batal") ||
          cleanAdminCmd.includes("batalkan") ||
          cleanAdminCmd.includes("reject") ||
          cleanAdminCmd === "tidak" ||
          cleanAdminCmd === "jangan"
        ) {
          const { rejectPendingBroadcast } = await import("@/lib/whatsapp/groupManager");
          const rejectRes = await rejectPendingBroadcast(numNorm);
          const { sendWhatsAppMessageWithDetail } = await import("@/lib/whatsapp");
          await sendWhatsAppMessageWithDetail(numNorm, rejectRes.message);
          return NextResponse.json({
            status: "BROADCAST_REJECTED",
            message: rejectRes.message,
          });
        }

        // B. Jalankan engine reflex perbaikan cepat (jika perintah keyword spesifik)
        const remediationResult = await handleAdminAutoRemediation(numNorm, messageText);
        if (remediationResult.action !== "not_a_sentinel_command") {
          console.log(`[SENTINEL-REMEDIATION-EXECUTED]: ${remediationResult.action} - ${remediationResult.success}`);
          return NextResponse.json({
            status: "REMEDIATION_EXECUTED",
            reply: remediationResult.message,
          });
        }

        // C. Jika pesan percakapan bebas / permintaan fitur / pertanyaan santai:
        // Gunakan AI Conversational Agent (Gemini 3.8 Flash)
        const { handleAdminConversationalMessage } = await import("@/lib/sentinel/conversationalAgent");
        const convResult = await handleAdminConversationalMessage(numNorm, messageText);
        return NextResponse.json({
          status: "CONVERSATIONAL_AI_PROCESSED",
          success: convResult.success,
        });
      }

      // =====================================================================
      // 3. PESAN DARI ALUMNI / PENGUNJUNG BIASA (1-ON-1)
      // =====================================================================
      const altLocalNum = numNorm.startsWith("62") ? "0" + numNorm.substring(2) : numNorm;
      const { data: matchedProfiles } = await adminSupabase
        .from("profiles")
        .select("id, nama_lengkap, nama_panggilan, role, is_active")
        .or(`no_whatsapp.eq.${numNorm},no_whatsapp.eq.${altLocalNum}`)
        .limit(1);

      const matchedUser = matchedProfiles?.[0];
      const userDisplayName = matchedUser?.nama_panggilan || matchedUser?.nama_lengkap || item.senderName || "Sahabat";
      const senderTag = matchedUser
        ? `${userDisplayName} (${matchedUser.role || "Alumni"})`
        : item.senderName || `Pengguna WhatsApp`;

      console.log(`[WA-USER-INCOMING] Pesan dari ${numNorm} (${senderTag}): "${messageText}"`);

      // A. Cek apakah ini Berita Duka Cita / Permohonan Titip Pengumuman ke Grup Resmi
      const {
        isAnnouncementSubmission,
        formatAnnouncementWithAi,
        savePendingBroadcast,
      } = await import("@/lib/whatsapp/groupManager");

      const announcementCheck = isAnnouncementSubmission(messageText);

      if (announcementCheck.isAnnouncement) {
        console.log(`[WA-ANNOUNCEMENT-DETECTED] Kategori: ${announcementCheck.category} dari ${userDisplayName}`);

        // 1. Format berita secara terstruktur menggunakan AI
        const formattedAnnounce = await formatAnnouncementWithAi(
          messageText,
          userDisplayName,
          announcementCheck.category
        );

        // 2. Simpan draf ke memory antrean pending & Supabase
        await savePendingBroadcast(
          numNorm,
          userDisplayName,
          messageText,
          formattedAnnounce,
          announcementCheck.category
        );

        // 3. Balas konfirmasi ke Alumni pelapor
        const { sendWhatsAppMessageWithDetail } = await import("@/lib/whatsapp");
        const ackMessage =
          `Inna lillahi wa inna ilaihi raji'un.\n\n` +
          `Terima kasih atas informasinya, Sahabat *${userDisplayName}*.\n\n` +
          `Berita penting/duka cita ini telah dirapikan dan saat ini *DITERUSKAN KE PENGURUS/ADMIN ANGKATAN* untuk diverifikasi serta dipublikasikan ke *Grup Resmi Angkatan*.\n\n` +
          `Semoga almarhum/almarhumah husnul khatimah dan keluarga yang ditinggalkan diberikan ketabahan serta keikhlasan. Aamiin ya Rabbal 'Alamin.`;

        await sendWhatsAppMessageWithDetail(numNorm, ackMessage);

        // 4. Kirim Alert + Draf ke Nomor WhatsApp Admin untuk Konfirmasi
        const adminAlert =
          `📢 *[PERSETUJUAN BROADCAST GRUP RESMI]*\n\n` +
          `👤 *Pelapor:* Sahabat ${userDisplayName} (${numNorm})\n` +
          `🏷️ *Kategori:* ${announcementCheck.category === "duka_cita" ? "Berita Duka Cita / Lelayu" : "Pengumuman Penting"}\n\n` +
          `📝 *Draf Siap Kirim:*\n` +
          `----------------------------------------\n` +
          `${formattedAnnounce}\n` +
          `----------------------------------------\n\n` +
          `👉 Balas *KIRIM RESMI* untuk mempublikasikan langsung ke Grup Resmi Angkatan.\n` +
          `👉 Balas *TOLAK* untuk membatalkan draf ini.`;

        await sendWhatsAppMessageWithDetail(adminPhoneEnv, adminAlert);

        // 5. Buat In-App Notification untuk Admin Dashboard
        try {
          const { data: adminProfiles } = await adminSupabase
            .from("profiles")
            .select("id")
            .in("role", ["admin", "superadmin"]);

          if (adminProfiles && adminProfiles.length > 0) {
            const notifRecords = adminProfiles.map((adm: { id: string }) => ({
              user_id: adm.id,
              title: `📢 Berita Duka / Penting dari ${userDisplayName}`,
              message: `Draf siap dibroadcast ke Grup Resmi WA. Menunggu konfirmasi.`,
              link: "/admin/broadcast",
              is_read: false,
              created_at: new Date().toISOString(),
            }));
            await adminSupabase.from("notifications").insert(notifRecords);
          }
        } catch (notifErr) {
          console.warn("[WA-NOTIF-ERROR]: Gagal membuat notifikasi admin:", notifErr);
        }

        // 6. Simpan riwayat ke antrean database
        await adminSupabase.from("whatsapp_queue").insert([
          {
            no_whatsapp: numNorm,
            message: messageText,
            status: "pending_approval",
            error_message: `Diteruskan ke Admin untuk approval broadcast grup resmi.`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

        return NextResponse.json({
          status: "ANNOUNCEMENT_FORWARDED_TO_ADMIN",
          reply: ackMessage,
        });
      }

      // B. Jika pesan percakapan biasa / konsultasi / tanya data:
      // Eksekusi AI Concierge Alumni (Gemini 3.8 Flash + Supabase Database Query)
      const { handleUserWhatsAppMessage } = await import("@/lib/whatsapp/alumniBot");
      const userAiRes = await handleUserWhatsAppMessage(numNorm, messageText, matchedUser);

      // Simpan riwayat interaksi ke antrean database
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

      // Notifikasi Lonceng In-App untuk Admin Dashboard
      try {
        const { data: adminProfiles } = await adminSupabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "superadmin"]);

        if (adminProfiles && adminProfiles.length > 0) {
          const notifRecords = adminProfiles.map((adm: { id: string }) => ({
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
