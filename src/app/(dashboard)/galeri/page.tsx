import { createClient } from "@/lib/supabase/server";
import GaleriClient from "./GaleriClient";
import galeriManifest from "@/data/galeri-manifest.json";

export const metadata = {
  title: "Galeri & Visual Vault 5D | Expedient Generation 43",
  description: "Arsip visual dokumentasi kenangan, album momen, dan buku kenangan 3D interaktif angkatan Expedient 43.",
};

export default async function GaleriPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Curated 245 photos and categorized albums from manifest
  let initialAlbums = galeriManifest.albums || [];
  let initialPhotos: any[] = [...(galeriManifest.photos || [])];

  // Also query community uploaded photos from Supabase 'galeri' table
  try {
    const { data: dbPhotos } = await supabase
      .from("galeri")
      .select("id, image_url, caption, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    if (dbPhotos && dbPhotos.length > 0) {
      let likedIds = new Set<string>();
      if (user) {
        try {
          const { data: likes } = await supabase
            .from("galeri_likes")
            .select("photo_id")
            .eq("user_id", user.id);
          if (likes) likes.forEach((l) => likedIds.add(l.photo_id));
        } catch {}
      }

      const formattedDbPhotos = dbPhotos.map((p: any) => ({
        id: p.id,
        image_url: p.image_url,
        thumbnail_url: p.image_url,
        caption: p.caption || "Dokumentasi Alumni Expedient 43",
        created_at: p.created_at,
        likes_count: 24,
        year: 2025,
        album_id: "galeri_ekspi",
        uploader_name: "Alumni Expedient",
        uploader_avatar: null,
        is_liked: likedIds.has(p.id),
      }));

      // Merge community photos at the top of the gallery
      initialPhotos = [...formattedDbPhotos, ...initialPhotos];
    }
  } catch (err) {
    console.warn("Could not fetch user galeri photos on server:", err);
  }

  return (
    <GaleriClient
      initialAlbums={initialAlbums}
      initialPhotos={initialPhotos}
      currentUser={user ? { id: user.id, email: user.email } : null}
    />
  );
}

