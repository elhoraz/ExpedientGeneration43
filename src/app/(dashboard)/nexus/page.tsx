import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NexusClient from "./NexusClient";

export const metadata = {
  title: "The Nexus - Prediksi Eksekutif",
};

export default async function NexusPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: currentUserProfile }, { data: otherProfiles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, foto_profil, motivasi_hidup, cita_cita, alamat_lengkap, syndicate(kategori)")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, foto_profil, motivasi_hidup, cita_cita, alamat_lengkap, syndicate(kategori)")
      .neq("id", user.id),
  ]);

  return (
    <NexusClient 
        currentUser={currentUserProfile} 
        otherProfiles={otherProfiles || []} 
    />
  );
}
