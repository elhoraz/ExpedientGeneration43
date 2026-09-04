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

    // B. Email Ucapan Selamat Bergabung (Resend)
    const emailWelcomeHtml = `
      <div style="background-color: #050b08; color: #e2e8f0; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 20px; text-align: center;">
        <div style="max-width: 550px; margin: 0 auto; background: rgba(14, 22, 17, 0.98); border: 1px solid rgba(212, 175, 55, 0.45); border-radius: 18px; padding: 40px 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.7);">
          <div style="font-size: 36px; margin-bottom: 8px;">👑</div>
          <h1 style="color: #ffd700; font-family: Georgia, serif; margin: 0 0 6px; font-size: 26px; letter-spacing: 1px;">Selamat Bergabung</h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 22px; text-transform: uppercase; letter-spacing: 2px;">Expedient Generation — 43rd Arrisalah</p>
          <hr style="border: 0; border-top: 1px solid rgba(212, 175, 55, 0.25); margin: 20px 0;" />
          
          <div style="text-align: left; font-size: 14px; color: #f1f5f9; line-height: 1.7; margin-bottom: 25px;">
            <p><strong>Assalamu'alaikum Warahmatullahi Wabarakatuh,</strong></p>
            <p>Ahlan wa sahlan, Sahabat <strong>${namaLengkap}</strong>${namaPanggilan ? ` (${namaPanggilan})` : ""}! Akun Anda telah <strong>berhasil diverifikasi dan resmi aktif</strong> di portal utama Expedient Generation.</p>
            <p style="font-style: italic; color: #cbd5e1; background: rgba(212,175,55,0.08); padding: 12px 16px; border-left: 3px solid #ffd700; border-radius: 4px;">
              "Sesungguhnya orang-orang mukmin itu bersaudara, karena itu damaikanlah antara kedua saudaramu dan bertakwalah kepada Allah agar kamu mendapat rahmat." (QS. Al-Hujurat: 10)
            </p>
          </div>

          <div style="margin: 30px 0;">
            <a href="https://expedientgeneration.vercel.app/login" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); color: #0b1410; font-weight: 800; font-size: 14px; text-decoration: none; border-radius: 8px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(212,175,55,0.4);">
              Masuk ke Portal Utama &rarr;
            </a>
          </div>

          <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 25px 0 15px;" />
          <p style="font-size: 11px; color: #64748b; margin: 0;">
            Wassalamu'alaikum Warahmatullahi Wabarakatuh<br />
            Keluarga Besar Expedient Generation — 43rd Arrisalah
          </p>
        </div>
      </div>
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
