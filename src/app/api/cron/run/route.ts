import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage, sendWhatsAppMessageWithDetail } from "@/lib/whatsapp";
import { verifySignedAdminSession, timingSafeEqualString } from "@/lib/admin-auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryToken = (searchParams.get('token') || '').trim();
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
  const cronSecret = (process.env.CRON_SECRET || '').trim();

  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;
  const isAdminSessionValid = adminToken ? await verifySignedAdminSession(adminToken) : false;

  const isSecretValid = Boolean(
    cronSecret &&
      ((bearerToken && timingSafeEqualString(bearerToken, cronSecret)) ||
        (queryToken && timingSafeEqualString(queryToken, cronSecret)))
  );

  // Verify secret token for cron (Vercel Cron sends Authorization: Bearer <CRON_SECRET>) or authenticated admin session
  const isAuthorized = isSecretValid || isAdminSessionValid;

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

  // 0. Aegis Sentinel WhatsApp Gateway (Baileys) Health Check (24 Jam)
  output += `[0] Memeriksa Status WhatsApp Gateway (Baileys)...\n`;
  try {
    const { checkWhatsAppGatewayHealth } = await import("@/lib/sentinel/telemetryAlert");
    const gwRes = await checkWhatsAppGatewayHealth();
    output += `Status WhatsApp Gateway: ${gwRes.status} (Device: ${gwRes.device || "N/A"})\n`;
  } catch (gwErr: any) {
    output += `Peringatan Gateway Check: ${gwErr.message}\n`;
  }

  // 1. Process WhatsApp Queue
  output += `\n[1] Memproses Antrian WhatsApp...\n`;
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
        .select('id, nama_panggilan, nama_lengkap, no_whatsapp, tanggal_lahir, foto_profil')
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

          // Anti-duplication: Cek apakah hari ini sudah pernah berhasil terkirim ucapan ke nomor ini
          const { data: existingWish } = await supabase
            .from('whatsapp_queue')
            .select('id')
            .eq('no_whatsapp', user.no_whatsapp)
            .eq('status', 'sent')
            .ilike('message', '%Ulang Tahun%')
            .gte('created_at', startOfDay.toISOString())
            .maybeSingle();

          if (existingWish) {
            output += `  [Skip] Ucapan untuk ${name} (${user.no_whatsapp}) sudah terkirim hari ini.\n`;
            continue;
          }

          const ageStr = isAgeValid ? ` yang ke-${rawAge}` : "";
          const bdayLink = `https://expedientgeneration.vercel.app/birthday/${user.id}`;
          
          // ANTI-BAN META: JANGAN PERNAH mengirim pesan japri otomatis ke nomor alumni pribadi.
          // Mengirim japri pembuka berisi link dari IP cloud memicu flag spam instan dari Meta.
          // Ucapan difokuskan secara meriah ke Grup Komunitas Angkatan & notifikasi in-app website.
          output += `  [Anti-Ban Guard] Japri WA ke ${name} (${user.no_whatsapp}) dilewati demi keamanan Meta (ucapan fokus via grup & web).\n`;

          // Insert in-app & push notification
          try {
            await supabase.from('notifications').insert([{
              user_id: user.id,
              title: `🎉 Barakallahu Fii Umrik, ${name}!`,
              message: `Selamat Ulang Tahun${ageStr}! Semoga Allah SWT senantiasa melimpahkan keberkahan dan kebaikan.`,
              link: `/birthday/${user.id}`,
              is_read: false,
            }]);
          } catch (notifErr) {
            console.warn("Failed to insert birthday in-app notif:", notifErr);
          }
        }
        output += `  Total Notifikasi Web: ${birthdayUsers.length} | Japri WA Otomatis: Dinonaktifkan (Zero-Ban Mode)\n`;

        // Pengiriman ucapan ke Grup WhatsApp Komunitas Angkatan (Broadcast Grup)
        try {
          const { sendWhatsAppGroupMessage, getCommunityGroupId } = await import("@/lib/whatsapp");
          const { formatBirthdayGreetingMessage } = await import("@/lib/whatsapp/birthdayCelebrator");
          const commGroupId = getCommunityGroupId();

          for (const user of birthdayUsers) {
            const parts = user.tanggal_lahir.split(/[-/]/);
            let birthYear = parseInt(parts[0], 10);
            if (parts[2].length === 4) birthYear = parseInt(parts[2], 10);
            const rawAge = nowWib.getFullYear() - birthYear;

            const { data: existingGroupWish } = await supabase
              .from('whatsapp_queue')
              .select('id')
              .eq('no_whatsapp', commGroupId.slice(0, 20))
              .eq('status', 'sent')
              .ilike('message', `%${user.nama_lengkap}%`)
              .gte('created_at', startOfDay.toISOString())
              .maybeSingle();

            if (existingGroupWish) {
              output += `  [Skip Grup] Ucapan grup untuk ${user.nama_lengkap} sudah terkirim hari ini.\n`;
              continue;
            }

            const groupMsg = formatBirthdayGreetingMessage({
              id: user.id,
              nama_lengkap: user.nama_lengkap,
              nama_panggilan: user.nama_panggilan || user.nama_lengkap.split(" ")[0],
              tanggal_lahir: user.tanggal_lahir,
              no_whatsapp: user.no_whatsapp,
              foto_profil: user.foto_profil,
              usia: rawAge > 0 && rawAge < 120 ? rawAge : 0,
            });

            const userMentions = user.no_whatsapp ? [`${user.no_whatsapp.replace(/\D/g, "")}@s.whatsapp.net`] : [];
            const grpSendRes = await sendWhatsAppGroupMessage(commGroupId, groupMsg, {
              imageUrl: user.foto_profil || undefined,
              mentions: userMentions,
            });
            await supabase.from('whatsapp_queue').insert([{
              no_whatsapp: commGroupId.slice(0, 20),
              message: groupMsg,
              status: grpSendRes.success ? 'sent' : 'failed',
              error_message: grpSendRes.success ? null : (grpSendRes.reason || 'Gagal terkirim ke grup komunitas')
            }]);

            if (grpSendRes.success) {
              output += `  [Sukses Grup] Terkirim ucapan milad ${user.nama_lengkap} ke grup komunitas\n`;
            } else {
              output += `  [Gagal Grup] Gagal mengirim ke grup komunitas: ${grpSendRes.reason}\n`;
            }
          }
        } catch (grpErr: any) {
          output += `  [Error Grup Milad] ${grpErr.message}\n`;
        }
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

        // In-app & push notification
        try {
          await supabase.from('notifications').insert([{
            user_id: u.id,
            title: `💰 Kas Rutin & Ta'awun ${currentMonthName}`,
            message: `Mengingatkan ladang amal jariyah kita di awal bulan ${currentMonthName} (Baitul Maal Expedient).`,
            link: "/baitul-maal",
            is_read: false,
          }]);
        } catch {}

        infaqSent++;
      }
      output += `  Total Pengingat Infaq Dimasukkan Antrian: ${infaqSent}\n`;
    } catch (e: any) {
      output += `  ERROR Pengingat Infaq: ${e.message}\n`;
    }
  }

  // 5. Graphic Design Studio Alerts (H-3, H-1, Hari-H)
  if (
    searchParams.get('run_design_alert') === 'true' ||
    searchParams.get('run_birthday') === 'true' ||
    !searchParams.toString()
  ) {
    output += `\n[5] Memeriksa & Mengirim Alert Grup Graphic Design...\n`;
    try {
      const { runDailyDesignAlerts } = await import('@/lib/whatsapp/designGroupAssistant');
      const designRes = await runDailyDesignAlerts();
      output += `  Status   : Sukses\n`;
      output += `  Terkirim : ${designRes.sentCount} alert\n`;
      if (designRes.alerts.length > 0) {
        output += `  Detail   : ${designRes.alerts.join(', ')}\n`;
      }
    } catch (e: any) {
      output += `  ERROR Design Alert: ${e.message}\n`;
    }
  }

  // 6. Community Group Inactivity Icebreaker (Pemicu Obrolan 6 Jam Sepi)
  if (
    searchParams.get('run_icebreaker') === 'true' ||
    !searchParams.toString() ||
    isSecretValid
  ) {
    output += `\n[6] Memeriksa Keaktifan Grup Angkatan Non-Resmi (Inactivity 6 Jam)...\n`;
    try {
      const forceIcebreaker = searchParams.get('force_icebreaker') === 'true';
      const { checkAndTriggerCommunityIcebreaker } = await import('@/lib/whatsapp/communityIcebreaker');
      const iceRes = await checkAndTriggerCommunityIcebreaker(forceIcebreaker);
      if (iceRes.triggered) {
        output += `  Status   : Pemicu Obrolan Terkirim! (Hening ${iceRes.elapsedHours.toFixed(1)} jam)\n`;
        output += `  Pesan    : "${iceRes.message?.slice(0, 100)}..."\n`;
      } else {
        output += `  Status   : Dilewati (${iceRes.reason})\n`;
      }
    } catch (e: any) {
      output += `  ERROR Icebreaker: ${e.message}\n`;
    }
  }

  output += `\n===== SELESAI =====\n`;

  return new NextResponse(output, { 
    status: 200, 
    headers: { 'Content-Type': 'text/plain; charset=utf-8' } 
  });
}
