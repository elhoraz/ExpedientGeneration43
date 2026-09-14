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

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const todayDateStr = today.toISOString().split("T")[0];

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
  const todayBirthdays = allProfiles.filter((p: any) => {
    if (!p.tanggal_lahir) return false;
    const parts = p.tanggal_lahir.split(/[-/]/);
    if (parts.length < 3) return false;
    return parseInt(parts[1], 10) === currentMonth && parseInt(parts[2], 10) === currentDay;
  });

  let nextBirthday: any = null;
  if (todayBirthdays.length === 0) {
    const upcoming = allProfiles
      .map((p: any) => {
        if (!p.tanggal_lahir) return null;
        const parts = p.tanggal_lahir.split(/[-/]/);
        if (parts.length < 3) return null;
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (m === currentMonth && d > currentDay) {
          return { ...p, day: d, daysLeft: d - currentDay };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

    if (upcoming.length > 0) {
      nextBirthday = upcoming[0];
    }
  }

  // 2. Data Kas Baitul Maal
  let totalKas = 0;
  let hasPaidThisMonth = false;
  const currentYearMonth = `${today.getFullYear()}-${String(currentMonth).padStart(2, "0")}`;

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
