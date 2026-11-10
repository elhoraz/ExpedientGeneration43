-- =============================================================================
-- Migration: 20261110000002_sync_missing_schema_and_rls.sql
-- Purpose:
--   1. Activate trg_protect_profile_sensitive_columns on public.profiles
--   2. Create safe increment_prestise RPC and update award_prestise_points trigger
--   3. Add INSERT policy on public.prestise_logs
--   4. Create missing tables: khatam_sessions, khatam_allocations, enigma_progress, otp_logs
--   5. Fix 0-policy RLS tables: majlis_topics, majlis_votes, prayers, and tarbiyah_requests
--   6. Create high-performance trigram and composite indexes
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. PRIVILEGE ESCALATION GUARD ON public.profiles + GAMIFICATION RPC/TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow service_role or internal trusted gamification functions
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

  -- Protect 'prestise_points' from direct client-side inflation
  IF (OLD.prestise_points IS DISTINCT FROM NEW.prestise_points) THEN
    IF COALESCE(current_setting('app.bypass_prestise_guard', true), '') <> 'true'
       AND NOT EXISTS (
         SELECT 1 FROM public.profiles
         WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
       )
    THEN
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
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- Safe bounded increment_prestise RPC
CREATE OR REPLACE FUNCTION public.increment_prestise(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF amount IS NULL OR amount <= 0 OR amount > 100 THEN
    RAISE EXCEPTION 'Invalid prestise amount: %', amount;
  END IF;

  IF COALESCE(auth.jwt()->>'role', '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM user_id
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'bendahara')
     )
  THEN
    RAISE EXCEPTION 'Unauthorized prestise increment';
  END IF;

  PERFORM set_config('app.bypass_prestise_guard', 'true', true);

  UPDATE public.profiles
  SET prestise_points = COALESCE(prestise_points, 0) + amount
  WHERE id = user_id;

  PERFORM set_config('app.bypass_prestise_guard', 'false', true);
END;
$$;

-- Update award_prestise_points trigger function to set bypass flag safely
CREATE OR REPLACE FUNCTION public.award_prestise_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    award_points INTEGER := 0;
    act_name TEXT := '';
    target_user_id UUID := NULL;
BEGIN
    IF TG_TABLE_NAME = 'chat_messages' THEN
        IF NEW.is_lounge = true AND NEW.sender_id IS NOT NULL THEN
            award_points := 2;
            act_name := 'LOUNGE_CHAT';
            target_user_id := NEW.sender_id;
        ELSE
            RETURN NEW;
        END IF;
    ELSIF TG_TABLE_NAME = 'majlis_topics' THEN
        IF NEW.created_by IS NOT NULL THEN
            award_points := 15;
            act_name := 'MAJLIS_TOPIC';
            target_user_id := NEW.created_by;
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;

    IF award_points > 0 AND target_user_id IS NOT NULL THEN
        INSERT INTO public.prestise_logs (user_id, activity_name, points)
        VALUES (target_user_id, act_name, award_points);

        PERFORM set_config('app.bypass_prestise_guard', 'true', true);

        UPDATE public.profiles
        SET prestise_points = COALESCE(prestise_points, 0) + award_points
        WHERE id = target_user_id;

        PERFORM set_config('app.bypass_prestise_guard', 'false', true);
    END IF;

    RETURN NEW;
END;
$$;

-- Allow authenticated users to insert their own prestise_logs (bounded)
DROP POLICY IF EXISTS "Users can insert own prestise logs" ON public.prestise_logs;
CREATE POLICY "Users can insert own prestise logs"
  ON public.prestise_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND points > 0 AND points <= 100);

-- =============================================================================
-- 2. MISSING TABLES: khatam_sessions, khatam_allocations, enigma_progress, otp_logs
-- =============================================================================

-- 2A. Khatam Bersama Real-Time
CREATE TABLE IF NOT EXISTS public.khatam_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Khataman Pekanan Angkatan 43',
    target_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    total_juz_completed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.khatam_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.khatam_sessions(id) ON DELETE CASCADE,
    juz_number INTEGER NOT NULL CHECK (juz_number BETWEEN 1 AND 30),
    surah_range TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    user_avatar TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reading', 'completed')),
    claimed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_session_juz UNIQUE (session_id, juz_number)
);

ALTER TABLE public.khatam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khatam_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view khatam sessions" ON public.khatam_sessions;
CREATE POLICY "Anyone can view khatam sessions"
  ON public.khatam_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create or update sessions" ON public.khatam_sessions;
CREATE POLICY "Authenticated users can create or update sessions"
  ON public.khatam_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view khatam allocations" ON public.khatam_allocations;
CREATE POLICY "Anyone can view khatam allocations"
  ON public.khatam_allocations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can update allocations" ON public.khatam_allocations;
CREATE POLICY "Authenticated users can update allocations"
  ON public.khatam_allocations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert allocations" ON public.khatam_allocations;
CREATE POLICY "Authenticated users can insert allocations"
  ON public.khatam_allocations FOR INSERT TO authenticated WITH CHECK (true);

DO $$
DECLARE
    v_session_id UUID;
    v_ranges TEXT[] := ARRAY[
        'Al-Fatihah 1 - Al-Baqarah 141',
        'Al-Baqarah 142 - Al-Baqarah 252',
        'Al-Baqarah 253 - Ali ''Imran 92',
        'Ali ''Imran 93 - An-Nisa'' 23',
        'An-Nisa'' 24 - An-Nisa'' 147',
        'An-Nisa'' 148 - Al-Ma''idah 81',
        'Al-Ma''idah 82 - Al-An''am 110',
        'Al-An''am 111 - Al-A''raf 87',
        'Al-A''raf 88 - Al-Anfal 40',
        'Al-Anfal 41 - At-Taubah 92',
        'At-Taubah 93 - Hud 5',
        'Hud 6 - Yusuf 52',
        'Yusuf 53 - Ibrahim 52',
        'Al-Hijr 1 - An-Nahl 128',
        'Al-Isra'' 1 - Al-Kahf 74',
        'Al-Kahf 75 - Ta-Ha 135',
        'Al-Anbiya'' 1 - Al-Hajj 78',
        'Al-Mu''minun 1 - Al-Furqan 20',
        'Al-Furqan 21 - An-Naml 55',
        'An-Naml 56 - Al-''Ankabut 45',
        'Al-''Ankabut 46 - Al-Ahzab 30',
        'Al-Ahzab 31 - Ya-Sin 27',
        'Ya-Sin 28 - Az-Zumar 31',
        'Az-Zumar 32 - Fussilat 46',
        'Fussilat 47 - Al-Jasiyah 37',
        'Al-Ahqaf 1 - Az-Zariyat 30',
        'Az-Zariyat 31 - Al-Hadid 29',
        'Al-Mujadilah 1 - At-Tahrim 12',
        'Al-Mulk 1 - Al-Mursalat 50',
        'An-Naba'' 1 - An-Nas 6'
    ];
    i INTEGER;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.khatam_sessions WHERE status = 'active') THEN
        INSERT INTO public.khatam_sessions (title, target_date, status)
        VALUES ('Khataman Pekanan Angkatan 43', NOW() + INTERVAL '7 days', 'active')
        RETURNING id INTO v_session_id;

        FOR i IN 1..30 LOOP
            INSERT INTO public.khatam_allocations (session_id, juz_number, surah_range, status)
            VALUES (v_session_id, i, v_ranges[i], 'available');
        END LOOP;
    END IF;
END $$;

-- 2B. Enigma Progress
CREATE TABLE IF NOT EXISTS public.enigma_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    puzzle_seed TEXT NOT NULL,
    current_level INTEGER DEFAULT 1,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id)
);

ALTER TABLE public.enigma_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enigma progress" ON public.enigma_progress;
CREATE POLICY "Users can view own enigma progress"
  ON public.enigma_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enigma progress" ON public.enigma_progress;
CREATE POLICY "Users can update own enigma progress"
  ON public.enigma_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own enigma progress" ON public.enigma_progress;
CREATE POLICY "Users can insert own enigma progress"
  ON public.enigma_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2C. OTP Resiliency Audit Logs
CREATE TABLE IF NOT EXISTS public.otp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  channel text NOT NULL,
  status text NOT NULL,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_logs_email_created ON public.otp_logs (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_logs_status ON public.otp_logs (status);

ALTER TABLE public.otp_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view otp_logs" ON public.otp_logs;
CREATE POLICY "Admins can view otp_logs"
  ON public.otp_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- =============================================================================
-- 3. FIX LOCKED TABLES (majlis_topics, majlis_votes, prayers, tarbiyah_requests)
-- =============================================================================

-- 3A. Majlis Topics & Votes
ALTER TABLE public.majlis_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majlis_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view majlis topics" ON public.majlis_topics;
CREATE POLICY "Users can view majlis topics"
  ON public.majlis_topics FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert majlis topics" ON public.majlis_topics;
CREATE POLICY "Users can insert majlis topics"
  ON public.majlis_topics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

DROP POLICY IF EXISTS "Creator or admin can update topics" ON public.majlis_topics;
CREATE POLICY "Creator or admin can update topics"
  ON public.majlis_topics FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Users can view majlis votes" ON public.majlis_votes;
CREATE POLICY "Users can view majlis votes"
  ON public.majlis_votes FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert majlis votes" ON public.majlis_votes;
CREATE POLICY "Users can insert majlis votes"
  ON public.majlis_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- 3B. Multazam Prayers
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all prayers" ON public.prayers;
CREATE POLICY "Users can view all prayers"
  ON public.prayers FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert their own prayers" ON public.prayers;
CREATE POLICY "Users can insert their own prayers"
  ON public.prayers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own prayers" ON public.prayers;
CREATE POLICY "Users can delete own prayers"
  ON public.prayers FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin'))
  );

-- 3C. Tarbiyah Requests (Allow both sender and target mentor/syndicate owner to view & update)
DROP POLICY IF EXISTS "Users can view own requests" ON public.tarbiyah_requests;
CREATE POLICY "Users can view own or incoming requests"
  ON public.tarbiyah_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = target_id
    OR EXISTS (
      SELECT 1 FROM public.syndicate
      WHERE syndicate.id = tarbiyah_requests.target_id AND syndicate.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Targets can update request status" ON public.tarbiyah_requests;
CREATE POLICY "Targets can update request status"
  ON public.tarbiyah_requests FOR UPDATE TO authenticated
  USING (
    auth.uid() = target_id
    OR EXISTS (
      SELECT 1 FROM public.syndicate
      WHERE syndicate.id = tarbiyah_requests.target_id AND syndicate.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- =============================================================================
-- 4. HIGH-PERFORMANCE INDEXES
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_nama_lengkap_trgm
  ON public.profiles USING gin (nama_lengkap gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_tempat_lahir_trgm
  ON public.profiles USING gin (tempat_lahir gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_alamat_lengkap_trgm
  ON public.profiles USING gin (alamat_lengkap gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_active_status
  ON public.profiles (is_active, id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_lookup
  ON public.user_blocks (blocker_id, blocked_user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status
  ON public.whatsapp_queue (status);

CREATE INDEX IF NOT EXISTS idx_announcements_published_at
  ON public.announcements (published_at);

CREATE INDEX IF NOT EXISTS idx_prestise_logs_user_activity
  ON public.prestise_logs (user_id, activity_name);

COMMIT;

