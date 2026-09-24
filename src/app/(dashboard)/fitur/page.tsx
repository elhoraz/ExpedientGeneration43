import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FiturClient from "./FiturClient";

export const metadata = {
  title: "Fitur - Expedient",
};

export default async function FiturPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Timeout wrapper untuk ketahanan koneksi
  const withTimeout = <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> =>
    Promise.race([
      Promise.resolve(promise),
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 4000))
    ]);

  const emptyResult = { data: null, error: null } as any;

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const todayDateStr = `${now.getFullYear()}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

  const [
    profileResult,
    allProfilesResult,
    kasTransactionsResult,
    eventsResult,
  ] = await Promise.allSettled([
    withTimeout(
      supabase
        .from("profiles")
        .select("id, nama_lengkap, nama_panggilan, role, foto_profil, prestise_points")
        .eq("id", user.id)
        .single(),
      emptyResult
    ),
    withTimeout(
      supabase
        .from("profiles")
        .select("id, nama_lengkap, nama_panggilan, foto_profil, tanggal_lahir, no_whatsapp")
        .eq("is_active", true)
        .not("tanggal_lahir", "is", null),
      emptyResult
    ),
    withTimeout(
      supabase
        .from("baitul_maal_transactions")
        .select("amount, transaction_type, status, user_id, created_at")
        .eq("status", "completed"),
      emptyResult
    ),
    withTimeout(
      supabase
        .from("events")
        .select("id, title, event_date, location")
        .gte("event_date", todayDateStr)
        .order("event_date", { ascending: true })
        .limit(1),
      emptyResult
    ),
  ]);

  const userProfile = profileResult.status === "fulfilled" ? profileResult.value.data : null;
  const allProfiles = allProfilesResult.status === "fulfilled" ? (allProfilesResult.value.data || []) : [];
  const kasTransactions = kasTransactionsResult.status === "fulfilled" ? (kasTransactionsResult.value.data || []) : [];
  const events = eventsResult.status === "fulfilled" ? (eventsResult.value.data || []) : [];

  // 1. Data Ulang Tahun (Hari Ini & Terdekat)
  const todayBirthdays: any[] = [];
  const upcomingBirthdays: any[] = [];

  allProfiles.forEach((p: any) => {
    if (!p.tanggal_lahir) return;
    const parts = p.tanggal_lahir.split(/[-/]/);
    if (parts.length < 3) return;
    let m = parseInt(parts[1], 10);
    let d = parseInt(parts[2], 10);
    if (parts[2].length === 4) {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    }
    if (isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return;

    let thisYearBday = new Date(now.getFullYear(), m - 1, d);
    let diffMs = thisYearBday.getTime() - todayMidnight.getTime();
    let daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      let nextYearBday = new Date(now.getFullYear() + 1, m - 1, d);
      daysLeft = Math.round((nextYearBday.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (daysLeft === 0) {
      todayBirthdays.push({ ...p, daysLeft });
    } else {
      upcomingBirthdays.push({ ...p, day: d, daysLeft });
    }
  });

  upcomingBirthdays.sort((a: any, b: any) => a.daysLeft - b.daysLeft);
  const nextBirthday = todayBirthdays.length === 0 && upcomingBirthdays.length > 0 ? upcomingBirthdays[0] : null;

  // 2. Data Kas Baitul Maal
  let totalKas = 0;
  let hasPaidThisMonth = false;
  const currentYearMonth = `${now.getFullYear()}-${String(currentMonth).padStart(2, "0")}`;

  kasTransactions.forEach((t: any) => {
    const isOut = t.transaction_type === "OUT" || t.transaction_type === "pengeluaran";
    const amt = Number(t.amount) || 0;
    if (isOut) totalKas -= amt;
    else totalKas += amt;

    if (t.user_id === user.id && t.created_at?.startsWith(currentYearMonth) && !isOut) {
      hasPaidThisMonth = true;
    }
  });

  // 3. Event Terdekat
  const nearestEvent = events.length > 0 ? events[0] : null;

  return (
    <FiturClient
      userProfile={userProfile}
      birthdayWidget={{
        today: todayBirthdays,
        next: nextBirthday,
      }}
      kasWidget={{
        totalKas: Math.max(0, totalKas),
        hasPaidThisMonth,
      }}
      eventWidget={{
        nearest: nearestEvent,
      }}
    />
  );
}
