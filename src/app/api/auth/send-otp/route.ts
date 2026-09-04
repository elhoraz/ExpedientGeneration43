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

    // Saluran Gmail
    const emailHtml = `
      <div style="background-color: #050b08; color: #e2e8f0; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 20px; text-align: center;">
        <div style="max-width: 520px; margin: 0 auto; background: rgba(14, 22, 17, 0.95); border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 16px; padding: 35px 25px; box-shadow: 0 15px 35px rgba(0,0,0,0.6);">
          <div style="font-size: 28px; margin-bottom: 10px;">👑</div>
          <h1 style="color: #ffd700; font-family: Georgia, serif; margin: 0 0 6px; font-size: 24px; letter-spacing: 1px;">Expedient Generation</h1>
          <p style="color: #94a3b8; font-size: 12px; margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px;">43rd Arrisalah Portal</p>
          <hr style="border: 0; border-top: 1px solid rgba(212, 175, 55, 0.2); margin: 20px 0;" />
          <p style="font-size: 15px; color: #f1f5f9; line-height: 1.6; margin-bottom: 20px;">
            Assalamu'alaikum Warahmatullahi Wabarakatuh,<br />
            Halo <strong>${namaPengguna}</strong>. Berikut adalah <strong>Kode OTP</strong> untuk verifikasi dan aktivasi akun portal Anda:
          </p>
          <div style="display: inline-block; padding: 14px 28px; background: rgba(212,175,55,0.12); border: 2px solid #ffd700; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffd700; margin: 15px 0 25px;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 15px;">
            Kode ini bersifat rahasia dan berlaku selama <strong>10 menit</strong>. Jangan berikan kode ini kepada siapa pun demi keamanan akun Anda.
          </p>
          <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; margin: 0;">
            Pesan otomatis dari Sistem Keamanan Expedient Generation.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `[${otp}] Kode Verifikasi Akun Expedient Generation`,
        body: `Kode OTP verifikasi akun Anda adalah: ${otp}. Berlaku selama 10 menit.`,
        html: emailHtml,
      });

      // Mask email for response (e.g. da***@gmail.com)
      const [userPart, domainPart] = email.split("@");
      const maskedEmail = userPart.length > 2 
        ? userPart.substring(0, 2) + "***@" + domainPart 
        : email;

      return NextResponse.json({
        success: true,
        channel: "gmail",
        target: maskedEmail,
        message: `Kode OTP 6 digit berhasil dikirim ke Gmail Anda (${maskedEmail})!`,
      });
    } catch (mailErr: any) {
      console.warn("Resend email delivery note:", mailErr.message, "- Fallback to Supabase Auth delivery");
      try {
        await adminSupabase.auth.resend({
          type: "signup",
          email,
        });
      } catch (fallbackErr) {
        console.error("Supabase fallback resend also failed:", fallbackErr);
      }

      const [userPart, domainPart] = email.split("@");
      const maskedEmail = userPart.length > 2 
        ? userPart.substring(0, 2) + "***@" + domainPart 
        : email;

      return NextResponse.json({
        success: true,
        channel: "gmail",
        target: maskedEmail,
        message: `Kode verifikasi berhasil dikirimkan ke email Anda (${maskedEmail})!`,
      });
    }
  } catch (err: any) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: err.message || "Terjadi kendala server." }, { status: 500 });
  }
}
