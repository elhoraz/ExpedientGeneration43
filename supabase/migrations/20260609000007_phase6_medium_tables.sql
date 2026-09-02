-- ========================================================================
-- PHASE 6: MEDIUM PRIORITY TABLES (RSVP, Multazam, Enigma)
-- ========================================================================

-- 1. EVENT RSVPs
CREATE TABLE IF NOT EXISTS public.event_rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Tidak Hadir', 'Tentatif')),
    ticket_code TEXT,
    seat_number TEXT,
    pass_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view RSVPs" ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can insert own RSVP" ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RSVP" ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id);

-- 2. MULTAZAM PRAYERS (Buku Doa)
CREATE TABLE IF NOT EXISTS public.multazam_prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    prayer_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.multazam_prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view approved prayers" ON public.multazam_prayers FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can insert prayers" ON public.multazam_prayers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. ENIGMA PROGRESS (Minigames)
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
CREATE POLICY "Users can view own enigma progress" ON public.enigma_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own enigma progress" ON public.enigma_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own enigma progress" ON public.enigma_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
