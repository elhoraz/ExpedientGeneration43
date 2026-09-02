import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SyndicateClient from "./SyndicateClient";

export const metadata = {
  title: "The Syndicate - Ruang Eksekutif 42nd Expedient",
};

export default async function SyndicatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Fetch syndicate portofolio
  const { data: portofolio, error } = await supabase
    .from("syndicate")
    .select(`
      id,
      nama_bisnis,
      kategori,
      deskripsi,
      logo_bisnis,
      link_url,
      user_id,
      profiles!user_id (
        nama_panggilan,
        foto_profil,
        no_whatsapp
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching syndicate:", error);
  }

  return <SyndicateClient initialPortofolio={portofolio || []} userId={user.id} />;
}
