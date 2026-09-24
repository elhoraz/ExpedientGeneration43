export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const jsonResponse = (
  status: "success" | "error",
  message: string,
  data: unknown = null,
  init?: ResponseInit
) => NextResponse.json({ status, message, data }, init);

// GET: Cek siapa saja yang ulang tahun hari ini dan yang akan datang di bulan ini
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse("error", "Unauthorized", null, { status: 401 });
    }

    const cookieStore = await cookies();
    const adminToken = cookieStore.get("expedient_admin_session")?.value;
    const isValidAdmin = await verifySignedAdminSession(adminToken);
    if (!isValidAdmin) {
      return jsonResponse("error", "Forbidden: Sesi admin tidak valid", null, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const { data: profiles, error } = await adminSupabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, no_whatsapp, tanggal_lahir, foto_profil, is_active")
      .not("tanggal_lahir", "is", null);

    if (error) throw error;

    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMonth = nowWib.getMonth() + 1;
    const currentDay = nowWib.getDate();

    const todayCelebrants: any[] = [];
    const thisMonthCelebrants: any[] = [];

    (profiles || []).forEach((p) => {
      if (!p.tanggal_lahir) return;
      const parts = p.tanggal_lahir.split(/[-/]/);
      if (parts.length < 3) return;
      let month = parseInt(parts[1], 10);
      let day = parseInt(parts[2], 10);
      let birthYear = parseInt(parts[0], 10);
      if (parts[2].length === 4) {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        birthYear = parseInt(parts[2], 10);
      }
      let rawAge = nowWib.getFullYear() - birthYear;
      const m = (nowWib.getMonth() + 1) - month;
      if (m < 0 || (m === 0 && nowWib.getDate() < day)) {
        rawAge--;
      }
      const age = rawAge > 0 && rawAge < 120 && birthYear < nowWib.getFullYear() ? rawAge : null;

      const item = {
        id: p.id,
        nama_lengkap: p.nama_lengkap,
        nama_panggilan: p.nama_panggilan,
        no_whatsapp: p.no_whatsapp,
        tanggal_lahir: p.tanggal_lahir,
        foto_profil: p.foto_profil,
        is_active: p.is_active,
        age,
        day,
        month,
      };

      if (month === currentMonth && day === currentDay) {
        todayCelebrants.push(item);
      }
      if (month === currentMonth) {
        thisMonthCelebrants.push(item);
      }
    });

    // Urutkan yang ultah bulan ini berdasarkan hari
    thisMonthCelebrants.sort((a, b) => a.day - b.day);

    // Ambil log ucapan ultah yang dikirim di whatsapp_queue
    const { data: recentBirthdayLogs } = await adminSupabase
      .from("whatsapp_queue")
      .select("*")
      .ilike("message", "%Ulang Tahun%")
      .order("created_at", { ascending: false })
      .limit(20);

    return jsonResponse("success", "Data ulang tahun berhasil dimuat", {
      today: {
        date: nowWib.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }),
        count: todayCelebrants.length,
        celebrants: todayCelebrants,
      },
      this_month: {
        count: thisMonthCelebrants.length,
        celebrants: thisMonthCelebrants,
      },
      logs: recentBirthdayLogs || [],
    });
  } catch (err: any) {
    console.error("[ADMIN-BIRTHDAY-GET-ERROR]:", err);
    return jsonResponse("error", err.message || "Gagal memuat data ulang tahun", null, { status: 500 });
  }
}

// POST: Trigger pengiriman ucapan ulang tahun hari ini secara manual dari admin panel
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse("error", "Unauthorized", null, { status: 401 });
    }

    const cookieStore = await cookies();
    const adminToken = cookieStore.get("expedient_admin_session")?.value;
    const isValidAdmin = await verifySignedAdminSession(adminToken);
    if (!isValidAdmin) {
      return jsonResponse("error", "Forbidden: Sesi admin tidak valid", null, { status: 403 });
    }

    const adminSupabase = createAdminClient();
    const nowWib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMonth = nowWib.getMonth() + 1;
    const currentDay = nowWib.getDate();

    const { data: users, error } = await adminSupabase
      .from("profiles")
      .select("id, nama_panggilan, nama_lengkap, no_whatsapp, tanggal_lahir")
      .eq("is_active", true);

    if (error) throw error;

    const todayCelebrants = (users || []).filter((u) => {
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

    if (todayCelebrants.length === 0) {
      return jsonResponse("success", "Tidak ada alumni yang berulang tahun hari ini.", {
        sent: 0,
        skipped: 0,
        failed: 0,
      });
    }

    const startOfDay = new Date(nowWib.getFullYear(), nowWib.getMonth(), nowWib.getDate(), 0, 0, 0);

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const details: any[] = [];

    for (const celebrant of todayCelebrants) {
      const parts = celebrant.tanggal_lahir.split(/[-/]/);
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
      const name = celebrant.nama_panggilan || celebrant.nama_lengkap;

      // Anti-duplication: Cek apakah hari ini sudah pernah dikirim ucapan ke nomor ini
      const { data: existingWish } = await adminSupabase
        .from("whatsapp_queue")
        .select("id")
        .eq("no_whatsapp", celebrant.no_whatsapp)
        .ilike("message", "%Ulang Tahun%")
        .gte("created_at", startOfDay.toISOString())
        .maybeSingle();

      if (existingWish) {
        skipped++;
        details.push({ name, phone: celebrant.no_whatsapp, status: "skipped", reason: "Sudah dikirim hari ini" });
        continue;
      }

      const ageStr = isAgeValid ? ` yang ke-${rawAge}` : "";
      const bdayLink = `https://expedientgeneration.vercel.app/birthday/${celebrant.id}`;
      const message = `🎉 *BARAKALLAHU FII UMRIK* 🎉

Selamat Ulang Tahun${ageStr}, Sahabat *${name}*! 🎂✨

Semoga Allah SWT senantiasa melimpahkan keberkahan, kesehatan, keselamatan, dan kesuksesan dunia-akhirat. Teruslah menjadi inspirasi dan kebanggaan keluarga besar *Expedient Generation — 43rd Arrisalah*.

Buka kartu ucapan spesial angkatan untukmu:
🔗 ${bdayLink}

Salam hangat & doa terbaik dari seluruh sahabat Expedient! 🌟`;

      const isSuccess = await sendWhatsAppMessage(celebrant.no_whatsapp, message);

      await adminSupabase.from("whatsapp_queue").insert([{
        no_whatsapp: celebrant.no_whatsapp,
        message,
        status: isSuccess ? "sent" : "failed",
        error_message: isSuccess ? null : "Gagal terkirim via provider WhatsApp",
      }]);

      if (isSuccess) {
        sent++;
        details.push({ name, phone: celebrant.no_whatsapp, status: "sent" });
      } else {
        failed++;
        details.push({ name, phone: celebrant.no_whatsapp, status: "failed" });
      }
    }

    return jsonResponse("success", `Proses ucapan ulang tahun selesai. Terkirim: ${sent}, Dilewati: ${skipped}, Gagal: ${failed}`, {
      sent,
      skipped,
      failed,
      details,
    });
  } catch (err: any) {
    console.error("[ADMIN-BIRTHDAY-POST-ERROR]:", err);
    return jsonResponse("error", err.message || "Gagal memproses ucapan ulang tahun", null, { status: 500 });
  }
}
