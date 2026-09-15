import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import KiblatClient from "./KiblatClient";

export const metadata = {
  title: "Astrolabe Kiblat & Waktu Sholat - Expedient Generation 43",
  description: "Instrumen penunjuk arah kiblat interaktif dan jadwal sholat akurat metode Kementerian Agama RI untuk alumni Expedient Generation 43.",
};

export default async function KiblatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <KiblatClient />;
}
