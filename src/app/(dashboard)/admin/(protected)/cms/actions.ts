"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// --- SITE CONTENT ACTIONS ---
export async function saveCmsChanges(contents: any[]) {
  const cookieStore = await cookies();
  
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
    throw new Error("Unauthorized");
  }

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

  const dataToUpsert = contents.map(c => {
    const isNew = c.id.startsWith("new_");
    return {
      ...(isNew ? {} : { id: c.id }),
      content_key: c.content_key,
      content_value: c.content_value,
      content_type: c.content_type
    };
  });

  const { data: existing } = await supabase.from("site_content").select("content_key");
  const existingKeys = existing?.map(e => e.content_key) || [];
  const currentKeys = dataToUpsert.map(c => c.content_key);

  const keysToDelete = existingKeys.filter(k => !currentKeys.includes(k));

  if (keysToDelete.length > 0) {
    await supabase.from("site_content").delete().in("content_key", keysToDelete);
  }

  if (dataToUpsert.length > 0) {
    const { error } = await supabase.from("site_content").upsert(dataToUpsert, { onConflict: 'content_key' });
    if (error) throw error;
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
  const cookieStore = await cookies();
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
    throw new Error("Unauthorized");
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) throw new Error("No file provided");

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
  const cookieStore = await cookies();
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
    throw new Error("Unauthorized");
  }

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
  const cookieStore = await cookies();
  if (cookieStore.get("expedient_admin_session")?.value !== "unlocked") {
    throw new Error("Unauthorized");
  }

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


