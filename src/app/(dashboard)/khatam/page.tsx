import { redirect } from "next/navigation";

export const metadata = {
  title: "Khatam Bersama Real-Time - Expedient Generation 43",
  description: "One Member One Juz: papan pembagian 30 Juz Al-Qur'an untuk khataman bersama Expedient Generation 43.",
};

export default async function KhatamPage() {
  redirect("/quran?tab=khataman");
}

