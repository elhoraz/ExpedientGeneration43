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
    .maybeSingle();

  // Merge email from auth user into profile data with resilient fallback
  const userData = {
    id: user.id,
    nama_lengkap: profile?.nama_lengkap || user.user_metadata?.nama_lengkap || user.user_metadata?.full_name || "Alumni Expedient",
    nama_panggilan: profile?.nama_panggilan || user.user_metadata?.nama_panggilan || "Alumni",
    role: profile?.role || "user",
    prestise_points: profile?.prestise_points || 0,
    is_active: profile?.is_active ?? true,
    ...(profile || {}),
    email: user.email || "",
  };

  // Fetch registered biometrics
  const { data: biometrics } = await supabase
    .from("user_biometrics")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <ProfilClient user={userData} initialBiometrics={biometrics || []} />;
}
