-- Migration: Fix Profiles Privilege Escalation & Column Protection
-- File: supabase/migrations/20260907000000_fix_profiles_rls.sql

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Trigger function to protect sensitive columns from unauthorized client-side tampering
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked via service_role key, allow the operation
  IF (COALESCE(auth.jwt()->>'role', '') = 'service_role') THEN
    RETURN NEW;
  END IF;

  -- Protect 'role' from self-escalation
  IF (OLD.role IS DISTINCT FROM NEW.role) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: Anda tidak memiliki wewenang untuk memodifikasi role akun (RLS violation).' 
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Protect 'prestise_points' from client-side inflation
  IF (OLD.prestise_points IS DISTINCT FROM NEW.prestise_points) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: Poin prestise hanya dapat diperbarui oleh sistem atau administrator.' 
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Protect 'is_active' from self-modification
  IF (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    ) THEN
      RAISE EXCEPTION 'Akses ditolak: Status aktivasi akun hanya dapat dikelola oleh administrator.' 
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind trigger to public.profiles
DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_profile_sensitive_columns();

-- 3. Refresh RLS policies for public.profiles
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile non_sensitive" ON public.profiles;

CREATE POLICY "Users can update own profile non_sensitive"
  ON public.profiles
  FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );
