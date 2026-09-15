import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AsmaulHusnaClient from "./AsmaulHusnaClient";

export const metadata = {
  title: "99 Asmaul Husna Interaktif & Tadabbur - Expedient Generation 43",
  description: "Eksplorasi spiritual 99 Nama Agung Allah SWT dengan Galeri Permata Emas, lembar tadabbur & dalil Al-Qur'an, mode tasbih dzikir haptic interaktif, pemutar murattal audio sekuensial, dan generator story WhatsApp.",
};

export default async function AsmaulHusnaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AsmaulHusnaClient />;
}
