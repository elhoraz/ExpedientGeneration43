-- Phase 4: Standalone / Gamification Modules Schema
-- Table for Oracle's Vision (Time Capsule)

CREATE TABLE IF NOT EXISTS public.oracle_visions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vision_text TEXT NOT NULL,
    unlock_date DATE NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.oracle_visions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visions"
    ON public.oracle_visions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visions"
    ON public.oracle_visions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visions"
    ON public.oracle_visions
    FOR UPDATE
    USING (auth.uid() = user_id);
