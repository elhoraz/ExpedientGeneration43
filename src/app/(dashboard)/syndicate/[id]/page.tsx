import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SyndicateDetailPage from "./SyndicateDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: biz } = await supabase
    .from("syndicate")
    .select("nama_bisnis, tagline, deskripsi")
    .eq("id", id)
    .single();

  if (!biz) {
    return {
      title: "Bisnis Alumni Tidak Ditemukan | Expedient 43",
    };
  }

  return {
    title: `${biz.nama_bisnis} - Jaringan Usaha Alumni Expedient 43`,
    description: biz.tagline || biz.deskripsi?.slice(0, 160) || "Profil bisnis alumni Expedient 43",
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch business with valid owner profile columns
  const { data: business, error } = await supabase
    .from("syndicate")
    .select(`
      *,
      profiles!user_id (
        id,
        nama_lengkap,
        nama_panggilan,
        foto_profil,
        no_whatsapp,
        alamat_lengkap,
        akun_ig
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Syndicate detail fetch error:", error);
  }

  if (error || !business) {
    return notFound();
  }

  // Fetch viewer profile if logged in for personalized WhatsApp greeting
  let viewerProfile = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, nama_panggilan, nama_lengkap")
      .eq("id", user.id)
      .single();
    viewerProfile = profile;
  }

  const isOwner = user ? user.id === business.user_id : false;

  return (
    <SyndicateDetailPage 
      business={business} 
      isOwner={isOwner} 
      viewerName={viewerProfile?.nama_panggilan || viewerProfile?.nama_lengkap || "Rekan Alumni"}
    />
  );
}
