-- Migration for Multazam Prayers
CREATE TABLE IF NOT EXISTS public.prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prayer_text TEXT NOT NULL,
    status TEXT DEFAULT 'Terkirim',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all prayers" ON public.prayers FOR SELECT USING (true);
CREATE POLICY "Users can insert their own prayers" ON public.prayers FOR INSERT WITH CHECK (auth.uid() = user_id);
