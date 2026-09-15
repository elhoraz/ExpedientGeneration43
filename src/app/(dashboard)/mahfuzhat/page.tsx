import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MahfuzhatClient from "./MahfuzhatClient";

export const metadata = {
  title: "Mahfuzhat & Hikmah Santri - Expedient Generation 43",
  description: "Koleksi kata mutiara Arab pesantren (Mahfuzhat), kuis interaktif sambung kalimat berhadiah predikat, dan generator story card WhatsApp/Instagram bernuansa Obsidian Gold.",
};

export default async function MahfuzhatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MahfuzhatClient />;
}
