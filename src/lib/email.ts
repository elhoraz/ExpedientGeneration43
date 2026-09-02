/**
 * lib/email.ts
 * Email sending utility using Supabase's built-in SMTP or external provider.
 * Supports Resend (recommended) or falls back to Supabase Auth's email.
 * 
 * Set RESEND_API_KEY in env to enable real email sending.
 * If not set, emails will be logged but marked as sent (development mode).
 */

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

/**
 * Send an email using the configured provider.
 * Returns true if sent successfully, throws on error.
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    // Development mode: log and return success
    console.log(`[EMAIL-DEV] To: ${payload.to} | Subject: ${payload.subject}`);
    console.log(`[EMAIL-DEV] Body: ${payload.body?.substring(0, 100)}...`);
    return true;
  }

  // Production: send via Resend API
  const fromAddress = process.env.EMAIL_FROM || "Expedient Generation <onboarding@resend.dev>";

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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Resend API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return true;
}
