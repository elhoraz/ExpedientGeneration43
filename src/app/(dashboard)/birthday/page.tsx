import { createClient } from "@/lib/supabase/server";
import BirthdayListClient from "./BirthdayListClient";
import "./birthday.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ulang Tahun Sahabat - Expedient 43",
  description: "Kalender dan ucapan selamat ulang tahun alumni angkatan ke-43 Pondok Modern Arrisalah Slahung Ponorogo.",
};

export default async function BirthdayListPage() {
  const supabase = await createClient();

  // Get current day and month in Asia/Jakarta timezone (WIB)
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Fetch users with birthday
  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, foto_profil, tanggal_lahir, no_whatsapp")
    .not("tanggal_lahir", "is", null);

  const birthdayUsers: any[] = [];
  const upcomingUsers: any[] = [];

  for (const u of (allUsers || [])) {
    if (!u.tanggal_lahir) continue;
    const parts = u.tanggal_lahir.split(/[-/]/);
    if (parts.length < 3) continue;
    let m = parseInt(parts[1], 10);
    let d = parseInt(parts[2], 10);
    if (parts[2].length === 4) {
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
    }
    if (isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) continue;

    let thisYearBday = new Date(now.getFullYear(), m - 1, d);
    let diffMs = thisYearBday.getTime() - todayMidnight.getTime();
    let daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      // Birthday already passed this year, compute for next year
      let nextYearBday = new Date(now.getFullYear() + 1, m - 1, d);
      daysLeft = Math.round((nextYearBday.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (daysLeft === 0) {
      birthdayUsers.push({ ...u, daysLeft });
    } else {
      upcomingUsers.push({ ...u, birthMonth: m, birthDay: d, daysLeft });
    }
  }

  // Sort upcoming by days remaining
  upcomingUsers.sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <BirthdayListClient 
      birthdayUsers={birthdayUsers} 
      upcomingUsers={upcomingUsers.slice(0, 12)}
    />
  );
}
