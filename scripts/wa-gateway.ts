/**
 * scripts/wa-gateway.ts
 * Self-Hosted Baileys WhatsApp Gateway (100% GRATIS SELAMANYA)
 * Mendukung Teks, Gambar, Stiker (.webp), Voice Note (VN), dan Video Note dengan Gemini Multimodal
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  downloadMediaMessage,
  fetchLatestBaileysVersion,
  proto,
} from "@whiskeysockets/baileys";
import pino from "pino";
// @ts-ignore
import qrcode from "qrcode-terminal";
import * as path from "path";
import * as fs from "fs";

// Import AI Handlers dari codebase project
import {
  processMultimodalBuffer,
  shouldProcessGroupMedia,
  MultimodalMediaCategory,
} from "../src/lib/whatsapp/multimodalProcessor";
import {
  isDesignGroupId,
  shouldDesignBotRespond,
  handleDesignStudioConversation,
} from "../src/lib/whatsapp/designGroupAssistant";
import {
  shouldGroupBotRespond,
} from "../src/lib/whatsapp/groupManager";
import { generateIntelligentCohortReply } from "../src/lib/whatsapp/alumniIntelligence";
import { handleUserWhatsAppMessage } from "../src/lib/whatsapp/alumniBot";
import { handleAdminConversationalMessage } from "../src/lib/sentinel/conversationalAgent";
import { handleAdminAutoRemediation } from "../src/lib/sentinel/autoRemediator";
import { recordCommunityGroupActivity } from "../src/lib/whatsapp/communityIcebreaker";
import { getCommunityGroupId, getDesignGroupId } from "../src/lib/whatsapp";
import { createAdminClient } from "../src/lib/supabase/admin";

const AUTH_FOLDER = path.join(process.cwd(), ".baileys_auth");
const logger = pino({ level: "silent" });

// Nomor bot untuk pairing code (jika ingin pakai pairing code daripada scan QR)
let pairingPhoneArg = "";
const pairingArgIndex = process.argv.indexOf("--pairing");
if (pairingArgIndex !== -1) {
  const nextArg = process.argv[pairingArgIndex + 1];
  pairingPhoneArg = nextArg && !nextArg.startsWith("-") ? nextArg : "6285151771289";
} else {
  const match = process.argv.find((a) => a.startsWith("--pairing="));
  if (match) {
    pairingPhoneArg = match.split("=")[1] || "6285151771289";
  } else if (process.env.WA_BOT_PHONE) {
    pairingPhoneArg = process.env.WA_BOT_PHONE;
  }
}

async function startBaileysGateway() {
  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log("\n=======================================================");
  console.log(`🤖 EXPEDIENT 43 - SELF-HOSTED WHATSAPP GATEWAY (BAILEYS)`);
  console.log(`📦 WhatsApp Web Version: v${version.join(".")} (${isLatest ? "Latest" : "Outdated"})`);
  console.log(`📁 Auth Folder: ${AUTH_FOLDER}`);
  console.log("=======================================================\n");

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: ["Expedient Generation 43", "Chrome", "120.0.0"],
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  });

  // Pairing code mode jika belum terdaftar dan nomor diberikan
  if (pairingPhoneArg && !sock.authState.creds.registered) {
    const cleanPhone = pairingPhoneArg.replace(/\D/g, "");
    console.log(`⏳ Meminta Kode Pairing WhatsApp untuk nomor: ${cleanPhone}...`);
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(cleanPhone);
        console.log("\n=======================================================");
        console.log(`🔑 KODE PAIRING WHATSAPP:  👉  ${code}  👈`);
        console.log("1. Buka WhatsApp di HP Anda");
        console.log("2. Buka Titik 3 / Setelan -> Perangkat Tertaut");
        console.log("3. Pilih 'Tautkan dengan nomor telepon saja'");
        console.log(`4. Masukkan kode 8 karakter di atas: ${code}`);
        console.log("=======================================================\n");
      } catch (err: any) {
        console.error("Gagal meminta pairing code:", err.message);
      }
    }, 4000);
  }

  // Simpan kredensial sesi saat ada pembaruan token
  sock.ev.on("creds.update", saveCreds);

  // Monitor status koneksi WhatsApp
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !pairingPhoneArg) {
      console.log("\n=======================================================");
      console.log("📲 SCAN QR CODE BERIKUT DENGAN WHATSAPP DI HP ANDA:");
      console.log("   (WhatsApp -> Perangkat Tertaut -> Tautkan Perangkat)\n");
      try {
        qrcode.setErrorLevel("L");
        qrcode.generate(qr, { small: true });
      } catch (qrErr: any) {
        console.log("QR Data:", qr);
      }
      console.log("=======================================================");
      console.log("💡 Tips: Jika terminal sulit scan QR, gunakan kode pairing 8 digit:");
      console.log("   npm run wa:bot -- --pairing=6285151771289\n");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.warn(`[WA-DISCONNECT] Koneksi terputus. Status code: ${statusCode} | Reconnect: ${shouldReconnect}`);

      if (shouldReconnect) {
        console.log("🔄 Menghubungkan ulang dalam 3 detik...");
        setTimeout(() => startBaileysGateway(), 3000);
      } else {
        console.error("❌ Akun telah logout dari HP. Silakan hapus folder .baileys_auth dan scan ulang.");
      }
    } else if (connection === "open") {
      console.log("\n✅ [WA-GATEWAY-CONNECTED] WhatsApp Bot BERHASIL TERHUBUNG!");
      console.log(`👤 Device ID: ${sock.user?.id || "Connected"}`);
      console.log("🚀 Fitur Multimodal (Gambar, Stiker, Voice Note, Video) SIAP 100% GRATIS!\n");
    }
  });

  // Listener Pesan Masuk
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const m of messages) {
      try {
        if (!m.message || m.key.fromMe || m.key.remoteJid === "status@broadcast") continue;

        const remoteJid = m.key.remoteJid || "";
        const isGroup = remoteJid.endsWith("@g.us");
        const participantRaw = isGroup ? m.key.participant || remoteJid : remoteJid;
        const senderPhone = participantRaw.replace(/\D/g, "");
        const senderName = m.pushName || "Sahabat";

        const rawMsg = m.message;
        const msgContent =
          rawMsg.viewOnceMessage?.message ||
          rawMsg.viewOnceMessageV2?.message ||
          rawMsg.ephemeralMessage?.message ||
          rawMsg.documentWithCaptionMessage?.message ||
          rawMsg;

        // Ekstraksi Teks Pesan
        const messageText =
          msgContent.conversation ||
          msgContent.extendedTextMessage?.text ||
          msgContent.imageMessage?.caption ||
          msgContent.videoMessage?.caption ||
          msgContent.documentMessage?.caption ||
          "";

        // Deteksi Tipe Media
        const isImage = Boolean(msgContent.imageMessage);
        const isSticker = Boolean(msgContent.stickerMessage);
        const isAudio = Boolean(msgContent.audioMessage);
        const isVideo = Boolean(msgContent.videoMessage);
        const isDocument = Boolean(msgContent.documentMessage);
        const hasMedia = isImage || isSticker || isAudio || isVideo || isDocument;

        // =====================================================================
        // 1. PENANGANAN MEDIA MASUK (Gambar, Stiker, Voice Note, Video Note)
        // =====================================================================
        if (hasMedia) {
          const category: MultimodalMediaCategory = isSticker
            ? "sticker"
            : isAudio
            ? "audio"
            : isVideo
            ? "video"
            : isImage
            ? "image"
            : "document";

          const mimeType = isSticker
            ? "image/webp"
            : isAudio
            ? "audio/ogg"
            : isVideo
            ? "video/mp4"
            : isImage
            ? msgContent.imageMessage?.mimetype || "image/jpeg"
            : "application/pdf";

          console.log(`[BAILEYS-MEDIA-INCOMING] Tipe: ${category.toUpperCase()} | Dari: ${senderName} (${senderPhone}) | Grup: ${isGroup ? remoteJid : "PERSONAL"}`);

          // Cek apakah bot harus merespons media ini
          const shouldRespond = isGroup
            ? shouldProcessGroupMedia(remoteJid, category, messageText)
            : true; // Di chat pribadi SELALU direspons!

          if (shouldRespond) {
            // Berikan indikator sedang mengetik di WhatsApp
            await sock.sendPresenceUpdate("composing", remoteJid);

            // Download buffer media langsung dari server WhatsApp via Baileys
            const mediaBuffer = await downloadMediaMessage(
              m,
              "buffer",
              {},
              { logger, reuploadRequest: sock.updateMediaMessage }
            );

            console.log(`[BAILEYS-MEDIA-DOWNLOADED] Ukuran: ${(mediaBuffer.length / 1024).toFixed(1)} KB. Menganalisis dengan Gemini Multimodal...`);

            // Proses langsung dengan Gemini AI
            const multiRes = await processMultimodalBuffer({
              base64Data: mediaBuffer.toString("base64"),
              category,
              mimeType,
              caption: messageText,
              senderPhone,
              senderName,
              isGroup,
              groupId: remoteJid,
              filename: `${category}_${Date.now()}`,
            });

            // Kirim balasan langsung ke WhatsApp
            await sock.sendMessage(
              remoteJid,
              { text: multiRes.replyText },
              { quoted: m }
            );

            console.log(`[BAILEYS-MEDIA-REPLIED] Berhasil membalas ${category} ke ${remoteJid}`);

            // Rekam aktivitas jika di grup komunitas untuk icebreaker
            if (remoteJid.includes("120363388633880584") || remoteJid === getCommunityGroupId()) {
              recordCommunityGroupActivity(`[Media ${category}] ${messageText}`, senderName, senderPhone).catch(() => {});
            }

            continue;
          }
        }

        // =====================================================================
        // 2. PENANGANAN PESAN TEKS BIASA
        // =====================================================================
        if (!messageText) continue;

        if (isGroup) {
          // CABANG A: GRUP GRAPHIC DESIGN
          if (isDesignGroupId(remoteJid)) {
            if (shouldDesignBotRespond(messageText)) {
              await sock.sendPresenceUpdate("composing", remoteJid);
              const replyText = await handleDesignStudioConversation({
                senderPhone,
                senderName,
                messageText,
                groupId: remoteJid,
              });
              await sock.sendMessage(remoteJid, { text: replyText }, { quoted: m });
            }
          }
          // CABANG B: GRUP KOMUNITAS / ANGKATAN
          else {
            if (shouldGroupBotRespond(messageText)) {
              await sock.sendPresenceUpdate("composing", remoteJid);
              const replyText = await generateIntelligentCohortReply({
                messageText,
                senderPhone,
                senderName,
                isGroup: true,
                groupId: remoteJid,
              });
              await sock.sendMessage(remoteJid, { text: replyText }, { quoted: m });

              if (remoteJid.includes("120363388633880584") || remoteJid === getCommunityGroupId()) {
                recordCommunityGroupActivity(messageText, senderName, senderPhone).catch(() => {});
              }
            }
          }
        } else {
          // CABANG C: CHAT PRIBADI (1-ON-1)
          await sock.sendPresenceUpdate("composing", remoteJid);

          const adminPhoneEnv = (process.env.ADMIN_WA_PHONE || "6282142877426").replace(/\D/g, "");
          const isSenderAdmin =
            senderPhone === adminPhoneEnv ||
            senderPhone.endsWith(adminPhoneEnv.slice(-9)) ||
            adminPhoneEnv.endsWith(senderPhone.slice(-9));

          if (isSenderAdmin) {
            // Periksa auto-remediasi atau conversational admin
            const remResult = await handleAdminAutoRemediation(senderPhone, messageText);
            if (remResult.action !== "not_a_sentinel_command") {
              await sock.sendMessage(remoteJid, { text: remResult.message }, { quoted: m });
            } else {
              const convResult = await handleAdminConversationalMessage(senderPhone, messageText);
              // conversational agent already sends message if needed or returns reply
            }
          } else {
            // Cari data alumni di Supabase
            let matchedUser: any = null;
            try {
              const supabase = createAdminClient();
              const altLocalNum = senderPhone.startsWith("62") ? "0" + senderPhone.substring(2) : senderPhone;
              const { data } = await supabase
                .from("profiles")
                .select("id, nama_lengkap, nama_panggilan, role, is_active")
                .or(`no_whatsapp.eq.${senderPhone},no_whatsapp.eq.${altLocalNum}`)
                .limit(1);
              matchedUser = data?.[0] || null;
            } catch (err) {}

            const userAiRes = await handleUserWhatsAppMessage(senderPhone, messageText, matchedUser);
            await sock.sendMessage(remoteJid, { text: userAiRes.replyText }, { quoted: m });
          }
        }
      } catch (msgErr: any) {
        console.error("[BAILEYS-MSG-ERROR]:", msgErr);
      }
    }
  });

  return sock;
}

// Jalankan gateway
startBaileysGateway().catch((err) => {
  console.error("[BAILEYS-FATAL]:", err);
});
