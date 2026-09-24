import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage, sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";
import { verifySignedAdminSession } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cronSecret = process.env.CRON_SECRET || "expedient-cron-secret-2026";
  const userAgent = request.headers.get('user-agent') || '';
  const isVercelCron = userAgent.includes('vercel-cron') || request.headers.get('x-vercel-cron') === '1';

  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;
  const isAdminSessionValid = adminToken ? await verifySignedAdminSession(adminToken) : false;

  // Verify secret token for cron (Vercel Cron) or authenticated admin session
  const isAuthorized = 
    isVercelCron ||
    (queryToken === cronSecret || bearerToken === cronSecret) || 
    isAdminSessionValid;

  if (!isAuthorized) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized: Kredensial eksekusi cron tidak valid' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Use service role for cron tasks
  const supabase = createAdminClient();

  let output = `===== EXPEDIENT CRON RUNNER =====\n`;
  output += `Waktu : ${new Date().toISOString()}\n\n`;

  // 1. Process WhatsApp Queue
  output += `[1] Memproses Antrian WhatsApp...\n`;
  try {
    const { data: waQueue, error: waError } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (waError) throw waError;

    let waSent = 0, waFailed = 0;

    for (const msg of (waQueue || [])) {
      try {
        const res = await sendWhatsAppMessageWithDetail(msg.no_whatsapp, msg.message);
        
        if (res.success) {
          await supabase.from('whatsapp_queue').update({ status: 'sent', error_message: null, updated_at: new Date().toISOString() }).eq('id', msg.id);
          waSent++;
        } else {
          throw new Error(res.reason || "Gagal terkirim via provider WhatsApp");
        }
      } catch (err: any) {
        await supabase.from('whatsapp_queue').update({ status: 'failed', error_message: err.message, updated_at: new Date().toISOString() }).eq('id', msg.id);
        waFailed++;
      }
    }
    output += `  Terkirim : ${waSent}\n`;
    output += `  Gagal    : ${waFailed}\n`;
  } catch (e: any) {
    output += `  ERROR: ${e.message}\n`;
  }

  // 2. Process Email Queue
  output += `\n[2] Memproses Antrian Email...\n`;
  try {
    const { data: emailQueue, error: emailError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (emailError) throw emailError;

    let emailSent = 0, emailFailed = 0;
    for (const msg of (emailQueue || [])) {
      try {
        await sendEmail({
          to: msg.recipient_email,
          subject: msg.subject,
          body: msg.body_html || "",
          html: msg.body_html || undefined,
        });
        
        await supabase.from('email_queue').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', msg.id);
        emailSent++;
      } catch (err: any) {
        await supabase.from('email_queue').update({ status: 'failed', error_message: err.message || 'Send error', updated_at: new Date().toISOString() }).eq('id', msg.id);
        emailFailed++;
      }
    }
    output += `  Terkirim : ${emailSent}\n`;
    output += `  Gagal    : ${emailFailed}\n`;
  } catch (e: any) {
    output += `  ERROR: ${e.message}\n`;
  }

  // 3. Birthday Wishes
  if (searchParams.get('run_birthday') === 'true') {
    output += `\n[3] Mengirim Ucapan Ulang Tahun...\n`;
    try {
      const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const currentMonth = nowWib.getMonth() + 1;
      const currentDay = nowWib.getDate();

      const { data: users } = await supabase
        .from('profiles')
        .select('id, nama_panggilan, nama_lengkap, no_whatsapp, tanggal_lahir')
        .eq('is_active', true);
      
      let bdaySent = 0, bdayFailed = 0;
      const birthdayUsers = (users || []).filter(u => {
        if (!u.tanggal_lahir || !u.no_whatsapp) return false;
        const parts = u.tanggal_lahir.split(/[-/]/);
        if (parts.length < 3) return false;
        let month = parseInt(parts[1], 10);
        let day = parseInt(parts[2], 10);
        if (parts[2].length === 4) {
          day = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
        }
        return month === currentMonth && day === currentDay;
      });

      if (birthdayUsers.length === 0) {
        output += `  Tidak ada yang berulang tahun hari ini.\n`;
      } else {
        const startOfDay = new Date(nowWib.getFullYear(), nowWib.getMonth(), nowWib.getDate(), 0, 0, 0);

        for (const user of birthdayUsers) {
          const parts = user.tanggal_lahir.split(/[-/]/);
          let birthYear = parseInt(parts[0], 10);
          let birthMonth = parseInt(parts[1], 10);
          let birthDay = parseInt(parts[2], 10);
          if (parts[2].length === 4) {
            birthYear = parseInt(parts[2], 10);
            birthMonth = parseInt(parts[1], 10);
            birthDay = parseInt(parts[0], 10);
          }

          let rawAge = nowWib.getFullYear() - birthYear;
          const m = (nowWib.getMonth() + 1) - birthMonth;
          if (m < 0 || (m === 0 && nowWib.getDate() < birthDay)) {
            rawAge--;
          }
          const isAgeValid = rawAge > 0 && rawAge < 120 && birthYear < nowWib.getFullYear();
          const name = user.nama_panggilan || user.nama_lengkap;

          // Anti-duplication: Cek apakah hari ini sudah pernah dikirim ucapan ke nomor ini
          const { data: existingWish } = await supabase
            .from('whatsapp_queue')
            .select('id')
            .eq('no_whatsapp', user.no_whatsapp)
            .ilike('message', '%Ulang Tahun%')
            .gte('created_at', startOfDay.toISOString())
            .maybeSingle();

          if (existingWish) {
            output += `  [Skip] Ucapan untuk ${name} (${user.no_whatsapp}) sudah terkirim hari ini.\n`;
            continue;
          }

          const ageStr = isAgeValid ? ` yang ke-${rawAge}` : "";
          const bdayLink = `https://expedientgeneration.vercel.app/birthday/${user.id}`;
          const text = `🎉 *BARAKALLAHU FII UMRIK* 🎉

Selamat Ulang Tahun${ageStr}, Sahabat *${name}*! 🎂✨

Semoga Allah SWT senantiasa melimpahkan keberkahan, kesehatan, keselamatan, dan kesuksesan dunia-akhirat. Teruslah menjadi inspirasi dan kebanggaan keluarga besar *Expedient Generation — 43rd Arrisalah*.

Buka kartu ucapan spesial angkatan untukmu:
🔗 ${bdayLink}

Salam hangat & doa terbaik dari seluruh sahabat Expedient! 🌟`;

          // Langsung kirim via Gateway WhatsApp dengan anti-ban delay & direct fallback
          const sendRes = await sendWhatsAppMessageWithDetail(user.no_whatsapp, text);

          await supabase.from('whatsapp_queue').insert([{
            no_whatsapp: user.no_whatsapp,
            message: text,
            status: sendRes.success ? 'sent' : 'failed',
            error_message: sendRes.success ? null : (sendRes.reason || 'Gagal terkirim via provider WhatsApp')
          }]);

          if (sendRes.success) {
            bdaySent++;
            output += `  [Sukses] Terkirim langsung ke ${name} (${user.no_whatsapp})\n`;
          } else {
            bdayFailed++;
            output += `  [Gagal] Gagal mengirim ke ${name} (${user.no_whatsapp}): ${sendRes.reason}\n`;
          }
        }
        output += `  Total Terkirim: ${bdaySent} | Gagal: ${bdayFailed}\n`;
      }
    } catch (e: any) {
      output += `  ERROR: ${e.message}\n`;
    }
  }

  // 4. Monthly Baitul Maal Infaq Auto-Reminder (Task B-1)
  const isFirstDayOfMonth = new Date().getDate() === 1;
  if (searchParams.get('run_infaq_reminder') === 'true' || isFirstDayOfMonth) {
    output += `\n[4] Memproses Pengingat Infaq Kas Rutin Bulanan...\n`;
    try {
      const today = new Date();
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const currentMonthName = monthNames[today.getMonth()];
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://expedientgeneration.com";

      const { data: optInUsers, error: optInError } = await supabase
        .from('profiles')
        .select('id, nama_panggilan, nama_lengkap, no_whatsapp')
        .eq('is_active', true)
        .or('wa_notif_opt_in.eq.true,wa_notif_opt_in.eq.1')
        .not('no_whatsapp', 'is', null);

      if (optInError) throw optInError;

      // Fetch dynamic official bank accounts
      const { data: scData } = await supabase
        .from('site_content')
        .select('content_value')
        .eq('content_key', 'baitul_maal_bank_accounts')
        .maybeSingle();

      let accountsText = "";
      if (scData?.content_value) {
        try {
          const accounts = JSON.parse(scData.content_value);
          if (Array.isArray(accounts) && accounts.length > 0) {
            accountsText = "Rekening Resmi Kas:\n" + accounts.map((a: any) => `🏛️ ${a.bank}: ${a.account_number} (a.n. ${a.account_name})`).join("\n") + "\n";
          }
        } catch {}
      }

      let infaqSent = 0;
      for (const u of (optInUsers || [])) {
        const name = u.nama_panggilan || u.nama_lengkap || "Sahabat Expedient";
        const message = 
`Assalamu'alaikum Warahmatullahi Wabarakatuh, Akhi ${name} ✨

Mengingatkan kembali ladang amal jariyah kita di awal bulan ${currentMonthName}:
*Kas Rutin & Dana Ta'awun Angkatan 43 (Baitul Maal Expedient)*

${accountsText ? `${accountsText}\n` : ""}📱 Salurkan & Cek Mutasi Kas Terbuka: ${siteUrl}/baitul-maal

"Perumpamaan orang yang menafkahkan hartanya di jalan Allah adalah serupa dengan sebutir benih yang menumbuhkan tujuh bulir..." (QS. Al-Baqarah: 261)

Jazakumullah khairan katsiran. Semoga Allah melapangkan rezeki antum sekeluarga. 🤲`;

        await supabase.from('whatsapp_queue').insert([{
          no_whatsapp: u.no_whatsapp,
          message: message
        }]);
        infaqSent++;
      }
      output += `  Total Pengingat Infaq Dimasukkan Antrian: ${infaqSent}\n`;
    } catch (e: any) {
      output += `  ERROR Pengingat Infaq: ${e.message}\n`;
    }
  }

  output += `\n===== SELESAI =====\n`;

  return new NextResponse(output, { 
    status: 200, 
    headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
  });
}
