import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedUserId = String(body.userId || "").trim();

    const cookieStore = await cookies();
    const adminToken = cookieStore.get("expedient_admin_session")?.value;
    const isSignedAdmin = await verifySignedAdminSession(adminToken);

    let targetUserId = "";

    if (isSignedAdmin && requestedUserId) {
      targetUserId = requestedUserId;
    } else {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: "Unauthorized: Sesi login diperlukan." }, { status: 401 });
      }
      if (requestedUserId && requestedUserId !== user.id) {
        return NextResponse.json({ error: "Forbidden: Tidak dapat mengaktifkan akun pengguna lain." }, { status: 403 });
      }
      if (!user.email_confirmed_at) {
        return NextResponse.json(
          { error: "Forbidden: Email belum terverifikasi. Silakan selesaikan verifikasi OTP." },
          { status: 403 }
        );
      }
      targetUserId = user.id;
    }

    const adminSupabase = createAdminClient();

    // Ambil data profil terlebih dahulu untuk mencegah pengiriman pesan selamat datang ganda
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("nama_lengkap, nama_panggilan, no_whatsapp, is_active")
      .eq("id", targetUserId)
      .single();

    const wasAlreadyActive = Boolean(profile?.is_active);

    if (isSignedAdmin) {
      await adminSupabase.auth.admin.updateUserById(targetUserId, { email_confirm: true });
    }
    await adminSupabase.from("profiles").update({ is_active: true }).eq("id", targetUserId);

    if (!wasAlreadyActive && profile?.no_whatsapp) {
      const namaLengkap = profile.nama_lengkap || "Sahabat";
      const namaPanggilan = profile.nama_panggilan || "";
      const waWelcome = `✨ *BISMILLAHIRRAHMANIRRAHIM* ✨

*Assalamu'alaikum Warahmatullahi Wabarakatuh*

Ahlan wa sahlan! Segala puji bagi Allah SWT, selamat bergabung dalam portal resmi *Expedient Generation — 43rd Arrisalah*, Sahabat *${namaLengkap}*${namaPanggilan ? ` (${namaPanggilan})` : ""}.

🎉 *AKUN ANDA TELAH RESMI DIAKTIFKAN & 100% SIAP DIGUNAKAN!*

Sungguh kebersamaan kita di dalam ikatan alumni ini adalah rahmat yang agung. Mari kita rawat silaturahmi ini berlandaskan petunjuk-Nya:

📖 *Dalil Al-Qur'an (QS. Al-Hujurat: 10)*
_"Sesungguhnya orang-orang mukmin itu bersaudara, karena itu damaikanlah antara kedua saudaramu dan bertakwalah kepada Allah agar kamu mendapat rahmat."_

💬 *Sabda Rasulullah SAW (HR. Bukhari & Muslim)*
_"Barangsiapa yang ingin diluaskan rezekinya dan dipanjangkan umurnya (dikenang jasa-jasanya), maka hendaklah ia menyambung hubungan silaturahmi."_

---
Gerbang portal utama kini telah terbuka:
🔗 https://expedientgeneration.vercel.app/login

Silakan masuk menggunakan email dan kata sandi Anda.

*Wassalamu'alaikum Warahmatullahi Wabarakatuh*
*Expedient Generation — 43rd Arrisalah*`;

      sendWhatsAppMessage(profile.no_whatsapp, waWelcome).catch((e) =>
        console.error("Error sending WA welcome on activate:", e)
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
