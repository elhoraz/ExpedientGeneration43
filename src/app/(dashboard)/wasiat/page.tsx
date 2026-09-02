import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WasiatClient from "./WasiatClient";

export const metadata = {
  title: "Amanah & Wasiat - The Legacy Vault",
};

export default async function WasiatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all wasiats
  const { data: wasiats } = await supabase
    .from("wasiats")
    .select("*, profiles!wasiats_user_id_fkey(nama_panggilan, foto_profil)")
    .order("created_at", { ascending: false });

  const formattedWasiats = wasiats?.map((w: any) => ({
    ...w,
    author_name: w.profiles?.nama_panggilan || "Anonim",
    author_avatar: w.profiles?.foto_profil ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profiles/${w.profiles.foto_profil}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(w.profiles?.nama_panggilan || 'A')}&background=d4af37&color=000`
  })) || [];

  return (
    <WasiatClient currentUser={user} initialWasiats={formattedWasiats} />
  );
}
