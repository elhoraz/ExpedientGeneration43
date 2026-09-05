/**
 * lib/email.ts
 * High-reliability email sending utility.
 * Uses Gmail SMTP (nodemailer) with App Password for 100% genuine Gmail delivery,
 * and falls back to Resend or local dev log if needed.
 */
import nodemailer from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

/**
 * Send an email using the configured provider (Gmail SMTP primary).
 * Returns true if sent successfully.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const smtpUser = process.env.SMTP_USER || "expedientgeneration43@gmail.com";
  // Fallback ke app password Gmail jika env var belum terpasang di Vercel
  const smtpPass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "wxgyxvfurathwfez").replace(/\s/g, "");

  // 1. PRIMARY: Kirim langsung via Gmail SMTP menggunakan Nodemailer
  if (smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      const info = await transporter.sendMail({
        from: `Expedient Generation <${smtpUser}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.body,
        html: payload.html || payload.body.replace(/\n/g, "<br/>"),
      });

      console.log(`[SMTP-SUCCESS] Email berhasil dikirim ke: ${payload.to} | MessageId: ${info.messageId}`);
      return true;
    } catch (smtpError) {
      console.error("[SMTP Send Failed, mencoba secondary provider]:", smtpError);
    }
  }

  // 2. SECONDARY FALLBACK: Resend API
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    let fromAddress = process.env.EMAIL_FROM || "Expedient Generation <onboarding@resend.dev>";
    if (fromAddress.includes("@gmail.com") || fromAddress.includes("@yahoo.com")) {
      fromAddress = "Expedient Generation <onboarding@resend.dev>";
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html || payload.body.replace(/\n/g, "<br/>"),
        }),
      });

      if (response.ok) {
        console.log(`[RESEND-SUCCESS] Email berhasil dikirim ke: ${payload.to}`);
        return true;
      }
      const resJson = await response.json().catch(() => ({}));
      console.error("[Resend API Error Response]:", resJson);
    } catch (resendError) {
      console.error("[Resend API Error]:", resendError);
    }
  }

  // 3. Jika semua metode gagal, laporkan kegagalan secara akurat
  console.error(`[EMAIL-FAILED] Seluruh provider gagal mengirim email ke: ${payload.to}`);
  return false;
}
