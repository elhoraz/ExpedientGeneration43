-- Migration: Khatam Bersama Real-Time (One Member One Juz)
-- Expedient Generation 43

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

-- Enable RLS
ALTER TABLE public.khatam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khatam_allocations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view khatam sessions" ON public.khatam_sessions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create or update sessions" ON public.khatam_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can view khatam allocations" ON public.khatam_allocations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update allocations" ON public.khatam_allocations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can insert allocations" ON public.khatam_allocations FOR INSERT TO authenticated WITH CHECK (true);

-- Auto Seed Initial Active Session with 30 Juz
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
