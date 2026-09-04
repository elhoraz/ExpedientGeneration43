import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const channel = String(body.channel || "").trim().toLowerCase(); // "gmail" or "whatsapp"

    if (!email) {
      return NextResponse.json({ error: "Email diperlukan." }, { status: 400 });
    }

    if (channel !== "gmail" && channel !== "whatsapp") {
      return NextResponse.json({ error: "Saluran verifikasi harus 'gmail' atau 'whatsapp'." }, { status: 400 });
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 1. Cari user di Supabase Auth
    const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const user = users.find((u) => u.email?.toLowerCase() === email);
    if (!user) {
      return NextResponse.json(
        { error: "Akun dengan email ini belum terdaftar. Silakan lengkapi pendaftaran terlebih dahulu." },
        { status: 404 }
      );
    }

    // 2. Ambil data profil (nomor WhatsApp dan nama lengkap)
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("nama_lengkap, nama_panggilan, no_whatsapp, is_active")
      .eq("id", user.id)
      .single();

    // Jika user sudah aktif dan email sudah konfirmasi
    if (user.email_confirmed_at && profile?.is_active) {
      return NextResponse.json({
        success: true,
        already_confirmed: true,
        message: "Akun Anda sudah terverifikasi dan aktif. Silakan langsung login.",
      });
    }

    // 3. Cooldown check (minimal 45 detik antar pengiriman)
    const lastSentAt = Number(user.user_metadata?.otp_sent_at || 0);
    const timeSinceLast = Date.now() - lastSentAt;
    if (lastSentAt && timeSinceLast < 45 * 1000) {
      const waitSeconds = Math.ceil((45 * 1000 - timeSinceLast) / 1000);
      return NextResponse.json(
        { error: `Mohon tunggu ${waitSeconds} detik sebelum meminta kode OTP baru.` },
        { status: 429 }
      );
    }

    // 4. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 menit

    // 5. Simpan OTP di user_metadata
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        otp_code: otp,
        otp_expires_at: expiresAt,
        otp_channel: channel,
        otp_sent_at: Date.now(),
        otp_attempts: 0,
      },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const namaPengguna = profile?.nama_lengkap || user.user_metadata?.nama_lengkap || "Sahabat";
    const noWa = profile?.no_whatsapp || user.user_metadata?.no_whatsapp || "";

    // 6. Kirim OTP sesuai saluran
    if (channel === "whatsapp") {
      if (!noWa) {
        return NextResponse.json(
          { error: "Nomor WhatsApp belum terdaftar pada akun ini. Silakan pilih opsi Gmail." },
          { status: 400 }
        );
      }

      const waMessage = `✨ *KODE VERIFIKASI EXPEDIENT GENERATION* ✨

*Assalamu'alaikum Warahmatullahi Wabarakatuh*

Halo *${namaPengguna}*, berikut adalah kode OTP verifikasi untuk mengesahkan dan mengaktifkan akun portal Anda:

🔑 *KODE OTP ANDA:*
*${otp}*

_Kode ini bersifat rahasia dan berlaku selama 10 menit. Jangan bagikan kepada siapa pun._

Silakan ketikkan 6 digit angka di atas pada layar verifikasi portal untuk menyelesaikan pendaftaran.

*Wassalamu'alaikum Warahmatullahi Wabarakatuh*
*Expedient Generation — 43rd Arrisalah*`;

      const sent = await sendWhatsAppMessage(noWa, waMessage);
      if (!sent) {
        return NextResponse.json(
          { error: "Gagal mengirim WhatsApp. Pastikan nomor WhatsApp aktif atau coba pilih opsi Gmail." },
          { status: 500 }
        );
      }

      // Mask phone number for security in response (e.g. 0812****789)
      const cleanNum = noWa.replace(/\D/g, "");
      const masked = cleanNum.length > 6 
        ? cleanNum.substring(0, 4) + "****" + cleanNum.substring(cleanNum.length - 3)
        : cleanNum;

      return NextResponse.json({
        success: true,
        channel: "whatsapp",
        target: masked,
        message: `Kode OTP 6 digit berhasil dikirim ke WhatsApp Anda (${masked})!`,
      });
    }

    // Saluran Gmail (Template VVIP Royal Dark & Gold)
    const emailHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kode OTP Verifikasi - Expedient Generation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #040806; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040806; padding: 45px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background: #0c1510; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);">
          
          <!-- Top Golden Accent Bar -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #aa771c 0%, #ffd700 50%, #aa771c 100%);"></td>
          </tr>

          <!-- Header Branding -->
          <tr>
            <td style="padding: 40px 35px 25px; text-align: center;">
              <div style="font-size: 34px; line-height: 1; margin-bottom: 12px;">👑</div>
              <h1 style="margin: 0 0 6px; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #ffd700; text-transform: uppercase;">
                Expedient Generation
              </h1>
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 4px; color: #8fa397; text-transform: uppercase; margin-bottom: 18px;">
                43rd Arrisalah Alumni Portal
              </div>
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.35), transparent); width: 80%; margin: 0 auto;"></div>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 10px 40px 35px; color: #e2e8f0;">
              <div style="font-family: Georgia, serif; font-size: 14px; font-style: italic; color: #d4af37; text-align: center; margin-bottom: 24px; letter-spacing: 0.5px;">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>

              <p style="font-size: 15px; line-height: 1.7; color: #f1f5f9; margin: 0 0 16px;">
                <strong>Assalamu'alaikum Warahmatullahi Wabarakatuh,</strong>
              </p>
              
              <p style="font-size: 14px; line-height: 1.7; color: #cbd5e1; margin: 0 0 25px;">
                Ahlan wa sahlan, Sahabat <strong style="color: #ffffff;">${namaPengguna}</strong>. Pendaftaran akun Anda hampir selesai. Gunakan kode verifikasi rahasia berikut untuk mengesahkan dan mengaktifkan akses Anda ke portal utama:
              </p>

              <!-- OTP Golden Box -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 25px 0 30px;">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 18px 36px; background: rgba(212, 175, 55, 0.08); border: 2px solid #ffd700; border-radius: 14px; box-shadow: 0 0 30px rgba(212, 175, 55, 0.2), inset 0 0 20px rgba(212, 175, 55, 0.05); text-align: center;">
                      <div style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #ffd700; font-weight: 700; margin-bottom: 6px;">
                        KODE VERIFIKASI KEHORMATAN
                      </div>
                      <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #ffffff; text-shadow: 0 0 15px rgba(255, 215, 0, 0.6); padding-left: 12px;">
                        ${otp}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice Badge -->
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 18px; margin-bottom: 25px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                  ⏱️ Kode OTP ini berlaku selama <strong style="color: #ffd700;">10 menit</strong>.<br />
                  Jangan berikan kode ini kepada siapa pun demi keamanan akun Anda.
                </p>
              </div>

              <!-- Quote Card -->
              <div style="border-left: 3px solid #d4af37; background: rgba(212, 175, 55, 0.05); padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 25px;">
                <p style="margin: 0 0 6px; font-size: 13px; font-style: italic; color: #cbd5e1; line-height: 1.6;">
                  "Sesungguhnya orang-orang mukmin itu bersaudara, karena itu damaikanlah antara kedua saudaramu dan bertakwalah kepada Allah agar kamu mendapat rahmat."
                </p>
                <div style="font-size: 11px; color: #d4af37; font-weight: 600;">
                  — QS. Al-Hujurat: 10
                </div>
              </div>

              <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0;">
                Wassalamu'alaikum Warahmatullahi Wabarakatuh,<br />
                <strong style="color: #cbd5e1;">Keluarga Besar Expedient Generation</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 22px 30px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #64748b; letter-spacing: 0.5px;">
                Email ini dikirim secara otomatis oleh Sistem Keamanan Portal Resmi Expedient Generation.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; 2026 Expedient Generation &bull; 43rd Arrisalah. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Saluran Gmail: Panggil Supabase Auth Resend (yang menggunakan custom SMTP Gmail Anda)
    try {
      await adminSupabase.auth.resend({
        type: "signup",
        email,
      });
    } catch (sbErr: any) {
      console.warn("Supabase Auth resend via Gmail SMTP note:", sbErr?.message || sbErr);
    }

    // Juga kirim email format HTML dengan template mewah
    try {
      await sendEmail({
        to: email,
        subject: `[${otp}] Kode Verifikasi Akun Expedient Generation`,
        body: `Kode OTP verifikasi akun Anda adalah: ${otp}. Berlaku selama 10 menit.`,
        html: emailHtml,
      });
    } catch (mailErr: any) {
      console.warn("Secondary Resend email note:", mailErr?.message || mailErr);
    }

    // Mask email for response (e.g. da***@gmail.com)
    const [userPart, domainPart] = email.split("@");
    const maskedEmail = userPart.length > 2 
      ? userPart.substring(0, 2) + "***@" + domainPart 
      : email;

    return NextResponse.json({
      success: true,
      channel: "gmail",
      target: maskedEmail,
      message: `Kode verifikasi 6 digit berhasil dikirim ke Gmail Anda (${maskedEmail})!`,
    });
  } catch (err: any) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: err.message || "Terjadi kendala server." }, { status: 500 });
  }
}
