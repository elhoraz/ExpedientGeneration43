/**
 * scripts/wa-gateway.ts
 * Self-Hosted Baileys WhatsApp Gateway (100% GRATIS SELAMANYA)
 * Dilengkapi Web Dashboard Realtime, QR Scanner Web, Auto Pairing Code, dan Gemini Multimodal
 */

import WebSocket from "ws";
if (typeof globalThis.WebSocket === "undefined") {
  // @ts-ignore
  globalThis.WebSocket = WebSocket;
}
if (typeof global !== "undefined" && typeof (global as any).WebSocket === "undefined") {
  (global as any).WebSocket = WebSocket;
}

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
  architectMasterpieceDesign,
  formatBlueprintForWhatsApp,
} from "../src/lib/whatsapp/designPromptArchitect";
import {
  shouldGroupBotRespond,
} from "../src/lib/whatsapp/groupManager";
import { generateIntelligentCohortReply } from "../src/lib/whatsapp/alumniIntelligence";
import { handleAdminAutoRemediation } from "../src/lib/sentinel/autoRemediator";
import { recordCommunityGroupActivity } from "../src/lib/whatsapp/communityIcebreaker";
import { getCommunityGroupId } from "../src/lib/whatsapp";
import {
  backupSessionToSupabase,
  restoreSessionFromSupabase,
} from "../src/lib/whatsapp/sessionSync";

const AUTH_FOLDER = path.join(process.cwd(), ".baileys_auth");
const logger = pino({ level: "silent" });

// =============================================================================
// GLOBAL GATEWAY STATE & LOG BUFFER (Untuk Web Dashboard & Health Endpoint)
// =============================================================================
type GatewayState = "initializing" | "connecting" | "qr_ready" | "connected" | "disconnected";

let currentSock: any = null;
let gatewayStatus: GatewayState = "initializing";
let activeUser: { id?: string; name?: string; lid?: string } | null = null;
let currentQrDataUrl: string = "";
let currentPairingCode: string = "";
let lastDisconnectInfo: string = "";
let pairingPhoneArg = "";

interface LogEntry {
  time: string;
  level: "info" | "warn" | "error" | "success";
  msg: string;
}

const activityLogs: LogEntry[] = [];

function addLog(msg: string, level: LogEntry["level"] = "info") {
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

  activityLogs.push({ time, level, msg });
  if (activityLogs.length > 100) activityLogs.shift();
  console.log(`[${time}] ${msg}`);
}

// Deteksi argumen pairing di CLI
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

// =============================================================================
// BAILEYS WHATSAPP SOCKET CORE
// =============================================================================
async function startBaileysGateway() {
  gatewayStatus = "connecting";
  addLog("🚀 Memulai inisialisasi Baileys WhatsApp Gateway...");

  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  // Otomatis pulihkan sesi dari Supabase Storage jika dijalankan di cloud container
  const credsFile = path.join(AUTH_FOLDER, "creds.json");
  if (!fs.existsSync(credsFile)) {
    addLog("☁️ Memeriksa cadangan sesi di Supabase Storage...");
    const restored = await restoreSessionFromSupabase(AUTH_FOLDER);
    if (restored) {
      addLog("✅ Sesi WhatsApp berhasil dipulihkan dari Supabase Storage!", "success");
    } else {
      addLog("ℹ️ Belum ada sesi tersimpan di Supabase Storage, perlu login awal.", "warn");
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  addLog(`📦 WhatsApp Web Version: v${version.join(".")} (${isLatest ? "Latest" : "Outdated"})`);

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

  currentSock = sock;

  // Helper pengiriman pesan yang aman & tahan banting
  const sendReply = async (targetJid: string, text: string, quotedMessage?: any) => {
    const cleanJid = targetJid.replace(/:\d+@/, "@");
    try {
      const res = quotedMessage
        ? await sock.sendMessage(cleanJid, { text }, { quoted: quotedMessage })
        : await sock.sendMessage(cleanJid, { text });
      if (res?.key?.id) {
        sentMessageIds.add(res.key.id);
        if (sentMessageIds.size > 2000) {
          const first = sentMessageIds.values().next().value;
          if (first) sentMessageIds.delete(first);
        }
      }
      addLog(`📤 [REPLY-SUCCESS] Terkirim ke ${cleanJid}: "${text.slice(0, 50).replace(/\n/g, " ")}..."`, "success");
      return res;
    } catch (err: any) {
      addLog(`⚠️ [SEND-FALLBACK] Mengirim tanpa quote ke ${cleanJid}: ${err.message}`, "warn");
      try {
        const res = await sock.sendMessage(cleanJid, { text });
        if (res?.key?.id) sentMessageIds.add(res.key.id);
        return res;
      } catch (err2: any) {
        addLog(`❌ [SEND-FAILED] Gagal kirim pesan ke ${cleanJid}: ${err2.message}`, "error");
        return null;
      }
    }
  };

  // Helper Generate & Kirim Poster / Gambar AI & Aset Resmi HD
  const generateAndSendImage = async (rawPrompt: string, targetJid: string, quotedMessage?: any) => {
    const cleanJid = targetJid.replace(/:\d+@/, "@");
    const lowerPrompt = rawPrompt.toLowerCase().trim();

    const possiblePosterPaths = [
      path.join(process.cwd(), "public", "images", "posters"),
      path.join(__dirname, "..", "public", "images", "posters"),
      path.join(__dirname, "public", "images", "posters"),
      "/opt/render/project/src/public/images/posters",
    ];

    const findPosterBuffer = async (filename: string): Promise<Buffer | null> => {
      for (const p of possiblePosterPaths) {
        const full = path.join(p, filename);
        if (fs.existsSync(full)) {
          try {
            return fs.readFileSync(full);
          } catch (_) {}
        }
      }
      // Fallback: Unduh langsung dari Supabase Storage CDN yang selalu aktif & 100% online
      try {
        const cdnUrl = `https://dodcwulqgrhqpbldrlik.supabase.co/storage/v1/object/public/cms-assets/posters/${filename}`;
        const res = await fetch(cdnUrl, { signal: AbortSignal.timeout(15000) });
        if (res.ok) {
          const ab = await res.arrayBuffer();
          if (ab.byteLength > 1000) {
            return Buffer.from(ab);
          }
        }
      } catch (_) {}
      return null;
    };

    // 1. CEK ASET POSTER RESMI EXPEDIENT DARI DISK SERVER
    // Jika meminta agenda resmi (HUT TNI, Kesaktian Pancasila, G30S PKI, dll)
    const blueprint = architectMasterpieceDesign(rawPrompt);
    const isHutTni = blueprint.category === "military" || lowerPrompt.includes("tni") || lowerPrompt.includes("tentara");
    const isHariSantri = blueprint.category === "islamic" || lowerPrompt.includes("santri") || lowerPrompt.includes("hsn");
    const isPancasila = lowerPrompt.includes("pancasila") || lowerPrompt.includes("kesaktian");
    const isG30s = lowerPrompt.includes("g30s") || lowerPrompt.includes("pki");

    let officialBuffer: Buffer | null = null;
    let officialTitle = "";

    if (isHutTni) {
      officialBuffer = (await findPosterBuffer("hut_tni_feed.jpg")) || (await findPosterBuffer("hut_tni_story.jpg"));
      officialTitle = "HUT TNI (5 Oktober 2026)";
    } else if (isHariSantri) {
      officialBuffer = (await findPosterBuffer("hari_santri_feed.jpg")) || (await findPosterBuffer("hari_santri_story.jpg"));
      officialTitle = "Hari Santri Nasional (22 Oktober 2026)";
    } else if (isPancasila) {
      officialBuffer = (await findPosterBuffer("kesaktian_pancasila_feed.jpg")) || (await findPosterBuffer("kesaktian_pancasila_story.jpg"));
      officialTitle = "Hari Kesaktian Pancasila (1 Oktober)";
    } else if (isG30s) {
      officialBuffer = (await findPosterBuffer("g30s_pki_feed.jpg")) || (await findPosterBuffer("g30s_pki_story.jpg"));
      officialTitle = "Peringatan G30S/PKI (30 September)";
    }

    if (officialBuffer) {
      addLog(`🖼️ [OFFICIAL-POSTER] Mengirimkan poster resmi siap pakai: "${officialTitle}" ke ${cleanJid}`);
      await sock.sendPresenceUpdate("composing", cleanJid).catch(() => {});
      const caption =
        `🎨 *DESAIN POSTER RESMI EXPEDIENT 43 (SIAP PUBLISH)* 🖼️\n\n` +
        `📌 *Agenda:* ${officialTitle}\n` +
        `✨ *Konsep:* ${blueprint.theme}\n` +
        `🔤 *Headline:* "${blueprint.copywriting.headline}"\n` +
        `📝 *Slogan:* "${blueprint.copywriting.subheadline}"\n` +
        `🏢 *Studio:* Expedient Creative Graphic Design (Ultra-HD 8K)\n\n` +
        `_Desain resmi sudah siap pakai & tinggal diunggah ke media sosial alumni!_ 🚀✨`;

      const res = await sock.sendMessage(
        cleanJid,
        {
          image: officialBuffer,
          caption,
        },
        { quoted: quotedMessage }
      );
      if (res?.key?.id) sentMessageIds.add(res.key.id);
      addLog(`📤 [POSTER-SENT] Poster resmi ${officialTitle} berhasil dikirim!`, "success");
      return true;
    }

    // 2. PEMBUATAN GAMBAR / POSTER AI ON-DEMAND DENGAN MASTERPIECE PROMPT ARCHITECT
    try {
      addLog(`🎨 [GENERATE-IMAGE] Merancang & membuat gambar AI untuk: "${rawPrompt}"...`);
      await sock.sendPresenceUpdate("composing", cleanJid).catch(() => {});

      // Kirim blueprint konsep desain & arahan artistik terlebih dahulu
      const blueprintText = formatBlueprintForWhatsApp(blueprint);
      await sendReply(cleanJid, blueprintText, quotedMessage);

      // Gunakan enhanced prompt arsitektur mahakarya dalam bahasa visual tingkat tinggi
      const enhancedQuery = encodeURIComponent(blueprint.enhancedPrompt);
      const rawEncoded = encodeURIComponent(rawPrompt.trim());
      const pollKey = process.env.POLLINATIONS_API_KEY ? `&key=${process.env.POLLINATIONS_API_KEY}` : "";

      const candidateUrls = [
        `https://image.pollinations.ai/prompt/${enhancedQuery}?width=1024&height=1024&nologo=true${pollKey}`,
        `https://image.pollinations.ai/prompt/${enhancedQuery}?width=768&height=1024&nologo=true`,
        `https://image.pollinations.ai/prompt/${enhancedQuery}?nologo=true`,
        `https://image.pollinations.ai/prompt/${rawEncoded}?width=768&height=768&nologo=true`,
      ];

      let imgBuffer: Buffer | null = null;
      for (const url of candidateUrls) {
        try {
          const imgRes = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(30000)
          });
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            if (buf.byteLength > 1000) {
              imgBuffer = buf;
              break;
            }
          }
        } catch (_) {}
      }

      if (imgBuffer) {
        const res = await sock.sendMessage(
          cleanJid,
          {
            image: imgBuffer,
            caption:
              `🎨 *HASIL DRAF DESAIN MAHASISWA STUDIO AI* 🖼️\n\n` +
              `📌 *Konsep:* "${blueprint.title}"\n` +
              `✨ *Style:* ${blueprint.theme}\n` +
              `🏢 *Studio:* Expedient Generation 43 AI Studio\n\n` +
              `_Dibuat otomatis menggunakan AI Masterpiece Prompt Architecture!_ 🚀✨`,
          },
          { quoted: quotedMessage }
        );
        if (res?.key?.id) sentMessageIds.add(res.key.id);
        addLog(`📤 [IMAGE-SENT] Berhasil mengirim gambar AI ke ${cleanJid}`, "success");
        return true;
      }

      throw new Error("Layanan render gambar AI sedang padat");
    } catch (err: any) {
      addLog(`❌ [GENERATE-IMAGE-ERR] ${err.message}`, "error");
      await sendReply(
        cleanJid,
        `Maaf Sahabat desainer, server rendering AI sedang antre (${err.message}). ` +
        `Untuk agenda resmi (seperti *HUT TNI*, *Kesaktian Pancasila*, dan *Milad*), poster HD siap pakai sudah tersedia di galeri studio kita! 🎨🚀`,
        quotedMessage
      );
      return false;
    }
  };

  // Helper Generate & Kirim Voice Note / Suara (Google Text-to-Speech & WhatsApp PTT Audio)
  const generateAndSendVoiceNote = async (text: string, targetJid: string, quotedMessage?: any) => {
    const cleanJid = targetJid.replace(/:\d+@/, "@");
    try {
      addLog(`🎙️ [GENERATE-VOICE] Mengonversi teks ke rekaman suara: "${text.slice(0, 45)}..."`);
      await sock.sendPresenceUpdate("recording", cleanJid).catch(() => {});

      // Bersihkan teks dari format markdown/bintang agar intonasi suara jernih
      const cleanText = text.replace(/[*_~`]/g, "").slice(0, 250).trim();
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=id&client=tw-ob`;

      const ttsRes = await fetch(ttsUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!ttsRes.ok) throw new Error(`HTTP ${ttsRes.status}`);
      const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());

      const res = await sock.sendMessage(
        cleanJid,
        {
          audio: audioBuffer,
          mimetype: "audio/mp4",
          ptt: true, // ptt: true menghasilkan Voice Note asli dengan ikon mic hijau di WhatsApp!
        },
        { quoted: quotedMessage }
      );
      if (res?.key?.id) sentMessageIds.add(res.key.id);
      addLog(`📤 [VOICE-SENT] Berhasil mengirim Voice Note ke ${cleanJid}`, "success");
      return true;
    } catch (err: any) {
      addLog(`❌ [GENERATE-VOICE-ERR] ${err.message}`, "error");
      await sendReply(cleanJid, `Maaf Sahabat, konversi suara belum dapat dikirimkan (${err.message}).`, quotedMessage);
      return false;
    }
  };

  let pairingCodeRequested = false;

  sock.ev.on("creds.update", async () => {
    await saveCreds();
    backupSessionToSupabase(AUTH_FOLDER).catch(() => {});
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // 1. Jika mode pairing aktif via argumen
    if (qr && pairingPhoneArg && !sock.authState.creds.registered && !pairingCodeRequested) {
      pairingCodeRequested = true;
      const cleanPhone = pairingPhoneArg.replace(/\D/g, "");
      addLog(`⏳ Meminta Kode Pairing WhatsApp untuk nomor: ${cleanPhone}...`, "info");
      try {
        const code = await sock.requestPairingCode(cleanPhone);
        currentPairingCode = code;
        gatewayStatus = "qr_ready";
        addLog(`🔑 KODE PAIRING WHATSAPP: 👉 ${code} 👈`, "success");
      } catch (err: any) {
        addLog(`❌ Gagal meminta pairing code: ${err.message}`, "error");
      }
    }
    // 2. Jika ada QR code
    else if (qr) {
      gatewayStatus = "qr_ready";
      try {
        currentQrDataUrl = await QRCode.toDataURL(qr, { scale: 8, margin: 2 });
      } catch (_) {}

      try {
        qrcode.setErrorLevel("L");
        qrcode.generate(qr, { small: true });
      } catch (_) {}

      addLog("📲 QR Code WhatsApp siap di-scan via Web Dashboard atau terminal!", "warn");
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;
      const isForbidden = statusCode === 403 || statusCode === 401;
      const isRestartRequired = statusCode === DisconnectReason.restartRequired || statusCode === 515;

      lastDisconnectInfo = `Status: ${statusCode || "unknown"}`;
      activeUser = null;
      gatewayStatus = isLoggedOut || isForbidden ? "disconnected" : "connecting";

      addLog(`⚠️ WhatsApp terputus (code: ${statusCode}).`, "warn");

      try {
        sock.ev.removeAllListeners("connection.update");
        sock.ev.removeAllListeners("messages.upsert");
        sock.ev.removeAllListeners("creds.update");
        sock.ws?.close();
      } catch (_) {}

      if (isRestartRequired) {
        addLog("⚡ WhatsApp meminta restart sesi (Handshake berhasil!). Menyambungkan ulang...", "info");
        setTimeout(() => startBaileysGateway(), 1000);
        return;
      }

      if (isLoggedOut || isForbidden) {
        addLog(`❌ Sesi WhatsApp terputus/logout (code: ${statusCode}). Membersihkan sesi lama dan membuat QR Code baru...`, "error");
        currentQrDataUrl = "";
        gatewayStatus = "connecting";

        try {
          if (fs.existsSync(AUTH_FOLDER)) {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          }
        } catch (_) {}

        // Hapus cadangan sesi kedaluwarsa di Supabase Storage
        try {
          const supabase = createAdminClient();
          supabase.storage.from("wa-session-backup").remove(["wa_session.gz"]).catch(() => {});
        } catch (_) {}

        // Restart Baileys dengan folder kosong agar QR Code baru langsung dipancarkan ke dashboard
        setTimeout(() => startBaileysGateway(), 1500);
        return;
      }

      if (isReconnecting) return;
      isReconnecting = true;
      addLog("🔄 Menghubungkan ulang dalam 3 detik...", "info");
      setTimeout(async () => {
        try {
          await startBaileysGateway();
        } finally {
          isReconnecting = false;
        }
      }, 3000);
    } else if (connection === "open") {
      isReconnecting = false;
      gatewayStatus = "connected";
      activeUser = {
        id: sock.user?.id || "Connected",
        name: sock.user?.name || "Expedient Generation",
        lid: sock.user?.lid,
      };
      currentQrDataUrl = "";
      currentPairingCode = "";

      addLog(`✅ [CONNECTED] WhatsApp Bot BERHASIL TERHUBUNG! Device: ${sock.user?.id || "OK"}`, "success");

      // Cadangkan sesi ke Supabase Storage secara otomatis saat terhubung
      backupSessionToSupabase(AUTH_FOLDER).catch(() => {});
    }
  });

  // ===========================================================================
  // LISTENER PESAN MASUK (MESSAGES.UPSERT)
  // ===========================================================================
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // Tangani baik 'notify' (pesan baru dari orang lain) maupun 'append' (pesan dari HP bot / self-chat / saat WA sedang dibuka)
    if (type !== "notify" && type !== "append") return;

    for (const m of messages) {
      try {
        const msgId = m.key.id;
        if (msgId && sentMessageIds.has(msgId)) {
          continue;
        }

        const remoteJid = m.key.remoteJid || "";
        if (!m.message || remoteJid === "status@broadcast") continue;

        // Cegah eksekusi ulang pesan lama dari sinkronisasi riwayat (> 120 detik)
        const msgTimestamp = Number(m.messageTimestamp || 0);
        const nowSec = Math.floor(Date.now() / 1000);
        if (msgTimestamp && nowSec - msgTimestamp > 120) {
          continue;
        }

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
        const botLid = sock.user?.lid ? sock.user.lid.split(":")[0].replace(/\D/g, "") : "";
        const botUserId = sock.user?.id ? sock.user.id.split(":")[0].replace(/\D/g, "") : "";
        const cleanRemote = remoteJid.replace(/:\d+@/, "@").replace(/\D/g, "");

        // Deteksi chat ke nomor sendiri (Self-Chat / Catatan ke diri sendiri / Message Yourself)
        const isSelfChat = !isGroup && (
          cleanRemote.includes(botShortPhone) ||
          cleanRemote.includes(botPhone) ||
          (botLid && cleanRemote.includes(botLid)) ||
          (botUserId && cleanRemote.includes(botUserId)) ||
          (m.key.participant && m.key.participant === remoteJid) ||
          (sock.user?.id && remoteJid.includes(sock.user.id.split(":")[0])) ||
          (sock.user?.lid && remoteJid.includes(sock.user.lid.split(":")[0]))
        );

        if (isSelfChat) {
          senderPhone = botPhone;
        }

        const rawMsg = m.message;
        const msgContent = (normalizeMessageContent(extractMessageContent(rawMsg) || rawMsg) || {}) as proto.IMessage;

        const messageText =
          msgContent.conversation ||
          msgContent.extendedTextMessage?.text ||
          msgContent.imageMessage?.caption ||
          msgContent.videoMessage?.caption ||
          msgContent.documentMessage?.caption ||
          msgContent.buttonsResponseMessage?.selectedDisplayText ||
          msgContent.templateButtonReplyMessage?.selectedId ||
          msgContent.listResponseMessage?.title ||
          msgContent.editedMessage?.message?.protocolMessage?.editedMessage?.conversation ||
          msgContent.editedMessage?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
          "";

        const lower = messageText.trim().toLowerCase();

        // Deteksi apakah pesan yang dikirim dari HP bot adalah perintah pengujian dari pemilik bot
        const isOwnerCommand =
          lower.startsWith("/") ||
          lower.startsWith("!") ||
          lower.startsWith("bot ") ||
          lower.startsWith("min ") ||
          lower === "ping" ||
          lower === "tes" ||
          lower === "halo" ||
          lower === "p";

        // Jangan proses pesan yang dikirim bot sendiri KECUALI:
        // 1. Pesan ke diri sendiri (isSelfChat)
        // 2. Perintah tes dari pemilik bot (isOwnerCommand)
        if (m.key.fromMe && !isSelfChat && !isOwnerCommand) {
          continue;
        }

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

        // Di grup: bot merespons jika di-mention ATAU jika pesan bot sebelumnya di-quote!
        const isDirectlyAddressed = isBotMentioned || isBotQuoted;

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

        const isImage = Boolean(msgContent.imageMessage || msgContent.documentMessage?.mimetype?.startsWith("image/"));
        const isSticker = Boolean(msgContent.stickerMessage);
        const isAudio = Boolean(msgContent.audioMessage);
        const isVideo = Boolean(msgContent.videoMessage || msgContent.ptvMessage);
        const isDocument = Boolean(msgContent.documentMessage && !msgContent.documentMessage?.mimetype?.startsWith("image/"));
        const hasMedia = isImage || isSticker || isAudio || isVideo || isDocument;

        addLog(`📩 [INCOMING] ${senderName} (${senderPhone}) [Grup: ${isGroup}]: "${messageText.slice(0, 50)}"`);

        // 1. PENANGANAN MEDIA LANGSUNG
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

          const shouldRespond = isGroup
            ? isDirectlyAddressed || shouldProcessGroupMedia(remoteJid, category, messageText)
            : true;

          if (shouldRespond) {
            addLog(`🎨 [MEDIA-PROCESS] Memproses media ${category} dari ${senderName}...`);
            await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});

            try {
              const unboxedMsg = { key: m.key, message: msgContent };
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

              await sendReply(remoteJid, multiRes.replyText, m);

              if (remoteJid.includes("120363388633880584") || remoteJid === getCommunityGroupId()) {
                recordCommunityGroupActivity(`[Media ${category}] ${messageText}`, senderName, senderPhone).catch(() => {});
              }
            } catch (mediaErr: any) {
              addLog(`❌ [MEDIA-ERR] ${mediaErr.message}`, "error");
              await sendReply(remoteJid, "Maaf Sahabat, media belum dapat dianalisis saat ini. Silakan kirimkan kembali!");
            }
            continue;
          }
        }

        // 2. PENANGANAN MEDIA YANG DI-QUOTE
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

          addLog(`🎨 [QUOTED-MEDIA] Menganalisis media lama ${category}...`);
          await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});

          try {
            const fakeQuotedMsgObj = {
              key: { remoteJid, id: contextInfo?.stanzaId, participant: contextInfo?.participant },
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
            addLog(`⚠️ [QUOTED-ERR] ${err.message}`, "warn");
          }
        }

        // 3. PENANGANAN PESAN TEKS & EMOJI
        if (!messageText) continue;

        // Bersihkan mention bot (@105240321908772, @85151771289, @bot, dll) untuk deteksi perintah
        const cleanTextWithoutMention = messageText
          .replace(/@\d+/g, "")
          .replace(/@(bot|min|admin|expedient)/gi, "")
          .trim();
        const cleanLower = cleanTextWithoutMention.toLowerCase();

        // =====================================================================
        // FITUR AI GENERATOR: GAMBAR / POSTER & SUARA (Voice Note / VN)
        // =====================================================================
        const isPosterOrImageRequest =
          // Perintah Prefix
          cleanLower.startsWith("/gambar") ||
          cleanLower.startsWith("!gambar") ||
          cleanLower.startsWith("/image") ||
          cleanLower.startsWith("!image") ||
          cleanLower.startsWith("/draw") ||
          cleanLower.startsWith("!draw") ||
          cleanLower.startsWith("/poster") ||
          cleanLower.startsWith("!poster") ||
          cleanLower.startsWith("/desain") ||
          cleanLower.startsWith("!desain") ||
          cleanLower.startsWith("/design") ||
          cleanLower.startsWith("!design") ||
          cleanLower.startsWith("/flyer") ||
          cleanLower.startsWith("/banner") ||
          // Kalimat Aksi Pembuatan Poster / Desain
          cleanLower.includes("buatkan poster") ||
          cleanLower.includes("bikin poster") ||
          cleanLower.includes("buat poster") ||
          cleanLower.includes("bikinin poster") ||
          cleanLower.includes("buatkan desain") ||
          cleanLower.includes("bikin desain") ||
          cleanLower.includes("buat desain") ||
          cleanLower.includes("bikinin desain") ||
          cleanLower.includes("buatkan design") ||
          cleanLower.includes("bikin design") ||
          cleanLower.includes("buatkan gambar") ||
          cleanLower.includes("bikin gambar") ||
          cleanLower.includes("generate gambar") ||
          cleanLower.includes("generate poster") ||
          cleanLower.includes("generate desain") ||
          cleanLower.includes("desainkan") ||
          cleanLower.includes("designkan") ||
          cleanLower.includes("lukiskan") ||
          cleanLower.includes("gambarin") ||
          cleanLower.includes("kamu buatin") ||
          // Permintaan melihat / mengecek poster di Grup Desain atau saat bot di-tag
          ((isDesignGroupId(remoteJid) || isDirectlyAddressed) && (
            cleanLower.includes("mana poster") ||
            cleanLower.includes("lihat poster") ||
            cleanLower.includes("kirim poster") ||
            cleanLower.includes("draf poster") ||
            cleanLower === "mana liat" ||
            cleanLower === "mana lihat" ||
            cleanLower === "mana drafnya"
          ));

        if (isPosterOrImageRequest && (isGroup ? isDirectlyAddressed || isDesignGroupId(remoteJid) || shouldGroupBotRespond(messageText) : true)) {
          let prompt = cleanTextWithoutMention
            .replace(/^(\/gambar|\!gambar|\/image|\!image|\/draw|\!draw|\/poster|\!poster|\/desain|\!desain|\/design|\!design|\/flyer|\/banner)\s*/i, "")
            .replace(/^(tolong\s+)?(buatkan|bikin|bikinin|buat|generate|desainkan|designkan|lukiskan|gambarin|kamu buatin)\s+(poster|desain|design|flyer|banner|gambar)?\s*(untuk|tentang|tema)?\s*/i, "")
            .replace(/^(mana|lihat|kirim)\s+(poster|desain|draf)?\s*(untuk|tentang|tema)?\s*/i, "")
            .trim();

          // Jika teks prompt masih kosong atau pengguna hanya bilang "mana liat" / "kamu buatin", default ke agenda HUT TNI
          if (!prompt || prompt.toLowerCase() === "mana liat" || prompt.toLowerCase() === "kamu buatin") {
            prompt = "HUT TNI";
          }

          if (prompt) {
            await sendReply(remoteJid, `🎨 Sedang menyiapkan & merancang desain poster *"${prompt}"*... Tunggu sebentar ya Sahabat desainer! ⏳✨`, m);
            await generateAndSendImage(prompt, remoteJid, m);
            continue;
          }
        }

        const isVoiceGenRequest =
          lower.startsWith("/vn ") ||
          lower.startsWith("!vn ") ||
          lower.startsWith("/suara ") ||
          lower.startsWith("!suara ") ||
          lower.startsWith("/voice ") ||
          lower.startsWith("!voice ") ||
          lower.startsWith("bicara:") ||
          lower.startsWith("ngomong:");

        if (isVoiceGenRequest && (isGroup ? isDirectlyAddressed || shouldGroupBotRespond(messageText) : true)) {
          const voiceText = messageText
            .replace(/^(\/vn|!vn|\/suara|!suara|\/voice|!voice|bicara:|ngomong:)\s*/i, "")
            .trim();
          if (voiceText) {
            await generateAndSendVoiceNote(voiceText, remoteJid, m);
            continue;
          }
        }

        if (isGroup) {
          // CABANG A: GRUP DESAIN
          if (isDesignGroupId(remoteJid)) {
            if (isDirectlyAddressed || shouldDesignBotRespond(messageText)) {
              addLog(`🖌️ [DESIGN-GROUP] Membalas di Grup Desain...`);
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
          // CABANG B: GRUP ANGKATAN / KOMUNITAS
          else {
            if (isDirectlyAddressed || shouldGroupBotRespond(messageText)) {
              addLog(`👥 [COMMUNITY-GROUP] Membalas di Grup Komunitas...`);
              await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});
              const replyText = await generateIntelligentCohortReply({
                messageText,
                senderPhone,
                senderName,
                isGroup: true,
                groupId: remoteJid,
              });
              const wantsVoiceReply =
                lower.includes("pakai vn") ||
                lower.includes("pakai suara") ||
                lower.includes("balas vn") ||
                lower.includes("kirim vn");

              if (wantsVoiceReply) {
                await generateAndSendVoiceNote(replyText, remoteJid, m);
              } else {
                await sendReply(remoteJid, replyText, m);
              }

              if (remoteJid.includes("120363388633880584") || remoteJid === getCommunityGroupId()) {
                recordCommunityGroupActivity(messageText, senderName, senderPhone).catch(() => {});
              }
            } else {
              addLog(`ℹ️ [SKIP-GROUP] Pesan bukan untuk bot (tidak di-tag / tidak memanggil bot)`);
            }
          }
        } else {
          // CABANG C: CHAT PRIBADI
          addLog(`💬 [PRIVATE-CHAT] Menerima chat pribadi dari ${senderName} (${senderPhone})`);
          await sock.sendPresenceUpdate("composing", remoteJid).catch(() => {});

          const adminPhoneEnv = (process.env.ADMIN_WA_PHONE || "6282142877426").replace(/\D/g, "");
          const isSenderAdmin =
            senderPhone === adminPhoneEnv ||
            senderPhone.endsWith(adminPhoneEnv.slice(-9)) ||
            adminPhoneEnv.endsWith(senderPhone.slice(-9));

          if (isSenderAdmin && (messageText.startsWith("!") || messageText.startsWith("/fix") || messageText.toLowerCase().includes("remediasi"))) {
            const remResult = await handleAdminAutoRemediation(senderPhone, messageText);
            if (remResult.action !== "not_a_sentinel_command") {
              await sendReply(remoteJid, remResult.message, m);
              continue;
            }
          }

          const replyText = await generateIntelligentCohortReply({
            messageText,
            senderPhone,
            senderName,
            isGroup: false,
          });

          const wantsVoiceReply =
            lower.includes("pakai vn") ||
            lower.includes("pakai suara") ||
            lower.includes("balas vn") ||
            lower.includes("kirim vn");

          if (wantsVoiceReply) {
            await generateAndSendVoiceNote(replyText, remoteJid, m);
          } else {
            await sendReply(remoteJid, replyText, m);
          }
        }
      } catch (msgErr: any) {
        addLog(`❌ [BAILEYS-MSG-ERR] ${msgErr.message}`, "error");
      }
    }
  });

  return sock;
}

// =============================================================================
// HTTP SERVER & WEB DASHBOARD (Dijalankan SEKALI di Root Level, Port 10000 / $PORT)
// =============================================================================
const HTTP_PORT = parseInt(process.env.PORT || process.env.GATEWAY_PORT || "10000", 10);

const healthServer = http.createServer(async (req, res) => {
  const url = req.url || "/";

  // 1. JSON Health Check Endpoint untuk Render
  if (url === "/health" || url === "/ping") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "online",
        waStatus: gatewayStatus,
        device: activeUser?.id || null,
        name: activeUser?.name || null,
        qrReady: Boolean(currentQrDataUrl),
        pairingCode: currentPairingCode || null,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  // 2. Real-time Status API untuk Polling Frontend
  if (url === "/api/status") {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(
      JSON.stringify({
        gatewayStatus,
        activeUser,
        currentQrDataUrl,
        currentPairingCode,
        lastDisconnectInfo,
        uptimeSeconds: Math.round(process.uptime()),
        logs: activityLogs.slice(-40),
      })
    );
    return;
  }

  // 3. API Meminta Pairing Code On-Demand
  if (url === "/api/pair" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const parsed = JSON.parse(body || "{}");
        const phone = (parsed.phone || "6285151771289").replace(/\D/g, "");
        if (!currentSock) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: false, error: "Socket belum siap" }));
          return;
        }

        addLog(`⏳ Permintaan kode pairing untuk nomor: ${phone}...`);
        const code = await currentSock.requestPairingCode(phone);
        currentPairingCode = code;
        addLog(`🔑 KODE PAIRING BERHASIL: 👉 ${code} 👈`, "success");

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, code }));
      } catch (err: any) {
        addLog(`❌ Gagal request pairing code: ${err.message}`, "error");
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 4. API Reset Sesi & Paksa Terbitkan QR Baru
  if (url === "/api/reset" && req.method === "POST") {
    addLog("🔄 Permintaan reset sesi WhatsApp manual diterima...", "warn");
    try {
      if (currentSock) {
        try {
          currentSock.ev.removeAllListeners("connection.update");
          currentSock.ev.removeAllListeners("messages.upsert");
          currentSock.ev.removeAllListeners("creds.update");
          currentSock.ws?.close();
        } catch (_) {}
      }

      currentQrDataUrl = "";
      currentPairingCode = "";
      activeUser = null;
      gatewayStatus = "connecting";

      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
      }

      try {
        const supabase = createAdminClient();
        await supabase.storage.from("wa-session-backup").remove(["wa_session.gz"]);
      } catch (_) {}

      setTimeout(() => startBaileysGateway(), 1000);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Sesi WhatsApp berhasil dibersihkan. Memuat QR Code baru..." }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 5. Web Dashboard Visual (Dark Mode Premium)
  if (url === "/" || url === "/qr" || url === "/dashboard") {
    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Expedient 43 - WhatsApp Bot Gateway</title>
  <style>
    :root {
      --bg: #0b141a;
      --card: #111b21;
      --border: #222e35;
      --text: #e9edef;
      --text-muted: #8696a0;
      --primary: #00a884;
      --primary-hover: #06cf9c;
      --danger: #ef4444;
      --warning: #f59e0b;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px;
    }
    .container {
      width: 100%;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .header {
      text-align: center;
      padding: 12px 0;
    }
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .header p {
      font-size: 14px;
      color: var(--text-muted);
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .status-connected { background: rgba(0, 168, 132, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); }
    .status-qr { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
    .status-connecting { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .status-disconnected { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    
    .qr-box {
      text-align: center;
      margin: 16px 0;
    }
    .qr-img {
      background: #fff;
      padding: 14px;
      border-radius: 14px;
      display: inline-block;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      width: 260px;
      height: 260px;
    }
    .instructions {
      background: #1f2c34;
      border-radius: 12px;
      padding: 16px;
      font-size: 13px;
      color: #d1d7db;
      line-height: 1.6;
      margin-top: 14px;
    }
    .instructions ol { padding-left: 20px; }
    .instructions li { margin-bottom: 6px; }

    .terminal {
      background: #000;
      border: 1px solid #222e35;
      border-radius: 12px;
      padding: 14px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 12px;
      max-height: 260px;
      overflow-y: auto;
      color: #a0aec0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .log-line { display: flex; gap: 8px; }
    .log-time { color: #4a5568; flex-shrink: 0; }
    .log-success { color: #48bb78; }
    .log-warn { color: #ecc94b; }
    .log-error { color: #f56565; }
    .log-info { color: #cbd5e0; }

    .form-pairing {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .input-phone {
      flex: 1;
      background: #1f2c34;
      border: 1px solid #2a3942;
      border-radius: 8px;
      padding: 10px 14px;
      color: #fff;
      font-size: 14px;
      outline: none;
    }
    .input-phone:focus { border-color: var(--primary); }
    .btn {
      background: var(--primary);
      color: #0b141a;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn:hover { background: var(--primary-hover); }
    .pairing-display {
      background: #202c33;
      border: 2px dashed #00a884;
      border-radius: 10px;
      padding: 14px;
      text-align: center;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #25d366;
      margin-top: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 Expedient 43 Gateway</h1>
      <p>Self-Hosted WhatsApp Bot &bull; 24/7 Cloud Runner on Render</p>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
        <div id="statusBadge" class="status-badge status-connecting" style="margin-bottom: 0;">
          <span id="statusDot">●</span> <span id="statusText">Memeriksa status...</span>
        </div>
        <button onclick="resetSession()" class="btn" style="background: #1f2c34; color: #a0aec0; border: 1px solid #2a3942; font-size: 12px; padding: 6px 14px;">
          🔄 Reset Sesi / Scan QR Baru
        </button>
      </div>

      <div id="connectedView" style="display: none;">
        <h3 style="color: #25d366; margin-bottom: 8px;">✅ Bot Aktif & Siap Digunakan</h3>
        <p style="color: var(--text-muted); font-size: 14px; line-height: 1.6;">
          Akun WhatsApp bot berhasil tersambung. Bot akan membalas secara instan di:
        </p>
        <ul style="margin: 12px 0 16px 20px; font-size: 14px; color: #d1d7db; line-height: 1.6;">
          <li><b>Chat Pribadi:</b> Balas otomatis semua pesan alumni / admin.</li>
          <li><b>Grup WhatsApp:</b> Balas saat di-mention (@bot) atau dipanggil namanya.</li>
          <li><b>Multimodal:</b> Menganalisis gambar, stiker, VN, dan video via Gemini AI.</li>
        </ul>
        <div style="background: #182229; border: 1px solid #222e35; border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <h4 style="color: #00a884; font-size: 13px; margin-bottom: 8px;">✨ Panduan Fitur Media & Generator:</h4>
          <div style="display: grid; grid-template-columns: 1fr; gap: 6px; font-size: 12px; color: #d1d7db;">
            <div>🎨 <b>Generate Gambar:</b> Ketik <code>/gambar [deskripsi]</code> (contoh: <code>/gambar masjid megah di senja hari</code>)</div>
            <div>🎙️ <b>Generate Suara / VN:</b> Ketik <code>/vn [teks]</code> (contoh: <code>/vn assalamu'alaikum sahabat 43</code>)</div>
            <div>📷 <b>Baca Gambar & OCR:</b> Kirim foto apa saja (baca struk Baitul Maal, baca teks foto, ulas poster desain)</div>
            <div>🎧 <b>Baca Voice Note (VN):</b> Kirim pesan suara, bot akan mendengarkan, menulis transkrip, dan membalas</div>
            <div>🎥 <b>Baca Video:</b> Kirim video / video bulat (PTV), bot akan menganalisis adegan & suara lalu merespons</div>
            <div>🎭 <b>Baca Stiker:</b> Kirim stiker WhatsApp, bot paham ekspresi meme/karakter stiker tersebut!</div>
          </div>
        </div>

        <div style="background: #1f2c34; border-radius: 10px; padding: 12px; font-size: 13px;">
          <div><b>Device JID:</b> <span id="deviceJid">-</span></div>
          <div style="margin-top: 4px;"><b>Nama Bot:</b> <span id="botName">-</span></div>
          <div style="margin-top: 4px;"><b>Uptime:</b> <span id="uptimeText">-</span></div>
        </div>
      </div>

      <div id="qrView" style="display: none;">
        <h3 style="color: #fbbf24; margin-bottom: 6px;">📲 Tautkan Perangkat WhatsApp</h3>
        <p style="color: var(--text-muted); font-size: 14px;">
          Pindai kode QR di bawah menggunakan aplikasi WhatsApp di HP Anda:
        </p>

        <div class="qr-box">
          <img id="qrImage" class="qr-img" src="" alt="WhatsApp QR Code" />
        </div>

        <div class="instructions">
          <ol>
            <li>Buka aplikasi <b>WhatsApp</b> di HP Anda</li>
            <li>Ketuk <b>Titik Tiga</b> (Setelan) &rarr; pilih <b>Perangkat Tertaut</b></li>
            <li>Ketuk <b>Tautkan Perangkat</b> lalu arahkan kamera ke kode QR di atas</li>
          </ol>
        </div>

        <div style="margin-top: 20px; border-top: 1px solid #222e35; padding-top: 16px;">
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
            Atau minta <b>Kode Pairing (8 Digit)</b> jika tidak bisa scan kamera:
          </p>
          <div class="form-pairing">
            <input type="text" id="phoneInput" class="input-phone" placeholder="Contoh: 6285151771289" value="6285151771289" />
            <button id="pairBtn" class="btn" onclick="requestPairing()">Minta Kode</button>
          </div>
          <div id="pairingCodeBox" class="pairing-display" style="display: none;"></div>
        </div>
      </div>

      <div id="connectingView" style="display: none; text-align: center; padding: 30px 0;">
        <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
        <h3>Sedang Menghubungkan ke WhatsApp...</h3>
        <p style="color: var(--text-muted); font-size: 14px; margin-top: 6px;">
          Menunggu handshake socket & pemulihan sesi cloud.
        </p>
      </div>
    </div>

    <div class="card">
      <h3 style="font-size: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
        <span>📜 Terminal Log Realtime</span>
        <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;">Auto-refresh tiap 3 detik</span>
      </h3>
      <div id="terminalBox" class="terminal">
        <div class="log-line"><span class="log-time">[Init]</span> Memuat event gateway...</div>
      </div>
    </div>
  </div>

  <script>
    async function fetchStatus() {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) return;
        const data = await res.json();

        const badge = document.getElementById("statusBadge");
        const statusText = document.getElementById("statusText");
        const connectedView = document.getElementById("connectedView");
        const qrView = document.getElementById("qrView");
        const connectingView = document.getElementById("connectingView");

        badge.className = "status-badge";

        if (data.gatewayStatus === "connected") {
          badge.classList.add("status-connected");
          statusText.textContent = "TERHUBUNG (Online)";
          connectedView.style.display = "block";
          qrView.style.display = "none";
          connectingView.style.display = "none";

          document.getElementById("deviceJid").textContent = data.activeUser?.id || "Connected";
          document.getElementById("botName").textContent = data.activeUser?.name || "Expedient Generation";
          
          const mins = Math.floor(data.uptimeSeconds / 60);
          const secs = data.uptimeSeconds % 60;
          document.getElementById("uptimeText").textContent = mins + " menit " + secs + " detik";
        } else if (data.gatewayStatus === "qr_ready" && data.currentQrDataUrl) {
          badge.classList.add("status-qr");
          statusText.textContent = "MENUNGGU SCAN QR";
          connectedView.style.display = "none";
          qrView.style.display = "block";
          connectingView.style.display = "none";

          document.getElementById("qrImage").src = data.currentQrDataUrl;
          if (data.currentPairingCode) {
            const pBox = document.getElementById("pairingCodeBox");
            pBox.textContent = data.currentPairingCode;
            pBox.style.display = "block";
          }
        } else if (data.gatewayStatus === "disconnected") {
          badge.classList.add("status-disconnected");
          statusText.textContent = "TERPUTUS (401)";
          connectedView.style.display = "none";
          qrView.style.display = "none";
          connectingView.style.display = "block";
          const h3 = document.querySelector("#connectingView h3");
          const p = document.querySelector("#connectingView p");
          if (h3) h3.textContent = "Sesi Terputus dari WhatsApp (401)";
          if (p) p.textContent = "Sesi lama kedaluwarsa. Sistem sedang membersihkan cache dan memuat QR Code baru secara otomatis...";
        } else {
          badge.classList.add("status-connecting");
          statusText.textContent = "MENYAMBUNGKAN...";
          connectedView.style.display = "none";
          qrView.style.display = "none";
          connectingView.style.display = "block";
          const h3 = document.querySelector("#connectingView h3");
          const p = document.querySelector("#connectingView p");
          if (h3) h3.textContent = "Sedang Menghubungkan ke WhatsApp...";
          if (p) p.textContent = "Menunggu handshake socket & pemulihan sesi cloud.";
        }

        // Render Logs
        if (data.logs && data.logs.length > 0) {
          const tBox = document.getElementById("terminalBox");
          tBox.innerHTML = data.logs.map(l => {
            let cls = "log-info";
            if (l.level === "success") cls = "log-success";
            if (l.level === "warn") cls = "log-warn";
            if (l.level === "error") cls = "log-error";
            return '<div class="log-line"><span class="log-time">[' + l.time + ']</span> <span class="' + cls + '">' + escapeHtml(l.msg) + '</span></div>';
          }).join("");
          tBox.scrollTop = tBox.scrollHeight;
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }

    function escapeHtml(str) {
      return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    async function requestPairing() {
      const phone = document.getElementById("phoneInput").value.trim();
      if (!phone) return alert("Masukkan nomor telepon");
      const btn = document.getElementById("pairBtn");
      btn.disabled = true;
      btn.textContent = "Meminta...";

      try {
        const res = await fetch("/api/pair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        });
        const data = await res.json();
        if (data.success && data.code) {
          const pBox = document.getElementById("pairingCodeBox");
          pBox.textContent = data.code;
          pBox.style.display = "block";
        } else {
          alert("Gagal: " + (data.error || "Gagal meminta kode pairing"));
        }
      } catch (e) {
        alert("Error: " + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = "Minta Kode";
      }
    }

    async function resetSession() {
      if (!confirm("Reset sesi WhatsApp dan buat QR Code baru sekarang?")) return;
      try {
        const res = await fetch("/api/reset", { method: "POST" });
        const data = await res.json();
        alert(data.message || "Sesi sedang dibersihkan...");
        fetchStatus();
      } catch (e) {
        alert("Gagal reset: " + e.message);
      }
    }

    fetchStatus();
    setInterval(fetchStatus, 3000);
  </script>
</body>
</html>`;

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

healthServer.listen(HTTP_PORT, "0.0.0.0", () => {
  addLog(`🌐 [WEB-DASHBOARD] Aktif di 0.0.0.0:${HTTP_PORT} (Render Ready)`);
});

// Jalankan gateway Baileys
startBaileysGateway().catch((err) => {
  addLog(`❌ [BAILEYS-FATAL] ${err.message}`, "error");
});
