import { createClient } from "@/lib/supabase/server";
import GaleriClient from "./GaleriClient";

export const metadata = {
  title: "Galeri & Visual Vault 5D | Expedient Generation 43",
  description: "Arsip visual dokumentasi kenangan, album momen, dan buku kenangan 3D interaktif angkatan Expedient 43.",
};

export default async function GaleriPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let initialAlbums: any[] = [];
  let initialPhotos: any[] = [];

  try {
    const { data: albumsData } = await supabase
      .from("galeri_albums")
      .select("id, title, description, cover_url, year, icon")
      .order("year", { ascending: false });
    if (albumsData) initialAlbums = albumsData;
  } catch (err) {
    console.warn("Could not fetch galeri_albums on server:", err);
  }

  try {
    const { data: photosData } = await supabase
      .from("galeri")
      .select(`
        id,
        image_url,
        caption,
        created_at,
        likes_count,
        year,
        album_id,
        uploader_id,
        profiles!uploader_id(id, nama_panggilan, nama_lengkap, foto_profil)
      `)
      .order("created_at", { ascending: false })
      .limit(60);

    if (photosData) {
      let likedIds = new Set<string>();
      if (user && photosData.length > 0) {
        const { data: likes } = await supabase
          .from("galeri_likes")
          .select("photo_id")
          .eq("user_id", user.id);
        if (likes) likes.forEach((l) => likedIds.add(l.photo_id));
      }

      initialPhotos = photosData.map((p: any) => ({
        ...p,
        uploader_name: p.profiles?.nama_panggilan || p.profiles?.nama_lengkap || "Alumni Expedient",
        uploader_avatar: p.profiles?.foto_profil || null,
        is_liked: likedIds.has(p.id),
      }));
    }
  } catch (err) {
    console.warn("Could not fetch galeri photos on server:", err);
  }

  return (
    <GaleriClient
      initialAlbums={initialAlbums}
      initialPhotos={initialPhotos}
      currentUser={user ? { id: user.id, email: user.email } : null}
    />
  );
}

