import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TasbihClient from "./TasbihClient";

export const metadata = {
  title: "Tasbih Digital Haptic - Expedient Generation 43",
  description: "Tasbih digital interaktif dengan umpan balik getar haptic smartphone, animasi cincin mutiara emas, dan kumpulan dzikir harian mustajab.",
};

export default async function TasbihPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <TasbihClient />;
}
