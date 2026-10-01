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
  Browsers,
  proto,
  extractMessageContent,
  normalizeMessageContent,
} from "@whiskeysockets/baileys";
import pino from "pino";
// @ts-ignore
import qrcode from "qrcode-terminal";
import QRCode from "qrcode";
import { exec } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

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
import {
  backupSessionToSupabase,
  restoreSessionFromSupabase,
} from "../src/lib/whatsapp/sessionSync";

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

let isReconnecting = false;

async function startBaileysGateway() {
  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  // Otomatis pulihkan sesi dari Supabase Storage jika dijalankan di cloud container
  const credsFile = path.join(AUTH_FOLDER, "creds.json");
  if (!fs.existsSync(credsFile)) {
    await restoreSessionFromSupabase(AUTH_FOLDER);
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log("\n=======================================================");
  console.log(`🤖 EXPEDIENT 43 - SELF-HOSTED WHATSAPP GATEWAY (BAILEYS)`);
  console.log(`📦 WhatsApp Web Version: v${version.join(".")} (${isLatest ? "Latest" : "Outdated"})`);
  console.log(`📁 Auth Folder: ${AUTH_FOLDER}`);
  console.log("=======================================================\n");

  // In-memory message store untuk retry handshake & pelacakan pesan terkirim
  const msgStore = new Map<string, proto.IMessage>();
  const sentMessageIds = new Set<string>();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.ubuntu("Chrome"),
    syncFullHistory: false,
    markOnlineOnConnect: true,
    keepAliveIntervalMs: 25000,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (key.id && msgStore.has(key.id)) {
        return msgStore.get(key.id);
      }
      return proto.Message.fromObject({});
    },
  });

  // Helper pengiriman pesan yang aman & tahan banting (fallback otomatis tanpa quote jika quote bermasalah)
  const sendReply = async (targetJid: string, text: string, quotedMessage?: any) => {
    try {
      const res = quotedMessage
        ? await sock.sendMessage(targetJid, { text }, { quoted: quotedMessage })
        : await sock.sendMessage(targetJid, { text });
      if (res?.key?.id) {
        sentMessageIds.add(res.key.id);
        if (sentMessageIds.size > 2000) {
          const first = sentMessageIds.values().next().value;
          if (first) sentMessageIds.delete(first);
        }
      }
      console.log(`📤 [REPLY-SUCCESS] Berhasil terkirim ke ${targetJid}: "${text.slice(0, 55).replace(/\n/g, " ")}..."`);
      return res;
    } catch (err: any) {
      console.warn(`[SEND-REPLY-FALLBACK] Mencoba kirim tanpa quote ke ${targetJid}:`, err.message);
      try {
        const res = await sock.sendMessage(targetJid, { text });
        if (res?.key?.id) {
          sentMessageIds.add(res.key.id);
        }
        console.log(`📤 [REPLY-SUCCESS-FALLBACK] Berhasil terkirim tanpa quote ke ${targetJid}: "${text.slice(0, 55).replace(/\n/g, " ")}..."`);
        return res;
      } catch (err2: any) {
        console.error(`[SEND-REPLY-FAILED] Gagal mengirim pesan ke ${targetJid}:`, err2.message);
        return null;
      }
    }
  };

  let pairingCodeRequested = false;

  // Simpan kredensial sesi saat ada pembaruan token & sync ke Supabase
  sock.ev.on("creds.update", async () => {
    await saveCreds();
    backupSessionToSupabase(AUTH_FOLDER).catch(() => {});
  });

  // Monitor status koneksi WhatsApp
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // 1. Jika mode pairing aktif, minta kode pairing saat soket siap (saat QR dipancarkan)
    if (qr && pairingPhoneArg && !sock.authState.creds.registered && !pairingCodeRequested) {
      pairingCodeRequested = true;
      const cleanPhone = pairingPhoneArg.replace(/\D/g, "");
      console.log(`\n⏳ Meminta Kode Pairing WhatsApp untuk nomor: ${cleanPhone}...`);
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
    }
    // 2. Jika mode QR biasa, cetak visual QR di browser & terminal
    else if (qr && !pairingPhoneArg) {
      // Buat file HTML QR beresolusi tinggi dan buka otomatis di browser
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { scale: 10, margin: 2 });
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Scan WhatsApp Bot - Expedient 43</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c1317; color: #e9edef; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #111b21; padding: 36px 40px; border-radius: 20px; box-shadow: 0 12px 40px rgba(0,0,0,0.6); text-align: center; border: 1px solid #222e35; max-width: 420px; width: 100%; }
    h2 { margin: 0 0 8px; color: #25d366; font-size: 22px; }
    p { margin: 6px 0; color: #8696a0; font-size: 14px; line-height: 1.5; }
    .qr-container { background: #ffffff; padding: 18px; border-radius: 16px; margin: 24px auto; display: inline-block; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    img { display: block; width: 280px; height: 280px; }
    .step-box { background: #1f2c34; border-radius: 12px; padding: 14px; margin-top: 16px; text-align: left; }
    .step { display: flex; align-items: center; gap: 10px; margin: 8px 0; font-size: 13px; color: #d1d7db; }
    .badge { background: #00a884; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 40px; margin-bottom: 8px;">🤖</div>
    <h2>Scan WhatsApp Bot</h2>
    <p>Expedient Generation 43 Multi-Device</p>
    
    <div class="qr-container">
      <img src="${qrDataUrl}" alt="WhatsApp QR Code" />
    </div>

    <div class="step-box">
      <div class="step"><span class="badge">1</span> Buka WhatsApp di HP Anda</div>
      <div class="step"><span class="badge">2</span> Buka Titik Tiga (Setelan) &rarr; <b>Perangkat Tertaut</b></div>
      <div class="step"><span class="badge">3</span> Ketuk <b>Tautkan Perangkat</b> lalu arahkan kamera ke gambar QR ini</div>
    </div>
  </div>
</body>
</html>`;

        const qrHtmlPath = path.join(process.cwd(), "wa-qr.html");
        fs.writeFileSync(qrHtmlPath, htmlContent, "utf8");

        if (process.platform === "win32") {
          exec(`start "" "${qrHtmlPath}"`);
        } else if (process.platform === "darwin") {
          exec(`open "${qrHtmlPath}"`);
        }
      } catch (_) {}

      console.log("\n=======================================================");
      console.log("📲 GAMBAR QR CODE SUDAH DIBUKA DI BROWSER ANDA!");
      console.log("   (Buka WhatsApp -> Perangkat Tertaut -> Scan gambar di browser)\n");
      try {
        qrcode.setErrorLevel("L");
        qrcode.generate(qr, { small: true });
      } catch (qrErr: any) {
        console.log("QR Data:", qr);
      }
      console.log("=======================================================");
      console.log("💡 Tips: Jika browser tidak terbuka otomatis, buka file 'wa-qr.html'");
      console.log("   atau gunakan kode pairing: npm run wa:bot -- --pairing=6285151771289\n");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isForbidden = statusCode === 403 || statusCode === 401;
      const isRestartRequired = statusCode === DisconnectReason.restartRequired || statusCode === 515;

      console.warn(`[WA-DISCONNECT] Status code: ${statusCode}`);

      // Hentikan listener lama dan tutup socket lama agar tidak ada tumpang tindih
      try {
        sock.ev.removeAllListeners("connection.update");
        sock.ev.removeAllListeners("messages.upsert");
        sock.ev.removeAllListeners("creds.update");
        sock.ws?.close();
      } catch (_) {}

      // 1. RESTART REQUIRED (515) -> PAIRING BERHASIL! Reconnect langsung dalam 1 detik!
      if (isRestartRequired) {
        console.log("⚡ WhatsApp meminta restart sesi (Handshake/Pairing Berhasil!). Menyambungkan ulang sekarang...");
        setTimeout(() => startBaileysGateway(), 1000);
        return;
      }

      if (isLoggedOut || isForbidden) {
        console.error("❌ Akun terputus/logout dari WhatsApp. Hapus folder .baileys_auth jika ingin scan ulang.");
        return;
      }

      // Cegah reconnect ganda yang menyebabkan tumpang tindih socket
      if (isReconnecting) return;
      isReconnecting = true;

      console.log("🔄 Menghubungkan ulang dalam 3 detik...");
      setTimeout(async () => {
        try {
          await startBaileysGateway();
        } finally {
          isReconnecting = false;
        }
      }, 3000);
    } else if (connection === "open") {
      isReconnecting = false;
      console.log("\n=======================================================");
      console.log("✅ [WA-GATEWAY-CONNECTED] WhatsApp Bot BERHASIL TERHUBUNG!");
      console.log(`👤 Device ID: ${sock.user?.id || "Connected"}`);
      console.log(`🆔 Device LID: ${sock.user?.lid || "None"}`);
      console.log("🚀 Fitur Multimodal (Gambar, Stiker, Voice Note, Video) SIAP 100% GRATIS!\n");
      console.log("=======================================================\n");

      // Cadangkan sesi ke Supabase Storage secara otomatis saat terhubung
      backupSessionToSupabase(AUTH_FOLDER).catch(() => {});

      // Bersihkan file HTML QR jika ada
      try {
        const qrHtmlPath = path.join(process.cwd(), "wa-qr.html");
        if (fs.existsSync(qrHtmlPath)) fs.unlinkSync(qrHtmlPath);
      } catch (_) {}
    }
  });

  // Listener Pesan Masuk
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    for (const m of messages) {
      try {
        const msgId = m.key.id;
        // 1. Abaikan jika pesan ini baru saja dikirim oleh bot kita sendiri
        if (msgId && sentMessageIds.has(msgId)) {
          continue;
        }

        const remoteJid = m.key.remoteJid || "";
        if (!m.message || remoteJid === "status@broadcast") continue;

        // Simpan ke in-memory store untuk retry handshake WhatsApp
        if (msgId && m.message) {
          msgStore.set(msgId, m.message);
          if (msgStore.size > 200) {
            const firstKey = msgStore.keys().next().value;
            if (firstKey) msgStore.delete(firstKey);
          }
        }

        const isGroup = remoteJid.endsWith("@g.us");
        const participantRaw = isGroup ? m.key.participant || remoteJid : remoteJid;
        let senderPhone = participantRaw.replace(/\D/g, "");
        const senderName = m.pushName || "Sahabat";

        const botPhone = (sock.user?.id?.split(":")[0] || pairingPhoneArg || process.env.WA_BOT_PHONE || "6285151771289").replace(/\D/g, "");
        const botShortPhone = botPhone.slice(-9);
        const botLid = sock.user?.lid ? sock.user.lid.split(":")[0] : "";
        const botUserId = sock.user?.id ? sock.user.id.split(":")[0] : "";

        // Deteksi apakah user sedang menguji via fitur 'Pesan ke Diri Sendiri' (Note to Self)
        const isSelfChat = !isGroup && (
          remoteJid.includes(botShortPhone) ||
          remoteJid.includes(botPhone) ||
          (botLid && remoteJid.includes(botLid)) ||
          (botUserId && remoteJid.includes(botUserId))
        );

        if (isSelfChat) {
          senderPhone = botPhone;
        }

        // Jika pesan dikirim dari akun bot sendiri (m.key.fromMe):
        // HANYA proses jika ini adalah chat pribadi ke akun bot sendiri (Self Test).
        // Jangan proses jika pengguna sedang mengetik ke orang lain atau ke grup (agar tidak membalas chat manual manusia).
        if (m.key.fromMe && !isSelfChat) continue;

        const rawMsg = m.message;
        const msgContent = (normalizeMessageContent(extractMessageContent(rawMsg) || rawMsg) || {}) as proto.IMessage;

        // Ekstraksi Teks Pesan
        const messageText =
          msgContent.conversation ||
          msgContent.extendedTextMessage?.text ||
          msgContent.imageMessage?.caption ||
          msgContent.videoMessage?.caption ||
          msgContent.documentMessage?.caption ||
          msgContent.editedMessage?.message?.protocolMessage?.editedMessage?.conversation ||
          msgContent.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
          "";

        // Deteksi Konteks Pesan (Mention & Reply/Quote)
        const contextInfo =
          msgContent.extendedTextMessage?.contextInfo ||
          msgContent.imageMessage?.contextInfo ||
          msgContent.audioMessage?.contextInfo ||
          msgContent.videoMessage?.contextInfo ||
          msgContent.stickerMessage?.contextInfo ||
          msgContent.documentMessage?.contextInfo;

        const mentionedJids: string[] = contextInfo?.mentionedJid || [];
        const quotedParticipant = (contextInfo?.participant || "").replace(/\D/g, "");

        const isBotMentioned = mentionedJids.some((j: string) => {
          const num = j.replace(/\D/g, "");
          return (
            num === botPhone ||
            num.endsWith(botShortPhone) ||
            num.includes("85151771289") ||
            num.includes("89675010185") ||
            (botLid && j.includes(botLid))
          );
        });

        const isBotQuoted =
          (botPhone && (quotedParticipant === botPhone || quotedParticipant.endsWith(botShortPhone))) ||
          quotedParticipant.includes("85151771289") ||
          quotedParticipant.includes("89675010185") ||
          (botLid && quotedParticipant === botLid);

        // ATURAN MUTLAK KECERDASAN GRUP:
        // Di grup, bot HANYA merespons jika DI-TAG / DI-MENTION secara eksplisit (@bot/@nomor),
        // atau namanya dipanggil langsung ("bot ...", "min ...", "!jadwal", "/menu").
        // JANGAN PERNAH nimbrung / nyaut jika anggota sedang ngobrol santai antar sesama anggota!
        const isDirectlyAddressed = isGroup
          ? isBotMentioned
          : isBotMentioned || isBotQuoted;

        // Cek Quoted Media (jika user mereply foto/stiker/audio lama sambil tag bot)
        const quotedMsgRaw = contextInfo?.quotedMessage;
        const quotedMsg = quotedMsgRaw
          ? ((normalizeMessageContent(extractMessageContent(quotedMsgRaw) || quotedMsgRaw) || {}) as proto.IMessage)
          : null;

        const quotedIsImage = Boolean(quotedMsg?.imageMessage || quotedMsg?.documentMessage?.mimetype?.startsWith("image/"));
        const quotedIsSticker = Boolean(quotedMsg?.stickerMessage);
        const quotedIsAudio = Boolean(quotedMsg?.audioMessage);
        const quotedIsVideo = Boolean(quotedMsg?.videoMessage || quotedMsg?.ptvMessage);
        const quotedIsDocument = Boolean(quotedMsg?.documentMessage && !quotedMsg?.documentMessage?.mimetype?.startsWith("image/"));
        const quotedHasMedia = quotedIsImage || quotedIsSticker || quotedIsAudio || quotedIsVideo || quotedIsDocument;

        // Deteksi Tipe Media Pesan Utama (Mendukung foto, stiker, VN, video note, dan dokumen gambar)
        const isImage = Boolean(msgContent.imageMessage || msgContent.documentMessage?.mimetype?.startsWith("image/"));
        const isSticker = Boolean(msgContent.stickerMessage);
        const isAudio = Boolean(msgContent.audioMessage);
        const isVideo = Boolean(msgContent.videoMessage || msgContent.ptvMessage);
        const isDocument = Boolean(msgContent.documentMessage && !msgContent.documentMessage?.mimetype?.startsWith("image/"));
        const hasMedia = isImage || isSticker || isAudio || isVideo || isDocument;

        console.log(`📩 [INCOMING-MSG] JID: ${remoteJid} | fromMe: ${m.key.fromMe} | Pengirim: ${senderName} (${senderPhone}) | Grup: ${isGroup} | Media: ${hasMedia} | Isi: "${messageText.slice(0, 60)}"`);

        // =====================================================================
        // 1. PENANGANAN MEDIA LANGSUNG (Gambar, Stiker, Voice Note, Video Note)
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
            ? msgContent.imageMessage?.mimetype || msgContent.documentMessage?.mimetype || "image/jpeg"
            : "application/pdf";

          console.log(`[BAILEYS-MEDIA-INCOMING] Tipe: ${category.toUpperCase()} | Dari: ${senderName} (${senderPhone}) | Grup: ${isGroup ? remoteJid : "PERSONAL"}`);

          // Cek apakah bot harus merespons media ini:
          // Di Grup Desain: Gambar/poster SELALU direview otomatis
          // Di Grup Lain: Hanya jika di-tag atau diminta review
          // Di Chat Pribadi: SELALU direspons!
          const shouldRespond = isGroup
            ? isDirectlyAddressed || shouldProcessGroupMedia(remoteJid, category, messageText)
            : true;

          if (shouldRespond) {
            await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});

            try {
              // Download buffer media langsung dari server WhatsApp via Baileys
              // Gunakan unboxed envelope agar Baileys tidak tertahan wrapper ephemeral
              const unboxedMsg = {
                key: m.key,
                message: msgContent,
              };

              let mediaBuffer: Buffer;
              try {
                mediaBuffer = (await downloadMediaMessage(
                  unboxedMsg as any,
                  "buffer",
                  {},
                  { logger, reuploadRequest: sock.updateMediaMessage }
                )) as Buffer;
              } catch (_) {
                mediaBuffer = (await downloadMediaMessage(
                  m,
                  "buffer",
                  {},
                  { logger, reuploadRequest: sock.updateMediaMessage }
                )) as Buffer;
              }

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
              await sendReply(remoteJid, multiRes.replyText, m);
              console.log(`[BAILEYS-MEDIA-REPLIED] Berhasil membalas ${category} ke ${remoteJid}`);

              // Rekam aktivitas jika di grup komunitas untuk icebreaker
              if (remoteJid.includes("120363388633880584") || remoteJid === getCommunityGroupId()) {
                recordCommunityGroupActivity(`[Media ${category}] ${messageText}`, senderName, senderPhone).catch(() => {});
              }
            } catch (mediaErr: any) {
              console.error("[BAILEYS-MEDIA-ERROR]:", mediaErr.message);
              await sendReply(remoteJid, "Maaf Sahabat, media tidak dapat diproses saat ini. Silakan kirimkan kembali ya!");
            }

            continue;
          }
        }

        // =====================================================================
        // 2. PENANGANAN MEDIA YANG DI-REPLY/QUOTE (misal reply poster lama & tag bot)
        // =====================================================================
        if (
          !hasMedia &&
          quotedHasMedia &&
          (isDirectlyAddressed ||
            (isGroup
              ? isDesignGroupId(remoteJid)
                ? shouldDesignBotRespond(messageText)
                : shouldGroupBotRespond(messageText)
              : true))
        ) {
          const category: MultimodalMediaCategory = quotedIsSticker
            ? "sticker"
            : quotedIsAudio
            ? "audio"
            : quotedIsVideo
            ? "video"
            : quotedIsImage
            ? "image"
            : "document";

          const mimeType = quotedIsSticker
            ? "image/webp"
            : quotedIsAudio
            ? "audio/ogg"
            : quotedIsVideo
            ? "video/mp4"
            : quotedIsImage
            ? quotedMsg?.imageMessage?.mimetype || "image/jpeg"
            : "application/pdf";

          console.log(`[BAILEYS-QUOTED-MEDIA] User mereply media ${category} dengan pesan: "${messageText}"`);
          await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});

          try {
            const fakeQuotedMsgObj = {
              key: {
                remoteJid,
                id: contextInfo?.stanzaId,
                participant: contextInfo?.participant,
              },
              message: quotedMsg,
            };

            const mediaBuffer = await downloadMediaMessage(
              fakeQuotedMsgObj as any,
              "buffer",
              {},
              { logger, reuploadRequest: sock.updateMediaMessage }
            );

            const multiRes = await processMultimodalBuffer({
              base64Data: mediaBuffer.toString("base64"),
              category,
              mimeType,
              caption: messageText,
              senderPhone,
              senderName,
              isGroup,
              groupId: remoteJid,
              filename: `${category}_quoted_${Date.now()}`,
            });

            await sendReply(remoteJid, multiRes.replyText, m);
            continue;
          } catch (err: any) {
            console.warn("[QUOTED-MEDIA-DOWNLOAD-FAILED]:", err.message);
            // fallback ke penanganan teks biasa di bawah
          }
        }

        // =====================================================================
        // 3. PENANGANAN PESAN TEKS & EMOJI
        // =====================================================================
        if (!messageText) continue;

        if (isGroup) {
          // CABANG A: GRUP GRAPHIC DESIGN
          if (isDesignGroupId(remoteJid)) {
            if (isDirectlyAddressed || shouldDesignBotRespond(messageText)) {
              await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});
              const replyText = await handleDesignStudioConversation({
                senderPhone,
                senderName,
                messageText,
                groupId: remoteJid,
              });
              await sendReply(remoteJid, replyText, m);
            }
          }
          // CABANG B: GRUP KOMUNITAS / ANGKATAN
          else {
            if (isDirectlyAddressed || shouldGroupBotRespond(messageText)) {
              await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});
              const replyText = await generateIntelligentCohortReply({
                messageText,
                senderPhone,
                senderName,
                isGroup: true,
                groupId: remoteJid,
              });
              await sendReply(remoteJid, replyText, m);

              if (remoteJid.includes("120363388633880584") || remoteJid === getCommunityGroupId()) {
                recordCommunityGroupActivity(messageText, senderName, senderPhone).catch(() => {});
              }
            }
          }
        } else {
          // CABANG C: CHAT PRIBADI (1-ON-1)
          console.log(`[BAILEYS-PRIVATE-CHAT] Menerima pesan pribadi dari: ${senderName} (${senderPhone}) | JID: ${remoteJid} | Isi: "${messageText}"`);
          await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});

          const adminPhoneEnv = (process.env.ADMIN_WA_PHONE || "6282142877426").replace(/\D/g, "");
          const isSenderAdmin =
            senderPhone === adminPhoneEnv ||
            senderPhone.endsWith(adminPhoneEnv.slice(-9)) ||
            adminPhoneEnv.endsWith(senderPhone.slice(-9));

          if (isSenderAdmin && (messageText.startsWith("!") || messageText.startsWith("/fix") || messageText.toLowerCase().includes("remediasi"))) {
            // Periksa auto-remediasi jika diminta
            const remResult = await handleAdminAutoRemediation(senderPhone, messageText);
            if (remResult.action !== "not_a_sentinel_command") {
              await sendReply(remoteJid, remResult.message, m);
              continue;
            }
          }

          // Untuk semua chat pribadi (Admin maupun Alumni): gunakan AI Intelligence resmi angkatan 2025 secara langsung via Baileys socket!
          const replyText = await generateIntelligentCohortReply({
            messageText,
            senderPhone,
            senderName,
            isGroup: false,
          });

          await sendReply(remoteJid, replyText, m);
          console.log(`[BAILEYS-PRIVATE-REPLIED] Berhasil membalas chat pribadi ke ${remoteJid}`);
        }
      } catch (msgErr: any) {
        console.error("[BAILEYS-MSG-ERROR]:", msgErr);
      }
    }
  });

  // HTTP Health Check Server untuk Cloud Hosting (Hugging Face Spaces / Koyeb / Render)
  const HTTP_PORT = parseInt(process.env.PORT || "7860", 10);
  const healthServer = http.createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "online",
          bot: "Expedient 43 WhatsApp Gateway",
          device: sock.user?.id || "connected",
          uptimeSeconds: Math.round(process.uptime()),
          timestamp: new Date().toISOString(),
        })
      );
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  healthServer.listen(HTTP_PORT, () => {
    console.log(`🌐 [CLOUD-KEEP-ALIVE] HTTP Health Server aktif di port ${HTTP_PORT} (Hugging Face / Koyeb 24/7 Ready)`);
  });

  return sock;
}

// Jalankan gateway
startBaileysGateway().catch((err) => {
  console.error("[BAILEYS-FATAL]:", err);
});
