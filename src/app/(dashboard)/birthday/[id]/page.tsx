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
    .select("id, nama_panggilan, nama_lengkap, tanggal_lahir, foto_profil, no_whatsapp")
    .eq("id", userId)
    .single();

  if (error || !userProfile || !userProfile.tanggal_lahir) {
    return notFound();
  }

  // Calculate age safely without timezone drift
  const parts = userProfile.tanggal_lahir.split(/[-/]/);
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = (today.getMonth() + 1) - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
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
