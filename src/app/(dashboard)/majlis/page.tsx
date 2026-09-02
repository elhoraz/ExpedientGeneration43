import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MajlisLoader from "./MajlisLoader";

export const metadata = {
  title: "Majlis Syura Eksklusif - Expedient",
};

export default async function MajlisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nama_panggilan, role, foto_profil")
    .eq("id", user.id)
    .single();

  const avatarUrl = profile?.foto_profil
    ? (profile.foto_profil.startsWith("http")
        ? profile.foto_profil
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/${profile.foto_profil}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nama_panggilan || 'A')}&background=d4af37&color=000`;

  const currentUser = {
    id: user.id,
    name: profile?.nama_panggilan || "Entitas Anonim",
    role: profile?.role || "member",
    avatar: avatarUrl,
  };

  // Fetch topics
  const { data: topics } = await supabase
    .from("majlis_topics")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch creator names
  const creatorIds = Array.from(new Set(topics?.map((t: any) => t.created_by).filter(Boolean)));
  const profileMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nama_panggilan")
      .in("id", creatorIds);
    profiles?.forEach((p: any) => profileMap.set(p.id, p.nama_panggilan));
  }

  const { data: myVotes } = await supabase
    .from('majlis_votes')
    .select('topic_id')
    .eq('user_id', user.id);
  const votedTopicIds = new Set(myVotes?.map((v: any) => v.topic_id));

  const formattedTopics = (topics || []).map((t: any) => ({
    ...t,
    creator_name: profileMap.get(t.created_by) || "Anonim",
    has_voted: votedTopicIds.has(t.id)
  }));

  return (
    <MajlisLoader currentUser={currentUser} initialTopics={formattedTopics} />
  );
}
