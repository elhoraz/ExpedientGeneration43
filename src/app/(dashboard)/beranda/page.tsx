import { createClient } from "@/lib/supabase/server";
import BerandaClient from "./BerandaClient";

export default async function BerandaPage() {
  const supabase = await createClient();

  // Helper: timeout wrapper untuk setiap query (5 detik max)
  const withTimeout = <T,>(promise: PromiseLike<T>, fallback: T): Promise<T> =>
    Promise.race([
      Promise.resolve(promise),
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), 5000))
    ]);

  const emptyResult = { data: null, error: null } as any;

  // Run all database fetches in parallel with individual timeouts
  const [
    userResult,
    galeriResult,
    bukuTamuResult,
    kuratorResult,
    leaderboardResult,
    profilesResult,
  ] = await Promise.allSettled([
    withTimeout(supabase.auth.getUser(), { data: { user: null }, error: null } as any),
    withTimeout(supabase.from("galeri").select("*").order("created_at", { ascending: false }).limit(10), emptyResult),
    withTimeout(supabase.from("buku_tamu").select("id, nama, pesan, created_at").order("created_at", { ascending: false }).limit(5), emptyResult),
    withTimeout(supabase.from("profiles").select("id, nama_lengkap, nama_panggilan, role, foto_profil").eq("role", "admin").eq("is_active", true), emptyResult),
    withTimeout(supabase.from("profiles").select("id, nama_lengkap, nama_panggilan, foto_profil, prestise_points").eq("is_active", true).order("prestise_points", { ascending: false }).limit(5), emptyResult),
    withTimeout(supabase.from("profiles").select("id, nama_lengkap, nama_panggilan, tanggal_lahir, foto_profil").eq("is_active", true), emptyResult),
  ]);

  const user = userResult.status === "fulfilled" ? userResult.value.data?.user : null;
  const isLoggedIn = !!user;

  const galeri = galeriResult.status === "fulfilled" ? (galeriResult.value.data || []) : [];
  const bukuTamu = bukuTamuResult.status === "fulfilled" ? (bukuTamuResult.value.data || []) : [];
  const kurator = kuratorResult.status === "fulfilled" ? (kuratorResult.value.data || []) : [];
  const leaderboard = leaderboardResult.status === "fulfilled" ? (leaderboardResult.value.data || []) : [];
  const allProfiles = profilesResult.status === "fulfilled" ? (profilesResult.value.data || []) : [];

  // Filter Birthday Users
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  
  const birthdayUsers = allProfiles.filter((p: any) => {
    if (!p.tanggal_lahir) return false;
    const parts = p.tanggal_lahir.split(/[-/]/);
    if (parts.length < 3) return false;
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return month === currentMonth && day === currentDay;
  });

  return (
    <BerandaClient 
      galeri={galeri} 
      bukuTamu={bukuTamu}
      kurator={kurator}
      leaderboard={leaderboard}
      birthdayUsers={birthdayUsers}
      isLoggedIn={isLoggedIn}
    />
  );
}
