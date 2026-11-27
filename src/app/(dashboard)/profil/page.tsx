import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfilClient from "./ProfilClient";

export const metadata = {
  title: "Profil Alumni - Expedient",
};

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile, isolated biometric face data, and passkey biometrics in parallel
  const [{ data: profile }, { data: faceRecord }, { data: biometrics }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, role, prestise_points, is_active, foto_profil, no_whatsapp, wa_notif_opt_in, alamat_lengkap, akun_ig, akun_tiktok, motivasi_hidup, cita_cita")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_face_data")
      .select("face_data")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_biometrics")
      .select("id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  // Merge email from auth user into profile data with resilient fallback
  const userData = {
    id: user.id,
    nama_lengkap: profile?.nama_lengkap || user.user_metadata?.nama_lengkap || user.user_metadata?.full_name || "Alumni Expedient",
    nama_panggilan: profile?.nama_panggilan || user.user_metadata?.nama_panggilan || "Alumni",
    role: profile?.role || "user",
    prestise_points: profile?.prestise_points || 0,
    is_active: profile?.is_active ?? true,
    ...(profile || {}),
    face_data: faceRecord?.face_data || null,
    email: user.email || "",
  };

  return <ProfilClient user={userData} initialBiometrics={biometrics || []} />;
}
