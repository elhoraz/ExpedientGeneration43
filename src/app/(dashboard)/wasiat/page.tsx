import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WasiatClient from "./WasiatClient";
import { getAvatarUrl } from "@/lib/avatar";

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
    author_avatar: getAvatarUrl(w.profiles?.foto_profil, w.profiles?.nama_panggilan || "A")
  })) || [];

  return (
    <WasiatClient currentUser={user} initialWasiats={formattedWasiats} />
  );
}
