import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SovereignClient from "./SovereignClient";

export const metadata = {
  title: "Sovereign Vault - Expedient",
};

export default async function SovereignPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("[Sovereign] Supabase error:", error.message);
  }

  if (!profile) {
    redirect("/beranda");
  }

  return <SovereignClient user={profile} />;
}
