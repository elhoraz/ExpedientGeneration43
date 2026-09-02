-- Migration to add Tarbiyah Materi Kajian table
CREATE TABLE IF NOT EXISTS public.tarbiyah_materi (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming' or 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.tarbiyah_materi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users"
    ON public.tarbiyah_materi FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Seed initial data since the user relies on placeholders right now
INSERT INTO public.tarbiyah_materi (title, event_date, status)
VALUES 
    ('Urgensi Ukhuwah Islamiyah', '2026-06-15 08:00:00+00', 'completed'),
    ('Tafsir Surah Al-Hujurat', '2026-06-22 08:00:00+00', 'upcoming'),
    ('Manajemen Waktu Muslim', '2026-06-29 08:00:00+00', 'upcoming');
