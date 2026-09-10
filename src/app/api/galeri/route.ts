import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHtml } from "@/lib/sanitize";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("album_id");
    const year = searchParams.get("year");
    const limit = parseInt(searchParams.get("limit") || "40", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Fetch albums for the stories / highlights carousel
    const { data: albums } = await supabase
      .from("galeri_albums")
      .select("id, title, description, cover_url, year, icon")
      .order("year", { ascending: false });

    // 2. Query photos with uploader info
    let photoQuery = supabase
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
      .range(offset, offset + limit - 1);

    if (albumId && albumId !== "all") {
      photoQuery = photoQuery.eq("album_id", albumId);
    }
    if (year && year !== "all") {
      photoQuery = photoQuery.eq("year", parseInt(year, 10));
    }

    const { data: photos, error } = await photoQuery;

    if (error) {
      console.warn("Galeri fetch warning:", error.message);
    }

    // 3. If user is logged in, check which photos they have liked
    let userLikedPhotoIds = new Set<string>();
    if (user && photos && photos.length > 0) {
      const photoIds = photos.map((p) => p.id);
      const { data: userLikes } = await supabase
        .from("galeri_likes")
        .select("photo_id")
        .eq("user_id", user.id)
        .in("photo_id", photoIds);

      if (userLikes) {
        userLikes.forEach((l) => userLikedPhotoIds.add(l.photo_id));
      }
    }

    const formattedPhotos = (photos || []).map((p: any) => ({
      ...p,
      uploader_name: p.profiles?.nama_panggilan || p.profiles?.nama_lengkap || "Alumni Expedient",
      uploader_avatar: p.profiles?.foto_profil || null,
      is_liked: userLikedPhotoIds.has(p.id),
    }));

    return NextResponse.json({
      success: true,
      albums: albums || [],
      photos: formattedPhotos,
    });
  } catch (err: any) {
    console.error("Galeri GET error:", err);
    return NextResponse.json({ error: "Gagal memuat galeri dokumentasi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: Harap login terlebih dahulu" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // A. TOGGLE LIKE (DOUBLE-TAP OR HEART BUTTON)
    if (action === "toggle_like") {
      const { photo_id } = body;
      if (!photo_id) {
        return NextResponse.json({ error: "Photo ID required" }, { status: 400 });
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from("galeri_likes")
        .select("id")
        .eq("photo_id", photo_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase
          .from("galeri_likes")
          .delete()
          .eq("photo_id", photo_id)
          .eq("user_id", user.id);

        return NextResponse.json({ success: true, liked: false });
      } else {
        // Like
        await supabase
          .from("galeri_likes")
          .insert({ photo_id, user_id: user.id });

        return NextResponse.json({ success: true, liked: true });
      }
    }

    // B. UPLOAD PHOTO RECORD
    if (action === "upload_photo") {
      const { image_url, caption, album_id, year } = body;

      if (!image_url) {
        return NextResponse.json({ error: "URL gambar wajib diisi" }, { status: 400 });
      }

      const safeCaption = caption ? sanitizeHtml(caption.trim()) : "";

      const { data: newPhoto, error: insertError } = await supabase
        .from("galeri")
        .insert({
          image_url,
          caption: safeCaption,
          album_id: album_id || null,
          year: year ? parseInt(year, 10) : new Date().getFullYear(),
          uploader_id: user.id,
          likes_count: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Insert galeri photo error:", insertError);
        return NextResponse.json({ error: "Gagal menyimpan data foto: " + insertError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, photo: newPhoto });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err: any) {
    console.error("Galeri POST error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server: " + (err?.message || "") }, { status: 500 });
  }
}
