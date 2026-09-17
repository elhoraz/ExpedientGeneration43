import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuranClient from "./QuranClient";

export const metadata = {
  title: "Al-Qur'an Digital 30 Juz - Expedient Generation 43",
  description: "Mushaf Al-Qur'an digital 30 Juz & 114 Surah lengkap (Standar Kemenag RI) dengan audio murottal 6 Qari, transliterasi Latin, terjemahan resmi, tafsir ringkas, dan penanda bacaan.",
};

export default async function QuranPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <QuranClient currentUserId={user.id} />;
}
