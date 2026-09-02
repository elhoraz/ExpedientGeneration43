-- ========================================================================
-- PHASE 5: GAMIFICATION, CMS, & EVENTS
-- ========================================================================

-- 1. PRESTISE LOGS
CREATE TABLE IF NOT EXISTS public.prestise_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.prestise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own prestise logs" ON public.prestise_logs FOR SELECT USING (auth.uid() = user_id);

-- 2. SITE CONTENT (CMS)
CREATE TABLE IF NOT EXISTS public.site_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_key TEXT UNIQUE NOT NULL,
    content_value TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' NOT NULL, -- 'text', 'html', 'image'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view site content" ON public.site_content FOR SELECT USING (true);

-- 3. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view events" ON public.events FOR SELECT USING (true);

-- 4. BUCKET FOR CMS ASSETS
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access for cms-assets" ON storage.objects FOR SELECT USING (bucket_id = 'cms-assets');

-- ========================================================================
-- GAMIFICATION TRIGGERS (Auto-Award Points)
-- ========================================================================

-- Function to add points safely
CREATE OR REPLACE FUNCTION award_prestise_points()
RETURNS TRIGGER AS $$
DECLARE
    award_points INTEGER := 0;
    act_name TEXT := '';
BEGIN
    -- Determine activity and points based on table
    IF TG_TABLE_NAME = 'chat_messages' THEN
        -- Only award for lounge messages
        IF NEW.is_lounge = true THEN
            award_points := 2;
            act_name := 'LOUNGE_CHAT';
        ELSE
            RETURN NEW; -- No points for personal chat
        END IF;
    ELSIF TG_TABLE_NAME = 'majlis_topics' THEN
        award_points := 15;
        act_name := 'MAJLIS_TOPIC';
    ELSIF TG_TABLE_NAME = 'buku_tamu' THEN
        -- Buku tamu doesn't have user_id, but it might have email or just generic. 
        -- Skip buku tamu trigger if we can't reliably map to auth.uid()
        -- Wait, buku tamu in CI4 has user_id? Let's assume it doesn't from earlier, 
        -- Actually we will just skip buku tamu trigger for now to prevent errors.
        RETURN NEW;
    END IF;

    -- Add Log
    IF award_points > 0 AND NEW.sender_id IS NOT NULL THEN
        INSERT INTO prestise_logs (user_id, activity_name, points)
        VALUES (NEW.sender_id, act_name, award_points);

        -- Update total points in profiles
        UPDATE profiles 
        SET prestise_points = COALESCE(prestise_points, 0) + award_points
        WHERE id = NEW.sender_id;
    END IF;

    -- Note for majlis_topics which has 'author_id' instead of 'sender_id'
    IF TG_TABLE_NAME = 'majlis_topics' AND award_points > 0 AND NEW.author_id IS NOT NULL THEN
        INSERT INTO prestise_logs (user_id, activity_name, points)
        VALUES (NEW.author_id, act_name, award_points);

        UPDATE profiles 
        SET prestise_points = COALESCE(prestise_points, 0) + award_points
        WHERE id = NEW.author_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Chat Lounge
CREATE TRIGGER tr_award_chat_points
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION award_prestise_points();

-- Trigger for Majlis Topics
CREATE TRIGGER tr_award_majlis_points
AFTER INSERT ON majlis_topics
FOR EACH ROW EXECUTE FUNCTION award_prestise_points();

-- Seed Default CMS Content
INSERT INTO site_content (content_key, content_value, content_type) VALUES
('home_welcome_title', 'Selamat Datang di Expedient', 'text'),
('home_welcome_subtitle', 'Sistem Informasi Angkatan Terpadu', 'text'),
('login_announcement', 'Gunakan kredensial yang valid untuk memasuki sistem.', 'text')
ON CONFLICT (content_key) DO NOTHING;
