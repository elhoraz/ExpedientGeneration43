export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { verifySignedAdminSession } from "@/lib/admin-auth";

async function getAdminContext() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  // 1. Validasi via Token Sesi Admin HMAC
  const isSignedAdmin = await verifySignedAdminSession(adminToken);
  const isLegacyUnlocked = adminToken === "unlocked";

  if (isSignedAdmin || isLegacyUnlocked) {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    return { ok: true, supabase, currentAdmin: user };
  }

  // 2. Validasi via Supabase Auth Role
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin" || profile?.role === "superadmin") {
      return { ok: true, supabase, currentAdmin: user };
    }
  }

  return { ok: false, error: "Unauthorized: Sesi admin tidak valid atau telah kedaluwarsa", status: 401 };
}

/**
 * PATCH: Mengubah status aktif/nonaktif atau role pengguna
 */
export async function PATCH(request: Request) {
  try {
    const auth = await getAdminContext();
    if (!auth.ok || !auth.supabase) {
      return NextResponse.json({ message: auth.error }, { status: auth.status || 401 });
    }

    const body = await request.json();
    const { userId, is_active, role } = body;

    if (!userId) {
      return NextResponse.json({ message: "userId diperlukan." }, { status: 400 });
    }

    const updates: Record<string, any> = {};

    if (typeof is_active === "boolean") {
      updates.is_active = is_active;
      // Perbarui juga status ban di Supabase Auth
      try {
        await auth.supabase.auth.admin.updateUserById(userId, {
          ban_duration: is_active ? "none" : "876000h",
        });
      } catch (authBanErr) {
        console.warn("[ADMIN-AUTH-BAN-WARN]:", authBanErr);
      }
    }

    if (role && typeof role === "string") {
      const validRoles = ["member", "bendahara", "admin"];
      if (validRoles.includes(role.toLowerCase())) {
        updates.role = role.toLowerCase();
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "Tidak ada data perubahan yang valid." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("[ADMIN-USER-PATCH-ERROR]:", error);
      return NextResponse.json({ message: "Gagal memperbarui profil pengguna: " + error.message }, { status: 500 });
    }

    return NextResponse.json({
      status: "success",
      message: "Data pengguna berhasil diperbarui.",
      profile: data,
    });
  } catch (err: any) {
    console.error("[ADMIN-USERS-PATCH-EXCEPTION]:", err);
    return NextResponse.json({ message: err?.message || "Terjadi kesalahan server." }, { status: 500 });
  }
}

/**
 * DELETE: Menghapus pengguna secara permanen dari Supabase Auth dan tabel profil
 */
export async function DELETE(request: Request) {
  try {
    const auth = await getAdminContext();
    if (!auth.ok || !auth.supabase) {
      return NextResponse.json({ message: auth.error }, { status: auth.status || 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ message: "userId diperlukan." }, { status: 400 });
    }

    // Larang admin menghapus akunnya sendiri
    if (auth.currentAdmin && auth.currentAdmin.id === userId) {
      return NextResponse.json(
        { message: "Aksi ditolak: Anda tidak dapat menghapus akun admin yang sedang Anda gunakan." },
        { status: 400 }
      );
    }

    // 1. Hapus dari tabel profiles terlebih dahulu
    const { error: profileDeleteError } = await auth.supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.warn("[ADMIN-PROFILE-DELETE-WARN]:", profileDeleteError);
    }

    // 2. Hapus dari Supabase Auth (auth.users)
    const { error: authDeleteError } = await auth.supabase.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("[ADMIN-AUTH-DELETE-ERROR]:", authDeleteError);
      return NextResponse.json(
        { message: "Gagal menghapus pengguna dari autentikasi: " + authDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Pengguna berhasil dihapus secara permanen dari database.",
    });
  } catch (err: any) {
    console.error("[ADMIN-USERS-DELETE-EXCEPTION]:", err);
    return NextResponse.json({ message: err?.message || "Terjadi kesalahan server." }, { status: 500 });
  }
}
