/**
 * lib/whatsapp.ts
 * High-Reliability WhatsApp Gateway with Strict Anti-Ban Architecture.
 * Primary: Fonnte (Direct WhatsApp Web Gateway - Connected: 62895326383590).
 * Secondary: Meta WhatsApp Cloud API (Fallback).
 */

export async function sendWhatsAppMessage(target: string, message: string): Promise<boolean> {
  // 1. Normalisasi nomor telepon ke format internasional (628...)
  let num = String(target || "").replace(/\D/g, "");
  if (num.startsWith("0")) {
    num = "62" + num.substring(1);
  } else if (!num.startsWith("62")) {
    num = "62" + num;
  }

  // Anti-Ban Guard: Validasi nomor seluler Indonesia (628 + 8-12 digit angka)
  // Menghindari pengiriman ke nomor tidak valid yang bisa memicu penalti anti-spam WhatsApp
  if (!/^628[0-9]{8,12}$/.test(num)) {
    console.warn(`[WA-VALIDATION-SKIP] Nomor tidak valid diabaikan: ${num}`);
    return false;
  }

  const fonnteToken = (process.env.FONNTE_TOKEN || "").trim();

  // 1. PRIMARY: Fonnte API dengan Parameter Anti-Ban Resmi
  if (fonnteToken) {
    try {
      const params = new URLSearchParams();
      params.append("target", num);
      params.append("message", message);
      // Parameter Anti-Ban:
      // 1. delay: memberi jeda pengiriman 2 detik agar menyerupai ritme manusia
      params.append("delay", "2");
      // 2. typing: mengaktifkan simulasi status "sedang mengetik..." di WhatsApp penerima
      params.append("typing", "true");
      params.append("countryCode", "62");

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fonnteToken,
        },
        body: params,
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && Boolean(result.status)) {
        console.log(`[FONNTE-SUCCESS] Pesan WhatsApp terkirim ke ${num} | Status: ${result.detail || "Sent"}`);
        return true;
      }

      console.warn("[FONNTE-WARN] Respon Fonnte:", result.reason || result);
    } catch (fonnteErr) {
      console.error("[FONNTE-EXCEPTION]:", fonnteErr);
    }
  }

  // 2. SECONDARY FALLBACK: Meta WhatsApp Cloud API
  const metaPhoneId = process.env.META_WA_PHONE_NUMBER_ID || "";
  const metaToken = (process.env.META_WA_ACCESS_TOKEN || "").trim();

  if (metaPhoneId && metaToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: num,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.messages?.[0]?.id) {
        console.log(`[META-WA-SUCCESS] Pesan terkirim via Meta Cloud ke ${num}`);
        return true;
      }
    } catch (metaErr) {
      console.error("[META-WA-EXCEPTION]:", metaErr);
    }
  }

  console.error(`[WA-FAILED] Seluruh provider WhatsApp gagal mengirim ke ${num}`);
  return false;
}

/**
 * Broadcast Pesan WhatsApp dengan Sistem Anti-Ban Throttling
 * Mencegah pemblokiran akun dengan jeda dinamis (random human pacing 2.5s - 5s)
 */
export async function broadcastWhatsAppMessage(targets: string[], message: string): Promise<boolean> {
  if (!targets || targets.length === 0) return false;

  const normalizedTargets = targets
    .map((target) => {
      let num = String(target || "").replace(/\D/g, "");
      if (num.startsWith("0")) {
        num = "62" + num.substring(1);
      } else if (!num.startsWith("62")) {
        num = "62" + num;
      }
      return num;
    })
    .filter((num) => /^628[0-9]{8,12}$/.test(num));

  if (normalizedTargets.length === 0) return false;

  let successCount = 0;

  for (let i = 0; i < normalizedTargets.length; i++) {
    const num = normalizedTargets[i];

    // Variasi pesan kecil anti-fingerprint teks kembar
    const uniqueTag = `\n_Ref: EG-${Date.now().toString(36).slice(-4).toUpperCase()}_`;
    const safeMessage = message.includes("Ref:") ? message : `${message} ${uniqueTag}`;

    const sent = await sendWhatsAppMessage(num, safeMessage);
    if (sent) successCount++;

    // Anti-Ban Pacing: Jeda 2.5 - 4.5 detik antar pesan agar tidak terdeteksi bot blaster
    if (i < normalizedTargets.length - 1) {
      const delayMs = Math.floor(2500 + Math.random() * 2000);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return successCount > 0;
}
