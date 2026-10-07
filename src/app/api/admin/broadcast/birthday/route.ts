export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";
import { sendWhatsAppMessage, sendWhatsAppMessageWithDetail, sendWhatsAppGroupMessage, getCommunityGroupId } from "@/lib/whatsapp";
import { formatPersonalBirthdayGreetingMessage, formatBirthdayGreetingMessage, BirthdayAlumni } from "@/lib/whatsapp/birthdayCelebrator";

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
      .select("id, nama_panggilan, nama_lengkap, no_whatsapp, tanggal_lahir, foto_profil")
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

    let sentPersonal = 0;
    let sentGroup = 0;
    let skipped = 0;
    let failed = 0;
    const details: any[] = [];
    const commGroupId = getCommunityGroupId();

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
      const age = rawAge > 0 && rawAge < 120 && birthYear < nowWib.getFullYear() ? rawAge : 0;
      const name = celebrant.nama_panggilan || celebrant.nama_lengkap;

      const alumniObj: BirthdayAlumni = {
        id: celebrant.id,
        nama_lengkap: celebrant.nama_lengkap,
        nama_panggilan: celebrant.nama_panggilan || "",
        no_whatsapp: celebrant.no_whatsapp,
        tanggal_lahir: celebrant.tanggal_lahir,
        foto_profil: celebrant.foto_profil || null,
        usia: age,
      };

      // Anti-duplication: Cek apakah hari ini sudah pernah berhasil dikirim ucapan ke nomor personal ini
      const { data: existingWish } = await adminSupabase
        .from("whatsapp_queue")
        .select("id")
        .eq("no_whatsapp", celebrant.no_whatsapp)
        .eq("status", "sent")
        .ilike("message", "%Ulang Tahun%")
        .gte("created_at", startOfDay.toISOString())
        .maybeSingle();

      if (existingWish) {
        skipped++;
        details.push({ name, phone: celebrant.no_whatsapp, status: "skipped", reason: "Sudah dikirim japri hari ini" });
      } else {
        // 1. Kirim Japri Personal (1-on-1) dengan lampiran foto profil & link kartu ucapan
        const personalMessage = formatPersonalBirthdayGreetingMessage(alumniObj);
        const sendRes = await sendWhatsAppMessageWithDetail(celebrant.no_whatsapp, personalMessage, {
          imageUrl: celebrant.foto_profil || undefined,
        });

        await adminSupabase.from("whatsapp_queue").insert([{
          no_whatsapp: celebrant.no_whatsapp,
          message: personalMessage,
          status: sendRes.success ? "sent" : "failed",
          error_message: sendRes.success ? null : (sendRes.reason || "Gagal terkirim via provider WhatsApp"),
        }]);

        if (sendRes.success) {
          sentPersonal++;
          details.push({ name, phone: celebrant.no_whatsapp, type: "personal", status: "sent" });
        } else {
          failed++;
          details.push({ name, phone: celebrant.no_whatsapp, type: "personal", status: "failed", reason: sendRes.reason });
        }
      }

      // 2. Broadcast ke Grup WhatsApp Komunitas dengan lampiran foto profil & link kartu ucapan
      if (commGroupId) {
        const { data: existingGroupWish } = await adminSupabase
          .from("whatsapp_queue")
          .select("id")
          .eq("no_whatsapp", commGroupId.slice(0, 20))
          .eq("status", "sent")
          .ilike("message", `%${celebrant.nama_lengkap}%`)
          .gte("created_at", startOfDay.toISOString())
          .maybeSingle();

        if (!existingGroupWish) {
          const groupMessage = formatBirthdayGreetingMessage(alumniObj);
          const mentions = celebrant.no_whatsapp ? [`${celebrant.no_whatsapp.replace(/\D/g, "")}@s.whatsapp.net`] : [];
          const groupRes = await sendWhatsAppGroupMessage(commGroupId, groupMessage, {
            imageUrl: celebrant.foto_profil || undefined,
            mentions,
          });

          await adminSupabase.from("whatsapp_queue").insert([{
            no_whatsapp: commGroupId.slice(0, 20),
            message: groupMessage,
            status: groupRes.success ? "sent" : "failed",
            error_message: groupRes.success ? null : (groupRes.reason || "Gagal broadcast grup komunitas"),
          }]);

          if (groupRes.success) {
            sentGroup++;
            details.push({ name, group: commGroupId, type: "group", status: "sent" });
          }
        }
      }
    }

    return jsonResponse("success", `Proses ucapan ulang tahun selesai. Japri terkirim: ${sentPersonal}, Grup terkirim: ${sentGroup}, Dilewati: ${skipped}, Gagal: ${failed}`, {
      sentPersonal,
      sentGroup,
      skipped,
      failed,
      details,
    });
  } catch (err: any) {
    console.error("[ADMIN-BIRTHDAY-POST-ERROR]:", err);
    return jsonResponse("error", err.message || "Gagal memproses ucapan ulang tahun", null, { status: 500 });
  }
}
