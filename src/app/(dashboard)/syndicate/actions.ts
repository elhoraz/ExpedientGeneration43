"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addPrestise } from "@/lib/gamification";

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
  const logo_bisnis = formData.get("logo_bisnis")?.toString() || null;
  const banner_url = formData.get("banner_url")?.toString() || null;
  const tagline = formData.get("tagline")?.toString() || null;
  const kota = formData.get("kota")?.toString() || null;
  const alamat = formData.get("alamat")?.toString() || null;
  const promo_alumni = formData.get("promo_alumni")?.toString() || null;
  const jam_operasional = formData.get("jam_operasional")?.toString() || null;
  const maps_url = formData.get("maps_url")?.toString() || null;
  const theme = formData.get("theme")?.toString() || "gold";

  // Parse JSON fields
  let marketplace_links = {};
  let produk_layanan: any[] = [];
  let galeri_foto: any[] = [];

  try {
    const rawMarketplace = formData.get("marketplace_links")?.toString();
    if (rawMarketplace) marketplace_links = JSON.parse(rawMarketplace);
  } catch (e) {
    console.warn("Failed parsing marketplace_links:", e);
  }

  try {
    const rawProduk = formData.get("produk_layanan")?.toString();
    if (rawProduk) produk_layanan = JSON.parse(rawProduk);
  } catch (e) {
    console.warn("Failed parsing produk_layanan:", e);
  }

  try {
    const rawGaleri = formData.get("galeri_foto")?.toString();
    if (rawGaleri) galeri_foto = JSON.parse(rawGaleri);
  } catch (e) {
    console.warn("Failed parsing galeri_foto:", e);
  }

  if (!nama_bisnis || !kategori || !deskripsi) {
    return { success: false, error: "Data bisnis tidak lengkap" };
  }

  const payload: any = {
    user_id: user.id,
    nama_bisnis,
    kategori,
    deskripsi,
    link_url,
    tagline,
    kota,
    alamat,
    promo_alumni,
    jam_operasional,
    maps_url,
    theme,
    marketplace_links,
    produk_layanan,
    galeri_foto,
    ...(logo_bisnis ? { logo_bisnis } : {}),
    ...(banner_url ? { banner_url } : {})
  };

  if (id) {
    // Update
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

  // Update WhatsApp in profile if provided
  if (no_whatsapp) {
    await supabase.from("profiles").update({ no_whatsapp }).eq("id", user.id);
  }

  revalidatePath("/syndicate");
  if (id) revalidatePath(`/syndicate/${id}`);
  return { success: true };
}
