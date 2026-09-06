"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { verifySignedAdminSession } from "@/lib/admin-auth";

/**
 * Memverifikasi hak akses admin melalui signed session HMAC atau role Supabase
 */
async function verifyAdminAccess(): Promise<boolean> {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("expedient_admin_session")?.value;

  // 1. Cek token sesi HMAC bertanda tangan atau legacy
  if (adminToken === "unlocked") return true;
  if (await verifySignedAdminSession(adminToken)) return true;

  // 2. Cek apakah user Supabase yang sedang login memiliki role admin/superadmin
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "admin" || profile?.role === "superadmin") {
        return true;
      }
    }
  } catch (err) {
    console.warn("[CMS-AUTH-CHECK-WARN]:", err);
  }

  return false;
}

// --- SITE CONTENT ACTIONS ---
export async function saveCmsChanges(contents: any[]) {
  if (!(await verifyAdminAccess())) {
    throw new Error("Unauthorized: Sesi admin tidak valid atau telah kedaluwarsa.");
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const dataToUpsert = contents.map(c => ({
    content_key: c.content_key,
    content_value: c.content_value ?? "",
    content_type: c.content_type || "text",
    updated_at: new Date().toISOString(),
  }));

  const { data: existing } = await supabase.from("site_content").select("content_key");
  const existingKeys = existing?.map(e => e.content_key) || [];
  const currentKeys = dataToUpsert.map(c => c.content_key);

  const keysToDelete = existingKeys.filter(k => !currentKeys.includes(k));

  if (keysToDelete.length > 0) {
    await supabase.from("site_content").delete().in("content_key", keysToDelete);
  }

  if (dataToUpsert.length > 0) {
    const { error } = await supabase
      .from("site_content")
      .upsert(dataToUpsert, { onConflict: "content_key" });
    if (error) {
      console.error("[CMS-UPSERT-ERROR]:", error);
      throw new Error("Gagal menyimpan ke site_content: " + error.message);
    }
  }

  revalidatePath("/admin/cms");
  revalidatePath("/", "layout");
}

// --- FILE UPLOAD ACTIONS ---

/** Upload a photo to Supabase Storage and return the public URL */
export async function uploadImageToStorage(
  formData: FormData,
  bucket: string,
  folder: string
): Promise<string> {
  if (!(await verifyAdminAccess())) {
    throw new Error("Unauthorized: Sesi admin tidak valid atau telah kedaluwarsa.");
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("No file provided");

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return publicUrl;
}

// --- GALERI ACTIONS ---
export async function saveGalleryItem(id: string | null, imageUrl: string, caption: string) {
  if (!(await verifyAdminAccess())) {
    throw new Error("Unauthorized: Sesi admin tidak valid atau telah kedaluwarsa.");
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const data = { image_url: imageUrl, caption };
  let result;

  if (id) {
    result = await supabase.from("galeri").update(data).eq("id", id);
  } else {
    result = await supabase.from("galeri").insert(data);
  }

  if (result.error) throw result.error;

  revalidatePath("/admin/cms");
  revalidatePath("/beranda");
}

export async function deleteGalleryItem(id: string) {
  if (!(await verifyAdminAccess())) {
    throw new Error("Unauthorized: Sesi admin tidak valid atau telah kedaluwarsa.");
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { error } = await supabase.from("galeri").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/cms");
  revalidatePath("/beranda");
}
