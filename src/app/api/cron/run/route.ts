import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const cronSecret = process.env.CRON_SECRET;

  // Verify secret token for cron (No hardcoded fallbacks)
  const isAuthorized = cronSecret && (queryToken === cronSecret || bearerToken === cronSecret);

  if (!isAuthorized) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized: Kredensial eksekusi cron tidak valid' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Use service role for cron tasks
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
        const response = await fetch("https://api.fonnte.com/send", {
          method: "POST",
          headers: {
            "Authorization": process.env.FONNTE_TOKEN || "",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            target: msg.no_whatsapp,
            message: msg.message,
            countryCode: "62"
          })
        });

        const result = await response.json();
        
        if (result.status) {
          await supabase.from('whatsapp_queue').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', msg.id);
          waSent++;
        } else {
          throw new Error(result.reason || "Unknown Fonnte Error");
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
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();

      const { data: users } = await supabase
        .from('profiles')
        .select('id, nama_panggilan, nama_lengkap, no_whatsapp, tanggal_lahir')
        .eq('is_active', true);
      
      let bdaySent = 0, bdayFailed = 0;
      const birthdayUsers = (users || []).filter(u => {
        if (!u.tanggal_lahir || !u.no_whatsapp) return false;
        const parts = u.tanggal_lahir.split(/[-/]/);
        if (parts.length < 3) return false;
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        return month === currentMonth && day === currentDay;
      });

      if (birthdayUsers.length === 0) {
        output += `  Tidak ada yang berulang tahun hari ini.\n`;
      } else {
        for (const user of birthdayUsers) {
          const birthYear = parseInt(user.tanggal_lahir.split('-')[0]);
          const age = today.getFullYear() - birthYear;
          const name = user.nama_panggilan || user.nama_lengkap;
          const text = `Selamat Ulang Tahun yang ke-${age}, ${name}! 🎉\nSemoga panjang umur dan sukses selalu bersama Expedient Generation.`;

          // Queue the whatsapp message instead of sending directly to handle failures gracefully
          await supabase.from('whatsapp_queue').insert([{
            no_whatsapp: user.no_whatsapp,
            message: text
          }]);
          bdaySent++;
        }
        output += `  Total Dimasukkan Antrian: ${bdaySent}\n`;
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

      let infaqSent = 0;
      for (const u of (optInUsers || [])) {
        const name = u.nama_panggilan || u.nama_lengkap || "Sahabat Expedient";
        const message = 
`Assalamu'alaikum Warahmatullahi Wabarakatuh, Akhi ${name} ✨

Mengingatkan kembali ladang amal jariyah kita di awal bulan ${currentMonthName}:
*Kas Rutin & Dana Ta'awun Angkatan 42 (Baitul Maal Expedient)*

Rekening Resmi:
🏛️ BSI: 7234 8901 2345 (a.n. Baitul Maal Expedient)
🏛️ BCA: 8091 2345 67 (a.n. Bendahara Kas Angkatan)
📱 Salurkan & Cek Mutasi: ${siteUrl}/baitul-maal

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
