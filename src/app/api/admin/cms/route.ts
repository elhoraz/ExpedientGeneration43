export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifySignedAdminSession } from "@/lib/admin-auth";

async function getAdminContext() {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;

  // 1. Validasi via Token Sesi Admin HMAC
  const isSignedAdmin = await verifySignedAdminSession(adminToken);
  const isLegacyUnlocked = adminToken === "unlocked";

  if (isSignedAdmin || isLegacyUnlocked) {
    const adminClient = createAdminClient();
    return { ok: true, supabase: adminClient, adminSupabase: adminClient };
  }

  // 2. Validasi via Supabase Auth Role
  try {
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await userSupabase.auth.getUser();
    if (user) {
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "superadmin") {
        return { ok: true, supabase: adminClient, adminSupabase: adminClient };
      }
    }
  } catch (err) {
    console.warn("[ADMIN-CMS-AUTH-CHECK-WARN]:", err);
  }

  return { 
    ok: false, 
    error: "Sesi admin Anda tidak valid atau telah kedaluwarsa. Silakan masukkan sandi admin kembali di /admin/unlock.", 
    status: 401 
  };
}

/**
 * POST: Menyimpan perubahan konten CMS
 */
export async function POST(request: Request) {
  try {
    const auth = await getAdminContext();
    if (!auth.ok || !auth.supabase) {
      return NextResponse.json({ message: auth.error }, { status: auth.status || 401 });
    }

    const body = await request.json();
    const { contents, updates, deletions, newKeys } = body;

    // Skenario 1: Batch sync berbasis array contents
    if (Array.isArray(contents) && contents.length > 0) {
      const dataToUpsert = contents.map((c: any) => ({
        content_key: c.content_key,
        content_value: c.content_value ?? "",
        content_type: c.content_type || "text",
        updated_at: new Date().toISOString(),
      }));

      const { error: upsertErr } = await auth.supabase
        .from("site_content")
        .upsert(dataToUpsert, { onConflict: "content_key" });

      if (upsertErr) {
        console.error("[ADMIN-CMS-UPSERT-ERR]:", upsertErr);
        return NextResponse.json(
          { message: "Gagal menyimpan ke site_content: " + upsertErr.message },
          { status: 500 }
        );
      }
    }

    // Skenario 2: Batch sync per-patch (updates, deletions, newKeys)
    if (updates && typeof updates === "object") {
      for (const [id, value] of Object.entries(updates)) {
        await auth.supabase
          .from("site_content")
          .update({ content_value: value, updated_at: new Date().toISOString() })
          .eq("id", id);
      }
    }

    if (Array.isArray(deletions) && deletions.length > 0) {
      await auth.supabase
        .from("site_content")
        .delete()
        .in("id", deletions);
    }

    if (Array.isArray(newKeys) && newKeys.length > 0) {
      const inserts = newKeys.map((nk: any) => ({
        content_key: nk.key,
        content_value: nk.value ?? "",
        content_type: nk.type || "text",
        updated_at: new Date().toISOString(),
      }));
      await auth.supabase
        .from("site_content")
        .upsert(inserts, { onConflict: "content_key" });
    }

    try {
      revalidatePath("/admin/cms");
      revalidatePath("/beranda");
      revalidatePath("/direktori");
    } catch {}

    return NextResponse.json({
      status: "success",
      message: "Perubahan CMS berhasil disimpan secara permanen ke database.",
    });
  } catch (err: any) {
    console.error("[ADMIN-CMS-POST-EXCEPTION]:", err);
    return NextResponse.json({ message: err?.message || "Terjadi kesalahan server saat menyimpan CMS." }, { status: 500 });
  }
}

/**
 * PUT: Menambah atau mengedit item galeri
 */
export async function PUT(request: Request) {
  try {
    const auth = await getAdminContext();
    if (!auth.ok || !auth.supabase) {
      return NextResponse.json({ message: auth.error }, { status: auth.status || 401 });
    }

    const body = await request.json();
    const { id, imageUrl, caption } = body;

    if (!imageUrl) {
      return NextResponse.json({ message: "URL gambar tidak boleh kosong." }, { status: 400 });
    }

    const data = { image_url: imageUrl, caption: caption || "" };
    let result;

    if (id) {
      result = await auth.supabase.from("galeri").update(data).eq("id", id);
    } else {
      result = await auth.supabase.from("galeri").insert(data);
    }

    if (result.error) {
      return NextResponse.json({ message: "Gagal menyimpan galeri: " + result.error.message }, { status: 500 });
    }

    try {
      revalidatePath("/admin/cms");
      revalidatePath("/beranda");
      revalidatePath("/galeri");
    } catch {}

    return NextResponse.json({
      status: "success",
      message: "Gambar galeri berhasil disimpan.",
    });
  } catch (err: any) {
    console.error("[ADMIN-CMS-GALLERY-PUT-EXCEPTION]:", err);
    return NextResponse.json({ message: err?.message || "Terjadi kesalahan server saat menyimpan galeri." }, { status: 500 });
  }
}

/**
 * DELETE: Menghapus item galeri
 */
export async function DELETE(request: Request) {
  try {
    const auth = await getAdminContext();
    if (!auth.ok || !auth.supabase) {
      return NextResponse.json({ message: auth.error }, { status: auth.status || 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ message: "ID item galeri diperlukan." }, { status: 400 });
    }

    const { error } = await auth.supabase.from("galeri").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ message: "Gagal menghapus gambar: " + error.message }, { status: 500 });
    }

    try {
      revalidatePath("/admin/cms");
      revalidatePath("/beranda");
      revalidatePath("/galeri");
    } catch {}

    return NextResponse.json({
      status: "success",
      message: "Gambar galeri berhasil dihapus.",
    });
  } catch (err: any) {
    console.error("[ADMIN-CMS-GALLERY-DELETE-EXCEPTION]:", err);
    return NextResponse.json({ message: err?.message || "Terjadi kesalahan server saat menghapus galeri." }, { status: 500 });
  }
}
