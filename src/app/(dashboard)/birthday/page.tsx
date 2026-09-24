import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BirthdayListClient from "./BirthdayListClient";
import "./birthday.css";

export const metadata = {
  title: "Ulang Tahun Hari Ini - Expedient",
};

export default async function BirthdayListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current day and month in Asia/Jakarta timezone (WIB)
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate(); // 1-31

  // Fetch users with birthday today
  const { data: allUsers } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, foto_profil, tanggal_lahir")
      .not("tanggal_lahir", "is", null);

  const birthdayUsers = (allUsers || []).filter(u => {
      if (!u.tanggal_lahir) return false;
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

  return <BirthdayListClient birthdayUsers={birthdayUsers} />;
}
