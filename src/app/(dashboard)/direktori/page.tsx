import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DirektoriClient from "./DirektoriClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "The Archive - 43rd Expedient",
};

export default async function DirektoriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get blocked users if user is authenticated
  let blockedUserIds = new Set<string>();
  if (user) {
    try {
      const { data: blocks } = await supabase
        .from("user_blocks")
        .select("blocked_user_id")
        .eq("blocker_id", user.id);

      if (blocks && blocks.length > 0) {
        blocks.forEach((b: any) => blockedUserIds.add(b.blocked_user_id));
      }
    } catch {
      // safe fallback if table does not exist
    }
  }

  // Query profiles with graceful fallback if optional migration columns do not exist
  let safeAlumni: any[] = [];
  const { data: fullAlumni, error: fullError } = await supabase
    .from("profiles")
    .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, foto_profil, tempat_lahir, tanggal_lahir, alamat_lengkap, cita_cita, motivasi_hidup, akun_ig, akun_tiktok, no_whatsapp, role, is_active, prestise_points, kelas, tahun_masuk, tahun_lulus, privacy_settings")
    .or("is_active.eq.true,is_active.is.null")
    .order("id", { ascending: true });

  if (!fullError && fullAlumni) {
    safeAlumni = fullAlumni.filter((a: any) => !blockedUserIds.has(a.id));
  } else {
    // Fallback query without optional un-migrated columns
    const { data: fallbackAlumni, error: fallbackError } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nama_panggilan, jenis_kelamin, foto_profil, tempat_lahir, tanggal_lahir, alamat_lengkap, cita_cita, motivasi_hidup, akun_ig, akun_tiktok, no_whatsapp, role, is_active, prestise_points")
      .or("is_active.eq.true,is_active.is.null")
      .order("id", { ascending: true });

    if (fallbackAlumni) {
      safeAlumni = fallbackAlumni.filter((a: any) => !blockedUserIds.has(a.id));
    }
  }

  // If not logged in, mask private fields (phone, full address, birthdate) for guest privacy protection
  if (!user) {
    safeAlumni = safeAlumni.map((a: any) => ({
      ...a,
      no_whatsapp: null,
      alamat_lengkap: a.alamat_lengkap ? a.alamat_lengkap.split(",").slice(-1)[0].trim() : null, // only general city if present
      tanggal_lahir: null,
    }));
  }

  return <DirektoriClient alumni={safeAlumni} isLoggedIn={!!user} currentUserId={user?.id || null} />;
}

