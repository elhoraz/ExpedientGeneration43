-- Phase 5: Advanced Features Schema
-- Includes Majlis Syura and Wasiat Vault

-- 1. MAJLIS SYURA (Topics and Votes)
CREATE TABLE IF NOT EXISTS public.majlis_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    votes_setuju INTEGER DEFAULT 0,
    votes_tidak_setuju INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.majlis_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES public.majlis_topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('Setuju', 'Tidak Setuju')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(topic_id, user_id)
);

-- RLS Policies for Majlis
ALTER TABLE public.majlis_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majlis_votes ENABLE ROW LEVEL SECURITY;

-- Topics: anyone authenticated can select
CREATE POLICY "Users can view majlis topics"
    ON public.majlis_topics FOR SELECT USING (auth.uid() IS NOT NULL);

-- Topics: authenticated users can insert
CREATE POLICY "Users can insert majlis topics"
    ON public.majlis_topics FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Topics: creator or admin can update (e.g. close topic)
CREATE POLICY "Creator or admin can update topics"
    ON public.majlis_topics FOR UPDATE
    USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Votes: anyone authenticated can select
CREATE POLICY "Users can view majlis votes"
    ON public.majlis_votes FOR SELECT USING (auth.uid() IS NOT NULL);

-- Votes: authenticated users can insert
CREATE POLICY "Users can insert majlis votes"
    ON public.majlis_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. WASIAT VAULT (Encrypted Messages)
CREATE TABLE IF NOT EXISTS public.wasiats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_message TEXT NOT NULL,
    passphrase_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Wasiat
ALTER TABLE public.wasiats ENABLE ROW LEVEL SECURITY;

-- Wasiat: anyone can view the list of wasiats (metadata), but message is encrypted anyway
CREATE POLICY "Users can view all wasiats"
    ON public.wasiats FOR SELECT USING (auth.uid() IS NOT NULL);

-- Wasiat: users can insert their own
CREATE POLICY "Users can insert their own wasiats"
    ON public.wasiats FOR INSERT WITH CHECK (auth.uid() = user_id);
