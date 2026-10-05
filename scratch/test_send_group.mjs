import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import WebSocket from "ws";
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = WebSocket;
}

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} from "@whiskeysockets/baileys";
import pino from "pino";
import * as path from "path";
import * as fs from "fs";

import { getDeveloperSupportMessage } from "../src/lib/whatsapp/developerSupport.ts";

async function testSendQRIS() {
  const authFolder = path.join(process.cwd(), ".baileys_auth");
  console.log("Using auth folder:", authFolder);

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();
  console.log(`Baileys version: ${version.join(".")}`);

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false,
    connectTimeoutMs: 25000,
    keepAliveIntervalMs: 15000,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    console.log("Connection update:", connection || "state changed");

    if (qr) {
      console.log("QR received! Sesi belum authenticated atau perlu scan QR.");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      console.log("Connection closed with statusCode:", statusCode);
      process.exit(1);
    }

    if (connection === "open") {
      console.log("✅ Baileys socket CONNECTED! User:", sock.user?.id);

      const targetGroup = process.env.WA_GROUP_COMMUNITY_ID || "120363388633880584@g.us";
      const qrisPath = path.join(process.cwd(), "public", "images", "qris-developer.png");
      const caption = getDeveloperSupportMessage();

      console.log(`Sending QRIS to group: ${targetGroup}...`);

      const qrisBuffer = fs.readFileSync(qrisPath);
      const res = await sock.sendMessage(targetGroup, {
        image: qrisBuffer,
        caption: caption,
      });

      console.log("🎉 SUCCESS! Message sent to group. Message ID:", res?.key?.id);
      
      // Wait a moment then exit
      setTimeout(() => {
        process.exit(0);
      }, 3000);
    }
  });
}

testSendQRIS().catch(console.error);
