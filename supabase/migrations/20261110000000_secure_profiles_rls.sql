-- Migration: 20261110000000_secure_profiles_rls.sql
-- Description: Restrict public.profiles SELECT to authenticated users only and isolate biometric face_data into user_face_data table with owner-only access.

-- 1. Create dedicated user_face_data table
CREATE TABLE IF NOT EXISTS public.user_face_data (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    face_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_face_data
ALTER TABLE public.user_face_data ENABLE ROW LEVEL SECURITY;

-- Drop old policies if any
DROP POLICY IF EXISTS "Users can only view their own face data" ON public.user_face_data;
DROP POLICY IF EXISTS "Users can only insert their own face data" ON public.user_face_data;
DROP POLICY IF EXISTS "Users can only update their own face data" ON public.user_face_data;
DROP POLICY IF EXISTS "Users can only delete their own face data" ON public.user_face_data;

-- Owner-only RLS policies
CREATE POLICY "Users can only view their own face data"
    ON public.user_face_data FOR SELECT
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can only insert their own face data"
    ON public.user_face_data FOR INSERT
    TO authenticated
    WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can only update their own face data"
    ON public.user_face_data FOR UPDATE
    TO authenticated
    USING ( auth.uid() = user_id );

CREATE POLICY "Users can only delete their own face data"
    ON public.user_face_data FOR DELETE
    TO authenticated
    USING ( auth.uid() = user_id );

-- 2. Migrate existing face_data from profiles to user_face_data safely
INSERT INTO public.user_face_data (user_id, face_data)
SELECT id, face_data::text
FROM public.profiles
WHERE face_data IS NOT NULL AND face_data::text != '' AND face_data::text != 'null'
ON CONFLICT (user_id) DO UPDATE SET face_data = EXCLUDED.face_data, updated_at = now();

-- Nullify face_data in public.profiles to prevent data leak
UPDATE public.profiles
SET face_data = NULL
WHERE face_data IS NOT NULL;

-- 3. Lock down public.profiles SELECT policy so anonymous visitors cannot scrape alumni directory
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING ( true );

