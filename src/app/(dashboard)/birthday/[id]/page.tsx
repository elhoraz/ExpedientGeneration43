import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BirthdayClient from "./BirthdayClient";
import "../birthday.css";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const supabase = await createClient();
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("nama_panggilan, nama_lengkap, foto_profil")
    .eq("id", resolvedParams.id)
    .single();

  const name = (userProfile?.nama_panggilan || userProfile?.nama_lengkap || "Sahabat").trim();
  const title = `Selamat Ulang Tahun, ${name}! 🎉 | Expedient 43`;
  const description = `Barakallahu fii umrik ${name}! Buka kartu ucapan spesial angkatan ke-43 Pondok Modern Arrisalah dan kirimkan doa terbaikmu.`;
  const imageUrl = userProfile?.foto_profil || "https://expedientgeneration.vercel.app/images/og-birthday.png";

  return {
    title,
    description,
    openGraph: {
      title: `Selamat Ulang Tahun, ${name}! 🎂🎉`,
      description,
      siteName: "Expedient Generation 43",
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: `Foto Profil ${name}`,
        },
      ],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `Selamat Ulang Tahun, ${name}! 🎂🎉`,
      description,
      images: [imageUrl],
    },
  };
}

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

  // Calculate age safely with Asia/Jakarta timezone
  const parts = userProfile.tanggal_lahir.split(/[-/]/);
  let birthYear = parseInt(parts[0], 10);
  let birthMonth = parseInt(parts[1], 10);
  let birthDay = parseInt(parts[2], 10);

  // Handle DD-MM-YYYY format if present
  if (parts.length >= 3 && parts[2].length === 4) {
    birthYear = parseInt(parts[2], 10);
    birthMonth = parseInt(parts[1], 10);
    birthDay = parseInt(parts[0], 10);
  }

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  let age = now.getFullYear() - birthYear;
  const m = (now.getMonth() + 1) - birthMonth;
  if (m < 0 || (m === 0 && now.getDate() < birthDay)) {
    age--;
  }
  if (age < 0 || age > 110) age = 0;

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
