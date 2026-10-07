/**
 * Expedient Generation 43 - Birthday Celebrator Module
 * Sistem otomatisasi ucapan ulang tahun / milad dua arah:
 * 1. Personal (Japri 1-on-1 langsung ke nomor WhatsApp santri/alumni)
 * 2. Grup Komunitas Angkatan (Broadcast doa bersama & mention)
 * 3. Tautan kartu ucapan digital interaktif di portal website angkatan
 */
import { createAdminClient } from "@/lib/supabase/admin";

export interface BirthdayAlumni {
  id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  tanggal_lahir: string;
  no_whatsapp?: string;
  foto_profil?: string;
  usia: number;
}

/**
 * Mengambil daftar alumni yang sedang berulang tahun pada hari ini (WIB)
 */
export async function getTodayBirthdayAlumni(): Promise<BirthdayAlumni[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, tanggal_lahir, no_whatsapp, foto_profil")
      .not("tanggal_lahir", "is", null);

    if (error || !data) {
      console.warn("[BIRTHDAY-QUERY-ERR]:", error?.message);
      return [];
    }

    // Hitung berdasarkan tanggal lokal WIB (GMT+7)
    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMonth = (nowWib.getMonth() + 1).toString().padStart(2, "0");
    const currentDay = nowWib.getDate().toString().padStart(2, "0");
    const currentYear = nowWib.getFullYear();

    const matched: BirthdayAlumni[] = [];

    for (const p of data) {
      if (!p.tanggal_lahir || !p.nama_lengkap?.trim()) continue;
      // Format tanggal_lahir: YYYY-MM-DD
      const parts = p.tanggal_lahir.split("-");
      if (parts.length < 3) continue;

      const birthYear = parseInt(parts[0], 10);
      const birthMonth = parts[1].padStart(2, "0");
      const birthDay = parts[2].padStart(2, "0");

      if (birthMonth === currentMonth && birthDay === currentDay) {
        const usia = currentYear - birthYear;
        matched.push({
          id: p.id,
          nama_lengkap: p.nama_lengkap.trim(),
          nama_panggilan: (p.nama_panggilan || "").trim(),
          tanggal_lahir: p.tanggal_lahir,
          no_whatsapp: p.no_whatsapp || undefined,
          foto_profil: p.foto_profil || undefined,
          usia: isNaN(usia) ? 0 : usia,
        });
      }
    }

    return matched;
  } catch (err: any) {
    console.error("[GET-BIRTHDAY-ERR]:", err.message);
    return [];
  }
}

/**
 * Format pesan ucapan selamat ulang tahun / milad yang penuh doa berkah khas santri
 */
/**
 * Format pesan ucapan selamat ulang tahun / milad yang penuh doa berkah untuk Grup WhatsApp Komunitas
 */
export function formatBirthdayGreetingMessage(alumni: BirthdayAlumni): string {
  const panggilan = alumni.nama_panggilan ? alumni.nama_panggilan : alumni.nama_lengkap.split(" ")[0];
  const mentionTag = alumni.no_whatsapp ? `@${alumni.no_whatsapp.replace(/\D/g, "")}` : `*${alumni.nama_lengkap}*`;
  const usiaText = alumni.usia > 0 ? ` ke-${alumni.usia}` : "";
  const bdayLink = `https://expedientgeneration.vercel.app/birthday/${alumni.id}`;

  return (
    `🎉🎂 *BARAKALLAHU FII UMRIK!* 🎂🎉\n\n` +
    `Segenap keluarga besar *Expedient Generation 43 (Arrisalah 2025)* mengucapkan Selamat Milad${usiaText} kepada sahabat kita:\n\n` +
    `👤 *${alumni.nama_lengkap}* (${mentionTag})\n\n` +
    `تَبَارَكَ اللَّهُ فِي عُمْرِكَ، وَبَارَكَ لَكَ فِي صِحَّتِكَ وَرِزْقِكَ وَعَمَلِك\n\n` +
    `_"Semoga senantiasa diberikan keberkahan umur, kesehatan yang afiat, kelapangan rezeki yang halal, serta terus istiqomah menggapai cita-cita mulia dunia dan akhirat."_ 🤲✨\n\n` +
    `💌 Kirim doa & ucapan spesial untuk ${panggilan} di portal angkatan:\n` +
    `🔗 ${bdayLink}\n\n` +
    `Kawan-kawan sekalian, mari kita luangkan sejenak doa terbaik dan ucapan hangat untuk sahabat kita ${panggilan} hari ini! 🎁🥳`
  );
}

/**
 * Format pesan ucapan selamat ulang tahun / milad langsung ke chat pribadi (Japri 1-on-1)
 */
export function formatPersonalBirthdayGreetingMessage(alumni: BirthdayAlumni): string {
  const panggilan = alumni.nama_panggilan ? alumni.nama_panggilan : alumni.nama_lengkap.split(" ")[0];
  const usiaText = alumni.usia > 0 ? ` yang ke-${alumni.usia}` : "";
  const bdayLink = `https://expedientgeneration.vercel.app/birthday/${alumni.id}`;

  return (
    `🎉🎂 *BARAKALLAHU FII UMRIK* 🎂🎉\n\n` +
    `Assalamu'alaikum wr. wb., Sahabat *${panggilan}*! ✨\n\n` +
    `Selamat Ulang Tahun / Milad${usiaText} ya! Semoga di pertambahan usiamu ini, Allah SWT senantiasa melimpahkan:\n` +
    `• Keberkahan umur yang bermanfaat fi fiddin wad dunya wal akhirah\n` +
    `• Kesehatan yang afiat dan keteguhan iman\n` +
    `• Kelapangan rezeki yang halal dan berkah\n` +
    `• Kemudahan serta kelancaran dalam setiap langkah dan cita-citamu\n\n` +
    `تَبَارَكَ اللَّهُ فِي عُمْرِكَ، وَبَارَكَ لَكَ فِي صِحَّتِكَ وَرِزْقِكَ وَعَمَلِك 🤲\n\n` +
    `Teruslah melangkah, menginspirasi, dan menjadi kebanggaan keluarga besar *Expedient Generation 43 (Pondok Modern Arrisalah 2025)*.\n\n` +
    `💌 Buka kartu ucapan spesial angkatan untukmu di sini:\n` +
    `🔗 ${bdayLink}\n\n` +
    `_Salam hangat, doa tulus, dan peluk persaudaraan dari seluruh sahabat seperjuangan!_ 🌟🤝`
  );
}

/**
 * Mengecek dan memicu pengiriman ucapan milad harian otomatis:
 * 1. Dikirim langsung ke Japri Personal alumni yang milad
 * 2. Di-broadcast ke Grup WhatsApp Komunitas Angkatan
 */
export async function checkAndTriggerDailyBirthdayWishes(
  sock: any,
  communityGroupId: string,
  force: boolean = false
): Promise<{ triggered: boolean; count: number }> {
  try {
    if (!communityGroupId) return { triggered: false, count: 0 };

    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const hour = nowWib.getHours();

    // Hindari mengirim di larut malam (antara jam 23:00 sampai 05:59 WIB) kecuali dipaksa (force)
    if (!force && (hour < 6 || hour >= 23)) {
      return { triggered: false, count: 0 };
    }

    const todayDateStr = nowWib.toISOString().slice(0, 10); // YYYY-MM-DD
    const supabase = createAdminClient();

    // 1. Cek apakah ucapan milad hari ini sudah pernah dikirim
    if (!force) {
      const { data: record } = await supabase
        .from("site_content")
        .select("content")
        .eq("key", "wa_last_birthday_wish_date")
        .maybeSingle();

      if (record?.content === todayDateStr) {
        return { triggered: false, count: 0 };
      }
    }

    // 2. Ambil santri yang berulang tahun hari ini
    const birthdays = await getTodayBirthdayAlumni();
    if (birthdays.length === 0) {
      // Tandai hari ini sudah dicek meskipun tidak ada yang milad
      await supabase.from("site_content").upsert({
        key: "wa_last_birthday_wish_date",
        content: todayDateStr,
      });
      return { triggered: false, count: 0 };
    }

    // 3. Kirim ucapan milad untuk setiap santri yang berulang tahun:
    //    A. KE PERSONAL (JAPRI 1-ON-1)
    //    B. KE GRUP KOMUNITAS ANGKATAN
    for (const b of birthdays) {
      // =====================================================================
      // A. JAPRI PERSONAL KE NOMOR ALUMNI
      // =====================================================================
      if (b.no_whatsapp) {
        try {
          const personalMsg = formatPersonalBirthdayGreetingMessage(b);
          let cleanPhone = b.no_whatsapp.replace(/\D/g, "");
          if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.substring(1);
          const personalJid = `${cleanPhone}@s.whatsapp.net`;

          let personalSent = false;
          if (b.foto_profil && b.foto_profil.startsWith("http")) {
            try {
              const imgRes = await fetch(b.foto_profil, { signal: AbortSignal.timeout(10000) });
              if (imgRes.ok) {
                const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
                await sock.sendMessage(personalJid, {
                  image: imgBuffer,
                  caption: personalMsg,
                });
                personalSent = true;
              }
            } catch (_) {}
          }

          if (!personalSent) {
            await sock.sendMessage(personalJid, { text: personalMsg });
          }

          // Catat ke whatsapp_queue
          await supabase.from("whatsapp_queue").insert([{
            no_whatsapp: cleanPhone,
            message: personalMsg,
            status: "sent",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
        } catch (personalErr: any) {
          console.warn(`[BIRTHDAY-PERSONAL-ERR] Gagal japri ke ${b.nama_lengkap}:`, personalErr.message);
        }
      }

      // =====================================================================
      // B. BROADCAST KE GRUP KOMUNITAS ANGKATAN
      // =====================================================================
      try {
        const groupMsg = formatBirthdayGreetingMessage(b);
        const mentions = b.no_whatsapp ? [`${b.no_whatsapp.replace(/\D/g, "")}@s.whatsapp.net`] : [];

        let groupSent = false;
        if (b.foto_profil && b.foto_profil.startsWith("http")) {
          try {
            const imgRes = await fetch(b.foto_profil, { signal: AbortSignal.timeout(10000) });
            if (imgRes.ok) {
              const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
              await sock.sendMessage(communityGroupId, {
                image: imgBuffer,
                caption: groupMsg,
                mentions,
              });
              groupSent = true;
            }
          } catch (_) {}
        }

        if (!groupSent) {
          await sock.sendMessage(communityGroupId, {
            text: groupMsg,
            mentions,
          });
        }

        // Catat ke whatsapp_queue
        await supabase.from("whatsapp_queue").insert([{
          no_whatsapp: communityGroupId.slice(0, 20),
          message: groupMsg,
          status: "sent",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]);
      } catch (groupErr: any) {
        console.warn(`[BIRTHDAY-GROUP-ERR] Gagal broadcast grup untuk ${b.nama_lengkap}:`, groupErr.message);
      }
    }

    // 4. Update status tanggal hari ini sudah selesai dikirim
    await supabase.from("site_content").upsert({
      key: "wa_last_birthday_wish_date",
      content: todayDateStr,
    });

    return { triggered: true, count: birthdays.length };
  } catch (err: any) {
    console.error("[TRIGGER-BIRTHDAY-ERR]:", err.message);
    return { triggered: false, count: 0 };
  }
}

/**
 * Menyusun ringkasan milad bulan ini untuk alumni yang bertanya di grup
 */
export async function getMonthBirthdaySummary(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("nama_lengkap, nama_panggilan, tanggal_lahir")
      .not("tanggal_lahir", "is", null);

    if (!data) return "Data tanggal lahir alumni belum tersedia di sistem.";

    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMonth = (nowWib.getMonth() + 1).toString().padStart(2, "0");
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthName = monthNames[nowWib.getMonth()];

    const matched = data
      .filter((p) => p.tanggal_lahir && p.tanggal_lahir.split("-")[1] === currentMonth && p.nama_lengkap?.trim())
      .sort((a, b) => {
        const dayA = parseInt(a.tanggal_lahir.split("-")[2], 10) || 0;
        const dayB = parseInt(b.tanggal_lahir.split("-")[2], 10) || 0;
        return dayA - dayB;
      });

    if (matched.length === 0) {
      return `📅 *Agenda Milad Bulan ${monthName}*\n\nAlhamdulillah, di bulan ini tidak ada catatan milad alumni tercatat.`;
    }

    const lines = matched.map((p) => {
      const day = parseInt(p.tanggal_lahir.split("-")[2], 10);
      const call = p.nama_panggilan ? ` (${p.nama_panggilan})` : "";
      return `• *${day} ${monthName}*: ${p.nama_lengkap}${call}`;
    });

    return (
      `📅 *AGENDA MILAD ALUMNI BULAN ${monthName.toUpperCase()}*\n\n` +
      `Berikut daftar kawan-kawan Expedient 43 yang berulang tahun di bulan ini:\n\n` +
      lines.join("\n") +
      `\n\n_Mari kita saling doakan keberkahan usia dan persaudaraan kita!_ 🤲✨`
    );
  } catch (err: any) {
    return `Gagal memuat agenda milad: ${err.message}`;
  }
}
