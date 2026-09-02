import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfilClient from "./ProfilClient";

export const metadata = {
  title: "Profil Eksklusif - Expedient",
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile data from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/beranda");
  }

  // Fetch registered biometrics
  const { data: biometrics } = await supabase
    .from("user_biometrics")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Merge email from auth user into profile data
  const userData = {
    ...profile,
    email: user.email || "",
  };

  return <ProfilClient user={userData} initialBiometrics={biometrics || []} />;
}
