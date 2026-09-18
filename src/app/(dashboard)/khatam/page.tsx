import { redirect } from "next/navigation";

export const metadata = {
  title: "Khatam Bersama Real-Time - Expedient Generation 43",
  description: "One Member One Juz — Papan pembagian 30 Juz Al-Qur'an terintegrasi untuk khataman angkatan Expedient Generation 43.",
};

export default async function KhatamPage() {
  redirect("/quran?tab=khataman");
}

