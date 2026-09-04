import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const otp = String(body.otp || "").trim();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email dan 6 digit kode OTP wajib diisi." },
        { status: 400 }
      );
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
        { error: "Akun dengan email ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Ambil metadata OTP
    const savedOtp = String(user.user_metadata?.otp_code || "").trim();
    const expiresAt = Number(user.user_metadata?.otp_expires_at || 0);

    let isOtpValid = false;

    // A. Cek kecocokan dengan metadata (WhatsApp / Custom OTP)
    if (savedOtp && savedOtp === otp && Date.now() <= expiresAt) {
      isOtpValid = true;
    }

    // B. Jika belum cocok, cek dengan Supabase Auth verifyOtp (jika dikirim via Supabase Gmail SMTP)
    if (!isOtpValid) {
      try {
        const anonSupabase = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: verifyData, error: verifyError } = await anonSupabase.auth.verifyOtp({
          email,
          token: otp,
          type: "signup",
        });

        if (!verifyError && (verifyData.session || verifyData.user)) {
          isOtpValid = true;
        }
      } catch (e) {
        console.warn("Supabase verifyOtp check error:", e);
      }
    }

    if (!isOtpValid) {
      return NextResponse.json(
        { error: "Kode OTP yang Anda masukkan salah atau telah kedaluwarsa. Periksa kembali 6 digit angka yang Anda terima." },
        { status: 400 }
      );
    }

    // 3. OTP Valid! Bersihkan kode OTP dari metadata dan sahkan email
    const { otp_code, otp_expires_at, ...cleanMetadata } = user.user_metadata || {};
    const { error: activateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
      user_metadata: cleanMetadata,
    });

    if (activateError) {
      return NextResponse.json({ error: activateError.message }, { status: 500 });
    }

    // 4. Aktifkan profile di database
    await adminSupabase.from("profiles").update({ is_active: true }).eq("id", user.id);

    // 5. Ambil data profil untuk ucapan selamat bergabung
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("nama_lengkap, nama_panggilan, no_whatsapp")
      .eq("id", user.id)
      .single();

    const namaLengkap = profile?.nama_lengkap || user.user_metadata?.nama_lengkap || "Sahabat";
    const namaPanggilan = profile?.nama_panggilan || user.user_metadata?.nama_panggilan || "";
    const noWa = profile?.no_whatsapp || user.user_metadata?.no_whatsapp || "";

    // 6. KIRIM UCAPAN SELAMAT BERGABUNG (Setelah sukses verifikasi)
    // A. WhatsApp
    if (noWa) {
      const waWelcome = `✨ *BISMILLAHIRRAHMANIRRAHIM* ✨

*Assalamu'alaikum Warahmatullahi Wabarakatuh*

Ahlan wa sahlan! Segala puji bagi Allah SWT, selamat bergabung dalam portal eksklusif *Expedient Generation — 43rd Arrisalah*, Sahabat *${namaLengkap}*${namaPanggilan ? ` (${namaPanggilan})` : ""}.

🎉 *AKUN ANDA TELAH BERHASIL DIVERIFIKASI & AKTIF 100%!*

Sungguh kebersamaan kita di dalam ikatan alumni ini adalah rahmat yang agung. Mari kita rawat silaturahmi ini berlandaskan petunjuk-Nya:

📖 *Dalil Al-Qur'an (QS. Al-Hujurat: 10)*
_"Sesungguhnya orang-orang mukmin itu bersaudara, karena itu damaikanlah antara kedua saudaramu dan bertakwalah kepada Allah agar kamu mendapat rahmat."_

💬 *Sabda Rasulullah SAW (HR. Bukhari & Muslim)*
_"Barangsiapa yang ingin diluaskan rezekinya dan dipanjangkan umurnya (dikenang jasa-jasanya), maka hendaklah ia menyambung hubungan silaturahmi."_

---
Gerbang portal utama kini telah terbuka:
🔗 https://expedientgeneration.vercel.app/login

Silakan masuk menggunakan surel resmi dan kata sandi Anda.

*Wassalamu'alaikum Warahmatullahi Wabarakatuh*
*Expedient Generation — 43rd Arrisalah*`;

      sendWhatsAppMessage(noWa, waWelcome).catch((e) => console.error("Error sending WA welcome:", e));
    }

    // B. Email Ucapan Selamat Bergabung (Template VVIP Royal Gold)
    const emailWelcomeHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Selamat Bergabung - Expedient Generation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #040806; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #040806; padding: 45px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background: #0c1510; border: 1px solid rgba(212, 175, 55, 0.45); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);">
          
          <!-- Top Golden Accent Bar -->
          <tr>
            <td height="5" style="background: linear-gradient(90deg, #aa771c 0%, #ffd700 50%, #aa771c 100%);"></td>
          </tr>

          <!-- Header Branding -->
          <tr>
            <td style="padding: 40px 35px 25px; text-align: center;">
              <div style="font-size: 40px; line-height: 1; margin-bottom: 12px;">👑</div>
              <h1 style="margin: 0 0 6px; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 700; letter-spacing: 2px; color: #ffd700; text-transform: uppercase;">
                Ahlan Wa Sahlan!
              </h1>
              <div style="font-size: 11px; font-weight: 600; letter-spacing: 4px; color: #8fa397; text-transform: uppercase; margin-bottom: 18px;">
                Expedient Generation &bull; 43rd Arrisalah
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
              
              <p style="font-size: 14px; line-height: 1.7; color: #cbd5e1; margin: 0 0 20px;">
                Segala puji bagi Allah SWT yang senantiasa menautkan hati kita dalam ukhuwah. Selamat bergabung Sahabat <strong style="color: #ffffff;">${namaLengkap}</strong>${namaPanggilan ? ` (${namaPanggilan})` : ""}, akun Anda telah <strong>resmi disahkan & aktif 100%</strong> di portal utama!
              </p>

              <!-- Quran Quote Card -->
              <div style="border-left: 3px solid #d4af37; background: rgba(212, 175, 55, 0.06); padding: 16px 20px; border-radius: 0 10px 10px 0; margin-bottom: 25px;">
                <p style="margin: 0 0 8px; font-size: 13px; font-style: italic; color: #f1f5f9; line-height: 1.7;">
                  "Sesungguhnya orang-orang mukmin itu bersaudara, karena itu damaikanlah antara kedua saudaramu dan bertakwalah kepada Allah agar kamu mendapat rahmat."
                </p>
                <div style="font-size: 11px; color: #d4af37; font-weight: 700; letter-spacing: 1px;">
                  — QS. AL-HUJURAT: 10
                </div>
              </div>

              <!-- Button CTA -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 30px 0 35px;">
                <tr>
                  <td align="center">
                    <a href="https://expedientgeneration.vercel.app/login" style="display: inline-block; padding: 15px 36px; background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); color: #0b1410; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 12px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 6px 20px rgba(212, 175, 55, 0.45);">
                      Buka Portal Utama &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0;">
                Wassalamu'alaikum Warahmatullahi Wabarakatuh,<br />
                <strong style="color: #cbd5e1;">Keluarga Besar Expedient Generation — 43rd Arrisalah</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.06); padding: 22px 30px; text-align: center;">
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

    sendEmail({
      to: email,
      subject: "✨ Ahlan Wa Sahlan! Akun Expedient Generation Anda Resmi Aktif",
      body: `Assalamu'alaikum ${namaLengkap}, selamat bergabung dalam portal Expedient Generation — 43rd Arrisalah. Akun Anda telah aktif.`,
      html: emailWelcomeHtml,
    }).catch((e) => console.error("Error sending Email welcome:", e));

    return NextResponse.json({
      success: true,
      message: "Verifikasi berhasil! Akun Anda telah aktif dan ucapan selamat bergabung telah dikirimkan ke WhatsApp & Email Anda.",
      redirect_url: `/login?success=${encodeURIComponent("Verifikasi berhasil! Akun Anda telah aktif. Silakan masuk.")}`,
    });
  } catch (err: any) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: err.message || "Terjadi kendala server." }, { status: 500 });
  }
}
