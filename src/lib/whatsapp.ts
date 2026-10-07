/**
 * lib/whatsapp.ts
 * High-Reliability WhatsApp Gateway with Strict Anti-Ban Architecture.
 * Primary: Fonnte (Direct WhatsApp Web Gateway - Connected: 6285151771289).
 * Secondary: Meta WhatsApp Cloud API (Fallback).
 */

/**
 * Memeriksa apakah target adalah ID Grup WhatsApp (contoh: 120363028392819@g.us atau 628123-xxx@g.us)
 */
export function isWhatsAppGroup(target: string): boolean {
  if (!target) return false;
  const t = String(target).trim().toLowerCase();
  return (
    t.endsWith("@g.us") ||
    t.includes("@g.us") ||
    t.startsWith("group:") ||
    t.endsWith("@broadcast") ||
    t.includes("-")
  );
}

export function getOfficialGroupId(): string {
  return (process.env.WA_GROUP_OFFICIAL_ID || "120363407294140739@g.us").trim();
}

export function getCommunityGroupId(): string {
  return (process.env.WA_GROUP_COMMUNITY_ID || "120363388633880584@g.us").trim();
}

export function getDesignGroupId(): string {
  return (process.env.WA_GROUP_DESIGN_ID || "120363404648728200@g.us").trim();
}

export interface WhatsAppSendOptions {
  imageUrl?: string | null;
  imageBase64?: string | null;
  mentions?: string[];
}

export async function sendWhatsAppMessageWithDetail(
  target: string, 
  message: string,
  options?: WhatsAppSendOptions
): Promise<{ success: boolean; reason?: string; provider?: 'baileys' | 'fonnte' | 'meta' | 'none' }> {
  const isGroup = isWhatsAppGroup(target);
  let finalTarget = "";

  if (isGroup) {
    finalTarget = String(target).trim().replace(/^group:/i, "");
  } else {
    // 1. Normalisasi nomor telepon ke format internasional (628...)
    let num = String(target || "").replace(/\D/g, "");
    if (num.startsWith("0")) {
      num = "62" + num.substring(1);
    } else if (!num.startsWith("62")) {
      num = "62" + num;
    }

    // Anti-Ban Guard: Validasi nomor seluler Indonesia (628 + 8-12 digit angka)
    if (!/^628[0-9]{8,12}$/.test(num)) {
      const reason = `Nomor seluler tidak valid untuk format Indonesia (harus 628xxx): ${num}`;
      console.warn(`[WA-VALIDATION-SKIP] ${reason}`);
      return { success: false, reason, provider: 'none' };
    }
    finalTarget = num;
  }

  // =========================================================================
  // 1. PRIMARY: Self-Hosted Baileys Gateway (Render Cloud Server)
  // =========================================================================
  const gatewayUrl = (process.env.WA_GATEWAY_URL || "https://expedient43-bot.onrender.com").replace(/\/+$/, "");
  const adminPhone = (process.env.ADMIN_WA_PHONE || "6282142877426").replace(/\D/g, "");
  const gatewaySecret = process.env.GATEWAY_SECRET || adminPhone;
  let baileysError = "";

  if (gatewayUrl) {
    try {
      const targetJid = isGroup
        ? (finalTarget.includes("@") ? finalTarget : `${finalTarget}@g.us`)
        : (finalTarget.includes("@") ? finalTarget : `${finalTarget}@s.whatsapp.net`);

      const payload: Record<string, any> = {
        secret: gatewaySecret,
        jid: targetJid,
        text: message,
      };

      if (options?.imageUrl) payload.imageUrl = options.imageUrl;
      if (options?.imageBase64) payload.imageBase64 = options.imageBase64;
      if (options?.mentions && options.mentions.length > 0) payload.mentions = options.mentions;

      const response = await fetch(`${gatewayUrl}/api/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        console.log(`[BAILEYS-GATEWAY-SUCCESS] Pesan WhatsApp terkirim ke ${finalTarget} (${isGroup ? "GROUP" : "PERSONAL"}${options?.imageUrl ? " + GAMBAR" : ""})`);
        return { success: true, provider: 'baileys' };
      }
      baileysError = result.error || `HTTP ${response.status}`;
      console.warn(`[BAILEYS-GATEWAY-WARN] Respon Baileys Gateway:`, baileysError);
    } catch (bErr: any) {
      baileysError = bErr.message || "Baileys gateway timeout/network exception";
      console.warn(`[BAILEYS-GATEWAY-EXCEPTION]:`, baileysError);
    }
  }

  // =========================================================================
  // 2. SECONDARY: Fonnte API (Fallback)
  // =========================================================================
  const fonnteToken = (process.env.FONNTE_TOKEN || "").trim();
  let fonnteError = "";

  if (fonnteToken) {
    try {
      const params = new URLSearchParams();
      params.append("target", finalTarget);
      params.append("message", message);
      params.append("delay", "2");
      params.append("typing", "true");

      if (options?.imageUrl && typeof options.imageUrl === "string" && options.imageUrl.startsWith("http")) {
        params.append("url", options.imageUrl);
      }

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fonnteToken,
        },
        body: params,
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && Boolean(result.status)) {
        console.log(`[FONNTE-SUCCESS] Pesan WhatsApp terkirim ke ${finalTarget} (${isGroup ? "GROUP" : "PERSONAL"}${options?.imageUrl ? " + GAMBAR" : ""}) | Status: ${result.detail || "Sent"}`);
        return { success: true, provider: 'fonnte' };
      }

      fonnteError = result.reason || (typeof result === "string" ? result : JSON.stringify(result));
      console.warn("[FONNTE-WARN] Respon Fonnte:", fonnteError);
    } catch (fonnteErr: any) {
      fonnteError = fonnteErr.message || "Network exception";
      console.error("[FONNTE-EXCEPTION]:", fonnteErr);
    }
  } else {
    fonnteError = "FONNTE_TOKEN belum diset di environment";
  }

  // =========================================================================
  // 3. TERTIARY FALLBACK: Meta WhatsApp Cloud API (Hanya untuk pesan personal)
  // =========================================================================
  const metaPhoneId = process.env.META_WA_PHONE_NUMBER_ID || "";
  const metaToken = (process.env.META_WA_ACCESS_TOKEN || "").trim();
  let metaError = "";

  if (!isGroup && metaPhoneId && metaToken) {
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
          to: finalTarget,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.messages?.[0]?.id) {
        console.log(`[META-WA-SUCCESS] Pesan terkirim via Meta Cloud ke ${finalTarget}`);
        return { success: true, provider: 'meta' };
      }
      metaError = data?.error?.message || "Meta API error";
    } catch (metaErr: any) {
      metaError = metaErr.message || "Meta network exception";
      console.error("[META-WA-EXCEPTION]:", metaErr);
    }
  } else if (isGroup) {
    metaError = "Meta Cloud API tidak mendukung pengiriman ke WhatsApp Group";
  } else {
    metaError = "Kredensial Meta WhatsApp belum lengkap";
  }

  const finalReason = `Baileys: ${baileysError || 'Gagal'} | Fonnte: ${fonnteError || 'Gagal'} | Meta: ${metaError || 'Gagal'}`;
  console.error(`[WA-FAILED] Seluruh provider WhatsApp gagal mengirim ke ${finalTarget}: ${finalReason}`);
  return { success: false, reason: finalReason, provider: 'none' };
}

export async function sendWhatsAppMessage(
  target: string, 
  message: string,
  options?: WhatsAppSendOptions
): Promise<boolean> {
  const res = await sendWhatsAppMessageWithDetail(target, message, options);
  return res.success;
}

export async function sendWhatsAppGroupMessage(
  groupId: string,
  message: string,
  options?: WhatsAppSendOptions
): Promise<{ success: boolean; reason?: string }> {
  return await sendWhatsAppMessageWithDetail(groupId, message, options);
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

/**
 * Mengirim gambar/poster langsung ke Grup WhatsApp via Fonnte
 */
export async function sendWhatsAppGroupMedia(
  groupId: string,
  message: string,
  mediaUrl: string
): Promise<{ success: boolean; reason?: string }> {
  const gatewayUrl = (process.env.WA_GATEWAY_URL || "https://expedient43-bot.onrender.com").replace(/\/+$/, "");
  const adminPhone = (process.env.ADMIN_WA_PHONE || "6282142877426").replace(/\D/g, "");
  const gatewaySecret = process.env.GATEWAY_SECRET || adminPhone;

  // 1. PRIMARY: Baileys Render Gateway
  if (gatewayUrl) {
    try {
      const cleanJid = groupId.includes("@") ? groupId : `${groupId}@g.us`;
      const response = await fetch(`${gatewayUrl}/api/send-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: gatewaySecret,
          jid: cleanJid,
          imagePath: mediaUrl,
          caption: message,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        console.log(`[BAILEYS-MEDIA-SUCCESS] Media terkirim ke grup ${groupId}`);
        return { success: true };
      }
    } catch (_) {}
  }

  // 2. SECONDARY: Fonnte API (Fallback)
  const fonnteToken = (process.env.FONNTE_TOKEN || "").trim();
  if (!fonnteToken) {
    return { success: false, reason: "Gateway Baileys & Fonnte tidak tersedia" };
  }

  try {
    const params = new URLSearchParams();
    params.append("target", groupId.replace(/^group:/i, ""));
    params.append("message", message);
    params.append("url", mediaUrl);
    params.append("delay", "2");

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: fonnteToken,
      },
      body: params,
    });

    const result = await response.json().catch(() => ({}));
    if (response.ok && Boolean(result.status)) {
      console.log(`[FONNTE-MEDIA-SUCCESS] Media terkirim ke grup ${groupId}`);
      return { success: true };
    }
    return { success: false, reason: result.reason || JSON.stringify(result) };
  } catch (err: any) {
    return { success: false, reason: err.message };
  }
}
