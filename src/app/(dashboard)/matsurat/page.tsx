import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MatsuratClient from "./MatsuratClient";

export const metadata = {
  title: "Al-Ma’tsurat Digital - Expedient Generation 43",
  description: "Dzikir Pagi dan Petang otentik Al-Ma'tsurat (Sughro & Kubro) dengan penghitung haptic tasbih interaktif, audio tilawah, dan doa ikatan hati Rabithah alumni.",
};

export default async function MatsuratPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MatsuratClient />;
}
