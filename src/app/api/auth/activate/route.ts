import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    await adminSupabase.auth.admin.updateUserById(userId, { email_confirm: true });
    await adminSupabase.from("profiles").update({ is_active: true }).eq("id", userId);

    // Ambil data profil untuk ucapan selamat bergabung
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("nama_lengkap, nama_panggilan, no_whatsapp")
      .eq("id", userId)
      .single();

    if (profile?.no_whatsapp) {
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

