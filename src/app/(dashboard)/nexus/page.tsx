import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NexusClient from "./NexusClient";

export const metadata = {
  title: "Rekomendasi Relasi & Sinergi - Expedient 43",
};

export default async function NexusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*, syndicate(kategori)")
    .eq("id", user.id)
    .single();

  const { data: otherProfiles } = await supabase
    .from("profiles")
    .select("*, syndicate(kategori)")
    .neq("id", user.id);

  return (
    <NexusClient 
        currentUser={currentUserProfile} 
        otherProfiles={otherProfiles || []} 
    />
  );
}
