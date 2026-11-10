-- Migration: 20261110000001_fix_galeri_wasiat_queue_rls.sql
-- Description:
-- 1. Close open public ALL vulnerability on galeri and whatsapp_queue.
-- 2. Add proper authenticated & owner policies to wasiats and kontemplasi_journals.

-- ==============================================================================
-- 1. GALERI: Restrict write access to admins only
-- ==============================================================================
DROP POLICY IF EXISTS "Admin can manage galeri" ON public.galeri;

CREATE POLICY "Admins can manage galeri"
    ON public.galeri FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- ==============================================================================
-- 2. WHATSAPP QUEUE: Restrict queue access strictly to service_role
-- ==============================================================================
DROP POLICY IF EXISTS "Service role can manage whatsapp queue" ON public.whatsapp_queue;

CREATE POLICY "Service role can manage whatsapp queue"
    ON public.whatsapp_queue FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 3. WASIATS: Unblock and provide secure authenticated & owner access
-- ==============================================================================
ALTER TABLE public.wasiats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all wasiats" ON public.wasiats;
DROP POLICY IF EXISTS "Authenticated users can view wasiats" ON public.wasiats;
DROP POLICY IF EXISTS "Users can insert their own wasiats" ON public.wasiats;
DROP POLICY IF EXISTS "Users can delete their own wasiats" ON public.wasiats;

CREATE POLICY "Authenticated users can view wasiats"
    ON public.wasiats FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own wasiats"
    ON public.wasiats FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wasiats"
    ON public.wasiats FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. KONTEMPLASI JOURNALS: Unblock and provide owner + public journal access
-- ==============================================================================
ALTER TABLE public.kontemplasi_journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own or public journals" ON public.kontemplasi_journals;
DROP POLICY IF EXISTS "Users can insert own journals" ON public.kontemplasi_journals;
DROP POLICY IF EXISTS "Users can update own journals" ON public.kontemplasi_journals;
DROP POLICY IF EXISTS "Users can delete own journals" ON public.kontemplasi_journals;

CREATE POLICY "Users can view own or public journals"
    ON public.kontemplasi_journals FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR is_private = false);

CREATE POLICY "Users can insert own journals"
    ON public.kontemplasi_journals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals"
    ON public.kontemplasi_journals FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals"
    ON public.kontemplasi_journals FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

