import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KhatamClient from "./KhatamClient";
import { JUZ_DATA } from "@/app/api/khatam/route";

export const metadata = {
  title: "Khatam Bersama Real-Time - Expedient Generation 43",
  description: "One Member One Juz — Papan pembagian 30 Juz Al-Qur'an terintegrasi untuk khataman angkatan Expedient Generation 43.",
};

export default async function KhatamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch current user's profile
  let currentUser = {
    id: user.id,
    name: user.user_metadata?.nama_panggilan || user.user_metadata?.nama_lengkap || "Sahabat 43",
    avatar: user.user_metadata?.avatar_url || null,
  };

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
    console.warn("Khatam page profile fetch error:", e);
  }

  // Fetch initial session & allocations from Supabase
  let initialSession: any = null;
  let initialAllocations: any[] = [];

  try {
    const { data: session } = await supabase
      .from("khatam_sessions")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (session) {
      const { data: allocations } = await supabase
        .from("khatam_allocations")
        .select("*")
        .eq("session_id", session.id)
        .order("juz_number", { ascending: true });

      if (allocations && allocations.length > 0) {
        initialSession = session;
        initialAllocations = allocations;
      }
    }
  } catch (e) {
    console.warn("Khatam table read fallback:", e);
  }

  // Fallback initial state if tables don't exist yet
  if (!initialSession || initialAllocations.length === 0) {
    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
    nextFriday.setHours(18, 0, 0, 0);

    initialSession = {
      id: "session-fallback-active",
      title: "Khataman Pekanan Angkatan 43",
      target_date: nextFriday.toISOString(),
      status: "active",
      total_juz_completed: 0,
      created_at: new Date().toISOString(),
    };

    initialAllocations = JUZ_DATA.map((item) => ({
      id: `alloc-${item.juz}`,
      session_id: initialSession.id,
      juz_number: item.juz,
      surah_range: item.range,
      user_id: null,
      user_name: null,
      user_avatar: null,
      status: "available",
      claimed_at: null,
      completed_at: null,
    }));
  }

  return (
    <KhatamClient
      initialSession={initialSession}
      initialAllocations={initialAllocations}
      currentUser={currentUser}
    />
  );
}
