import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DirektoriClient from "./DirektoriClient";

export const metadata = {
  title: "The Archive - 43rd Expedient",
};

export default async function DirektoriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get blocked users if user is authenticated
  let blockedUserIds = new Set<string>();
  if (user) {
    const { data: blocks } = await supabase
      .from("user_blocks")
      .select("blocked_user_id")
      .eq("blocker_id", user.id);

    if (blocks && blocks.length > 0) {
      blocks.forEach((b: any) => blockedUserIds.add(b.blocked_user_id));
    }
  }

  // Optimized query projecting only needed columns
  const { data: alumni } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, foto_profil, tempat_lahir, tanggal_lahir, alamat_lengkap, kota_asal, cita_cita, motivasi_hidup, akun_ig, akun_tiktok, no_whatsapp, role, is_active")
    .eq("is_active", true)
    .order("id", { ascending: true });

  const safeAlumni = (alumni || []).filter((a: any) => !blockedUserIds.has(a.id));

  return <DirektoriClient alumni={safeAlumni} isLoggedIn={!!user} />;
}
