/**
 * lib/whatsapp.ts
 * Official WhatsApp Cloud API (Primary, 100% Anti-Ban, Verified Meta Platform)
 * with Fonnte secondary fallback.
 */

export async function sendWhatsAppMessage(target: string, message: string): Promise<boolean> {
  // Normalize number to international format 628...
  let num = target.replace(/\D/g, "");
  if (num.startsWith("0")) {
    num = "62" + num.substring(1);
  } else if (!num.startsWith("62")) {
    num = "62" + num;
  }

  const metaPhoneId = process.env.META_WA_PHONE_NUMBER_ID || "1217693854771569";
  const metaToken = (process.env.META_WA_ACCESS_TOKEN || "EAA9XTyf2nZCQBSfa06QmwXmkDT4WSAN8pNtDFz2yPZCHBlQlI4eqYC63XoX8xKMFysvnuADnxYoLAjXZBwANkYCmZBaACKMdk4AoYZCGZCAXY5ldRRYm5aor8PVb5KUuQ6eIhsEmsagwVA806b6KYjF221HfhP99a992j4JTCQOO3Vlpv8GqjxW0vfalpFAQZDZD").trim();

  // 1. PRIMARY: Meta WhatsApp Cloud API (Official, Zero-Ban, Server-to-Server)
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
        console.log(`[META-WA-SUCCESS] Message delivered to ${num} | Wamid: ${data.messages[0].id}`);
        return true;
      } else {
        console.warn(`[META-WA-FAIL] Meta Cloud API error for ${num}:`, data?.error?.message || data);
      }
    } catch (metaErr) {
      console.error("[META-WA-EXCEPTION]:", metaErr);
    }
  }

  // 2. SECONDARY: Fonnte Fallback (if configured and active)
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (fonnteToken) {
    try {
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fonnteToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: num,
          message: message,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && Boolean(result.status)) {
        console.log(`[FONNTE-WA-SUCCESS] Message delivered via Fonnte to ${num}`);
        return true;
      }
      console.warn("[FONNTE-WA-FAIL]:", result.reason || result);
    } catch (fonnteErr) {
      console.error("[FONNTE-WA-EXCEPTION]:", fonnteErr);
    }
  }

  console.error(`[WA-FAILED] All WhatsApp providers failed for ${num}`);
  return false;
}

export async function broadcastWhatsAppMessage(targets: string[], message: string): Promise<boolean> {
  if (!targets || targets.length === 0) return false;

  const normalizedTargets = targets
    .map((target) => {
      let num = target.replace(/\D/g, "");
      if (num.startsWith("0")) {
        num = "62" + num.substring(1);
      } else if (!num.startsWith("62")) {
        num = "62" + num;
      }
      return num;
    })
    .filter(Boolean);

  if (normalizedTargets.length === 0) return false;

  let successCount = 0;
  for (const num of normalizedTargets) {
    const sent = await sendWhatsAppMessage(num, message);
    if (sent) successCount++;
    // Polite pacing delay to respect throughput limit
    await new Promise((r) => setTimeout(r, 150));
  }

  return successCount > 0;
}

