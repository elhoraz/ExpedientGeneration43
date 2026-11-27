import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SyndicateClient from "./SyndicateClient";

export const metadata = {
  title: "Jejaring Bisnis Alumni - Expedient 43",
};

export default async function SyndicatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const [{ data: viewerProfile }, { data: portofolio, error }] = await Promise.all([
    supabase
      .from("profiles")
      .select("nama_panggilan, nama_lengkap")
      .eq("id", user.id)
      .single(),
    supabase
      .from("syndicate")
      .select(`
        id,
        nama_bisnis,
        kategori,
        tagline,
        deskripsi,
        logo_bisnis,
        banner_url,
        link_url,
        kota,
        alamat,
        promo_alumni,
        jam_operasional,
        maps_url,
        theme,
        marketplace_links,
        produk_layanan,
        user_id,
        profiles!user_id (
          nama_panggilan,
          nama_lengkap,
          foto_profil,
          no_whatsapp
        )
      `)
      .order("created_at", { ascending: false }),
  ]);

  const viewerName = viewerProfile?.nama_panggilan || viewerProfile?.nama_lengkap || "Rekan Alumni";

  if (error) {
    console.error("Error fetching syndicate:", error);
  }

  return (
    <SyndicateClient 
      initialPortofolio={portofolio || []} 
      userId={user.id} 
      viewerName={viewerName}
    />
  );
}
