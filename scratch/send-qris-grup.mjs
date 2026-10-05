/**
 * Script: Kirim QRIS Developer ke Grup WhatsApp
 * =============================================
 * Gunakan: node scratch/send-qris-grup.mjs [GROUP_JID]
 *
 * GROUP_JID contoh: 120363388633880584@g.us
 *
 * Script ini mengirim gambar QRIS langsung ke grup WhatsApp
 * via HTTP API gateway (lokal ATAU cloud Render.com).
 * Gambar dikirim dalam format base64 agar bekerja dari mana saja.
 */

import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Load env
const require = createRequire(import.meta.url);
try {
  const dotenv = require("dotenv");
  dotenv.config({ path: path.join(ROOT, ".env.local") });
  dotenv.config({ path: path.join(ROOT, ".env") });
} catch (_) {}

// ========================
// KONFIGURASI — Ubah sesuai kebutuhan!
// ========================

// URL Gateway: lokal atau Render.com
const GATEWAY_URL =
  process.env.GATEWAY_URL ||
  "https://expedient43-bot.onrender.com"; // << Render.com

// Secret key untuk autentikasi
const GATEWAY_SECRET =
  process.env.GATEWAY_SECRET ||
  process.env.ADMIN_WA_PHONE ||
  ""; // harus sama dengan env di Render!

// ID Grup tujuan (dari arg CLI atau env)
const GROUP_JID =
  process.argv[2] ||
  process.env.COMMUNITY_GROUP_ID ||
  process.env.WA_GROUP_ID ||
  "120363388633880584@g.us"; // ID grup komunitas default

// Path gambar QRIS
const QRIS_PATH = path.join(ROOT, "public", "images", "qris-developer.png");

// Caption pesan
const CAPTION =
  `\u2615 *Traktir Kopi & Dukungan Operasional Server*\n\n` +
  `Masya Allah, Sahabat Expedient 43 yang dermawan! \ud83e\udd32\u2728\n\n` +
  `Bagi sahabat yang ingin mentraktir secangkir kopi santai atau mendukung biaya operasional server & pengembangan website, silakan langsung scan kode QRIS di atas:\n\n` +
  `\ud83d\udcf1 *QRIS (Mendukung Seluruh Bank & E-Wallet):*\n` +
  `   \u2022 Bisa discan via BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay, dll.\n\n` +
  `Semoga setiap rupiah yang disalurkan menjadi amal jariyah, diganti oleh Allah dengan keberkahan rezeki yang berlipat ganda. Aamiin ya Rabbal 'Alamin. \u2615\ud83c\udf3f`;

// ========================
// MAIN LOGIC
// ========================
async function main() {
  console.log(`\n\ud83d\udce4 === Script Kirim QRIS ke Grup WhatsApp ===`);
  console.log(`   Gateway: ${GATEWAY_URL}`);
  console.log(`   Target Grup JID: ${GROUP_JID}`);

  // Pastikan file QRIS ada
  if (!fs.existsSync(QRIS_PATH)) {
    console.error(`\u274c File QRIS tidak ditemukan: ${QRIS_PATH}`);
    process.exit(1);
  }

  const qrisBuffer = fs.readFileSync(QRIS_PATH);
  const qrisBase64 = qrisBuffer.toString("base64");
  console.log(`\u2705 File QRIS ditemukan (${(qrisBuffer.byteLength / 1024).toFixed(1)} KB)`);

  // Cek status gateway dulu
  console.log(`\n\ud83d\udd0d Mengecek status gateway...`);
  try {
    const statusRes = await fetch(`${GATEWAY_URL}/health`, { signal: AbortSignal.timeout(15000) });
    if (!statusRes.ok) throw new Error(`HTTP ${statusRes.status}`);
    const statusData = await statusRes.json();
    console.log(`\u2705 Gateway online | WA Status: ${statusData.waStatus} | Device: ${statusData.device || "N/A"}`);
    if (statusData.waStatus !== "connected") {
      console.error(`\u274c WhatsApp bot belum terhubung (status: ${statusData.waStatus}).`);
      console.error(`   Pastikan bot sudah login dengan scan QR atau pairing code!`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`\u274c Gagal terhubung ke gateway: ${err.message}`);
    console.error(`   Gateway URL: ${GATEWAY_URL}`);
    process.exit(1);
  }

  // Kirim QRIS via API (dengan base64 agar bekerja dari mana saja)
  console.log(`\n\ud83d\udce4 Mengirim QRIS ke grup ${GROUP_JID} ...`);
  try {
    const payload = {
      jid: GROUP_JID,
      imageBase64: qrisBase64,
      caption: CAPTION,
      secret: GATEWAY_SECRET,
    };

    const sendRes = await fetch(`${GATEWAY_URL}/api/send-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    const data = await sendRes.json();
    if (data.success) {
      console.log(`\u2705 QRIS berhasil dikirim ke grup!`);
      console.log(`   Message ID: ${data.messageId}`);
    } else {
      console.error(`\u274c Gagal mengirim: ${data.error}`);
      if (data.error === "Unauthorized") {
        console.error(`   Hint: Periksa GATEWAY_SECRET di env, harus sama dengan yang di Render!`);
      }
      process.exit(1);
    }
  } catch (err) {
    console.error(`\u274c Error saat mengirim gambar: ${err.message}`);
    process.exit(1);
  }

  console.log(`\n\ud83c\udf89 Selesai! QRIS sudah terkirim ke grup WhatsApp Expedient 43.`);
}

main();
