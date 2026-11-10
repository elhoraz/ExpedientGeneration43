-- =============================================================================
-- Migration: 20261110000003_galeri_biometrics_final_sync.sql
-- Purpose:
--   1. Seed initial galeri_albums if empty
--   2. Install handle_galeri_like_count trigger on public.galeri_likes
--   3. Enable member uploads & management on public.galeri with strict RLS
--   4. Extend public.user_biometrics with WebAuthn L3 columns (counter, transports, device_type, backed_up)
--   5. Deduplicate public.user_biometrics RLS policies into 4 clean rules
-- =============================================================================

BEGIN;

-- 1. SEED INITIAL GALERI ALBUMS
INSERT INTO public.galeri_albums (id, title, description, year, icon)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', 'Wisuda & Haflah 2025', 'Dokumentasi momen sakral wisuda kelulusan dan pelepasan santri akhir angkatan 43.', 2025, 'fa-graduation-cap'),
  ('a2222222-2222-2222-2222-222222222222', 'Panggung Gembira', 'Karya seni akbar panggung gembira, drama, tari saman, paduan suara, dan pertunjukan spektakuler.', 2024, 'fa-masks-theater'),
  ('a3333333-3333-3333-3333-333333333333', 'Reuni & Silaturahmi', 'Arsip temu kangen akbar alumni, buka puasa bersama regional, dan kunjungan silaturahmi.', 2026, 'fa-users'),
  ('a4444444-4444-4444-4444-444444444444', 'Keseharian & Nostalgia', 'Kenangan masa-masa asrama, antrean makan, olahraga sore, belajar bersama di selasar masjid.', 2023, 'fa-camera-retro')
ON CONFLICT (id) DO NOTHING;

-- 2. TRIGGER UNTUK LIKES COUNT OTOMATIS
CREATE OR REPLACE FUNCTION public.handle_galeri_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.galeri
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.photo_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.galeri
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1)
    WHERE id = OLD.photo_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_galeri_like_changed ON public.galeri_likes;
CREATE TRIGGER on_galeri_like_changed
  AFTER INSERT OR DELETE ON public.galeri_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_galeri_like_count();

-- 3. POLICIES GALERI (Public SELECT, Authenticated INSERT, Uploader/Admin UPDATE & DELETE)
ALTER TABLE public.galeri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view galeri" ON public.galeri;
CREATE POLICY "Public can view galeri"
  ON public.galeri FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert galeri photos" ON public.galeri;
CREATE POLICY "Authenticated users can insert galeri photos"
  ON public.galeri FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Uploaders or admins can update galeri" ON public.galeri;
CREATE POLICY "Uploaders or admins can update galeri"
  ON public.galeri FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = uploader_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Uploaders or admins can delete galeri" ON public.galeri;
CREATE POLICY "Uploaders or admins can delete galeri"
  ON public.galeri FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploader_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- 4. EXTEND USER_BIOMETRICS
ALTER TABLE public.user_biometrics
  ADD COLUMN IF NOT EXISTS counter BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transports TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS backed_up BOOLEAN DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_biometrics_credential_id_key'
  ) THEN
    ALTER TABLE public.user_biometrics ADD CONSTRAINT user_biometrics_credential_id_key UNIQUE (credential_id);
  END IF;
END $$;

UPDATE public.user_biometrics
SET counter = sign_count
WHERE (counter = 0 OR counter IS NULL) AND sign_count > 0;

-- 5. DEDUPLICATE USER_BIOMETRICS POLICIES
DROP POLICY IF EXISTS "Users can view their own biometrics" ON public.user_biometrics;
DROP POLICY IF EXISTS "Users can view own biometrics" ON public.user_biometrics;
DROP POLICY IF EXISTS "Users can insert their own biometrics" ON public.user_biometrics;
DROP POLICY IF EXISTS "Users can insert own biometrics" ON public.user_biometrics;
DROP POLICY IF EXISTS "Users can update their own biometrics" ON public.user_biometrics;
DROP POLICY IF EXISTS "Users can update own biometrics" ON public.user_biometrics;
DROP POLICY IF EXISTS "Users can delete their own biometrics" ON public.user_biometrics;
DROP POLICY IF EXISTS "Users can delete own biometrics" ON public.user_biometrics;

CREATE POLICY "Users can view own biometrics"
  ON public.user_biometrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometrics"
  ON public.user_biometrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometrics"
  ON public.user_biometrics FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own biometrics"
  ON public.user_biometrics FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
