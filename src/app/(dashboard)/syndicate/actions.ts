"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addPrestise } from "@/lib/gamification";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function submitSyndicate(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const id = formData.get("id")?.toString();
  const nama_bisnis = formData.get("nama_bisnis")?.toString();
  const kategori = formData.get("kategori")?.toString();
  const deskripsi = formData.get("deskripsi")?.toString();
  const link_url = formData.get("link_url")?.toString() || "";
  const no_whatsapp = formData.get("no_whatsapp")?.toString();
  const file: File | null = formData.get("logo_bisnis") as unknown as File;

  if (!nama_bisnis || !kategori || !deskripsi) {
    return { success: false, error: "Data bisnis tidak lengkap" };
  }

  let logoName = formData.get("existing_logo")?.toString() || null;

  // Handle local file upload
  if (file && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: "Ukuran logo maksimal 2MB." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '_' + file.name.replace(/[^a-zA-Z0-9.\-]/g, '_');
    
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'bisnis');
    await mkdir(uploadDir, { recursive: true });
    const path = join(uploadDir, filename);
    await writeFile(path, buffer);

    logoName = filename;
  }

  const payload = {
    user_id: user.id,
    nama_bisnis,
    kategori,
    deskripsi,
    link_url,
    ...(logoName ? { logo_bisnis: logoName } : {})
  };

  if (id) {
    // Update
    // Check ownership
    const { data: existing } = await supabase.from("syndicate").select("user_id").eq("id", id).single();
    if (!existing || existing.user_id !== user.id) {
      return { success: false, error: "Otorisasi gagal" };
    }
    const { error } = await supabase.from("syndicate").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    // Insert
    const { data: newBiz, error } = await supabase.from("syndicate").insert([payload]).select().single();
    if (error) return { success: false, error: error.message };

    // Gamification points (50 points)
    if (newBiz) {
      await addPrestise(supabase as any, user.id, `SYNDICATE_ADD_${newBiz.id}`, 50);
    }
  }

  // Update WhatsApp
  if (no_whatsapp) {
    await supabase.from("profiles").update({ no_whatsapp }).eq("id", user.id);
  }

  revalidatePath("/syndicate");
  return { success: true };
}
