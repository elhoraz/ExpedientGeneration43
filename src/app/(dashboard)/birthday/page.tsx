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

  // Get current day and month
  const today = new Date();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate(); // 1-31

  // Fetch users with birthday today
  // PostgreSQL extract function doesn't work directly with Supabase eq on dates easily,
  // we'll fetch all and filter for now (or write a rpc, but let's filter for simplicity since it's < 200 users)
  const { data: allUsers } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, foto_profil, tanggal_lahir")
      .not("tanggal_lahir", "is", null);

  const birthdayUsers = (allUsers || []).filter(u => {
      if (!u.tanggal_lahir) return false;
      const parts = u.tanggal_lahir.split(/[-/]/);
      if (parts.length < 3) return false;
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return month === currentMonth && day === currentDay;
  });

  return <BirthdayListClient birthdayUsers={birthdayUsers} />;
}
