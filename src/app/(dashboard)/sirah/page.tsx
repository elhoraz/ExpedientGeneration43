import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SirahClient from "./SirahClient";

export const metadata = {
  title: "Sirah Nabawiyah & Peta Jejak Islam 3D - Expedient Generation 43",
  description: "Ekspedisi sejarah dan kepemimpinan Islam interaktif: peta kartografi manuskrip kuno 2.5D Jazirah Arab, linimasa peristiwa agung Makkah & Madinah, dan tadabbur prinsip kepemimpinan modern.",
};

export default async function SirahPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SirahClient />;
}
