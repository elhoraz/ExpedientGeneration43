import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BirthdayClient from "./BirthdayClient";

export const metadata = {
  title: "Selamat Ulang Tahun!",
};

export default async function BirthdayPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const userId = resolvedParams.id;
  const supabase = await createClient();

  const { data: userProfile, error } = await supabase
    .from("profiles")
    .select("id, nama_panggilan, tanggal_lahir, foto_profil")
    .eq("id", userId)
    .single();

  if (error || !userProfile || !userProfile.tanggal_lahir) {
    return notFound();
  }

  // Calculate age
  const birthDate = new Date(userProfile.tanggal_lahir);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Generate seed from UUID string (sum of char codes)
  let seed = 0;
  for (let i = 0; i < userId.length; i++) {
    seed += userId.charCodeAt(i);
  }

  return (
    <BirthdayClient 
      userProfile={userProfile} 
      age={age} 
      seed={seed} 
    />
  );
}
