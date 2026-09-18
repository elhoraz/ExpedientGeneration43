import { createClient } from "@/lib/supabase/server";
import QuranClient from "./QuranClient";

export const metadata = {
  title: "Al-Qur'an Digital 30 Juz - Expedient Generation 43",
  description: "Mushaf Al-Qur'an digital 30 Juz & 114 Surah lengkap (Standar Kemenag RI) dengan audio murottal 6 Qari, transliterasi Latin, terjemahan resmi, tafsir ringkas, dan penanda bacaan.",
};

export default async function QuranPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string; juz?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const initialTab: "cordoba" | "surahList" | "khataman" =
    params?.tab === "khatam" || params?.tab === "khataman"
      ? "khataman"
      : params?.tab === "surahList"
      ? "surahList"
      : "cordoba";

  let currentUser = {
    id: user ? user.id : "guest",
    name: user?.user_metadata?.nama_panggilan || user?.user_metadata?.nama_lengkap || "Tamu Arrisalah",
    avatar: user?.user_metadata?.avatar_url || null,
  };

  if (user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("nama_panggilan, nama_lengkap, foto_profil")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        currentUser = {
          id: user.id,
          name: profile.nama_panggilan || profile.nama_lengkap || currentUser.name,
          avatar: profile.foto_profil || currentUser.avatar,
        };
      }
    } catch (e) {
      console.warn("Quran page profile fetch error:", e);
    }
  }

  const parsedPage = params?.page ? parseInt(params.page, 10) : undefined;
  const parsedJuz = params?.juz ? parseInt(params.juz, 10) : undefined;

  return (
    <QuranClient
      currentUserId={currentUser.id}
      currentUser={currentUser}
      initialTab={initialTab}
      initialPage={!isNaN(parsedPage as number) ? parsedPage : undefined}
      initialJuz={!isNaN(parsedJuz as number) ? parsedJuz : undefined}
    />
  );
}
