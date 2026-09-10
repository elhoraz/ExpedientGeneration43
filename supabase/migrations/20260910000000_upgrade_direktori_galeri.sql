-- ========================================================================
-- MIGRATION: UPGRADE DIREKTORI & GALERI MODERN (MOBILE-FIRST ARCHITECTURE)
-- Date: 2026-09-10
-- ========================================================================

-- 1. EXTEND PROFILES FOR ADVANCED DIRECTORY & PRIVACY CONTROLS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kelas VARCHAR(50),
  ADD COLUMN IF NOT EXISTS tahun_masuk INTEGER DEFAULT 2020,
  ADD COLUMN IF NOT EXISTS tahun_lulus INTEGER DEFAULT 2025,
  ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_whatsapp": true, "show_social": true, "show_domisili": true}'::jsonb;

-- Ensure GIN index on privacy_settings for high-speed indexing
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_settings ON public.profiles USING GIN (privacy_settings);
CREATE INDEX IF NOT EXISTS idx_profiles_kelas ON public.profiles (kelas);

-- 2. CREATE GALERI_ALBUMS TABLE (HIGHLIGHT STORIES & CATEGORIZED ALBUMS)
CREATE TABLE IF NOT EXISTS public.galeri_albums (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    cover_url TEXT,
    year INTEGER DEFAULT 2025,
    icon VARCHAR(50) DEFAULT 'fa-images',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for galeri_albums
ALTER TABLE public.galeri_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Albums are viewable by everyone"
  ON public.galeri_albums FOR SELECT
  USING ( true );

CREATE POLICY "Authenticated users can create albums"
  ON public.galeri_albums FOR INSERT
  WITH CHECK ( auth.uid() IS NOT NULL );

CREATE POLICY "Admins or creators can update albums"
  ON public.galeri_albums FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins or creators can delete albums"
  ON public.galeri_albums FOR DELETE
  USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. EXTEND GALERI TABLE (DOCUMENTATION PHOTOS WITH UPLOADER & ALBUM LINK)
ALTER TABLE public.galeri
  ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.galeri_albums(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2025,
  ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(20) DEFAULT 'square';

CREATE INDEX IF NOT EXISTS idx_galeri_album_id ON public.galeri (album_id);
CREATE INDEX IF NOT EXISTS idx_galeri_uploader_id ON public.galeri (uploader_id);
CREATE INDEX IF NOT EXISTS idx_galeri_created_at ON public.galeri (created_at DESC);

-- Update RLS for galeri table to allow authenticated member uploads
DROP POLICY IF EXISTS "Public can view galeri" ON public.galeri;
DROP POLICY IF EXISTS "Admin can manage galeri" ON public.galeri;
DROP POLICY IF EXISTS "Users can insert galeri photos" ON public.galeri;
DROP POLICY IF EXISTS "Uploaders or admins can update galeri" ON public.galeri;
DROP POLICY IF EXISTS "Uploaders or admins can delete galeri" ON public.galeri;

CREATE POLICY "Public can view galeri"
  ON public.galeri FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert galeri photos"
  ON public.galeri FOR INSERT
  WITH CHECK ( auth.uid() IS NOT NULL );

CREATE POLICY "Uploaders or admins can update galeri"
  ON public.galeri FOR UPDATE
  USING (
    auth.uid() = uploader_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Uploaders or admins can delete galeri"
  ON public.galeri FOR DELETE
  USING (
    auth.uid() = uploader_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. CREATE GALERI_LIKES TABLE (DOUBLE-TAP TO HEART ON MOBILE)
CREATE TABLE IF NOT EXISTS public.galeri_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_id UUID REFERENCES public.galeri(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(photo_id, user_id)
);

ALTER TABLE public.galeri_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by authenticated users"
  ON public.galeri_likes FOR SELECT
  USING ( auth.uid() IS NOT NULL );

CREATE POLICY "Users can toggle own likes"
  ON public.galeri_likes FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can remove own likes"
  ON public.galeri_likes FOR DELETE
  USING ( auth.uid() = user_id );

-- 5. FUNCTION TO INCREMENT / DECREMENT LIKES AUTOMATICALLY
CREATE OR REPLACE FUNCTION handle_galeri_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.galeri
    SET likes_count = likes_count + 1
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.galeri
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_galeri_like_changed ON public.galeri_likes;
CREATE TRIGGER on_galeri_like_changed
  AFTER INSERT OR DELETE ON public.galeri_likes
  FOR EACH ROW EXECUTE FUNCTION handle_galeri_like_count();

-- 6. SEED INITIAL ALBUMS IF NOT EXIST
INSERT INTO public.galeri_albums (id, title, description, year, icon)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Wisuda & Haflah 2025', 'Dokumentasi momen sakral wisuda kelulusan dan pelepasan santri akhir angkatan 43.', 2025, 'fa-graduation-cap'),
  ('a2222222-2222-2222-2222-222222222222', 'Panggung Gembira', 'Karya seni akbar panggung gembira, drama, tari saman, paduan suara, dan pertunjukan spektakuler.', 2024, 'fa-masks-theater'),
  ('a3333333-3333-3333-3333-333333333333', 'Reuni & Silaturahmi', 'Arsip temu kangen akbar alumni, buka puasa bersama regional, dan kunjungan silaturahmi.', 2026, 'fa-users'),
  ('a4444444-4444-4444-4444-444444444444', 'Keseharian & Nostalgia', 'Kenangan masa-masa asrama, antrean makan, olahraga sore, belajar bersama di selasar masjid.', 2023, 'fa-camera-retro')
ON CONFLICT (id) DO NOTHING;
