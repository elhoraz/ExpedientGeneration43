-- ========================================================================
-- Migration: Fix Majlis Syura RLS Policies & Permissions
-- Allows authenticated users to safely insert topics & votes
-- ========================================================================

-- 1. Ensure RLS is enabled
ALTER TABLE IF EXISTS public.majlis_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.majlis_votes ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "Users can insert majlis topics" ON public.majlis_topics;
DROP POLICY IF EXISTS "Users can view majlis topics" ON public.majlis_topics;
DROP POLICY IF EXISTS "Creator or admin can update topics" ON public.majlis_topics;

DROP POLICY IF EXISTS "Users can insert majlis votes" ON public.majlis_votes;
DROP POLICY IF EXISTS "Users can view majlis votes" ON public.majlis_votes;

-- 3. Topics Policies
CREATE POLICY "Users can view majlis topics"
    ON public.majlis_topics FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert majlis topics"
    ON public.majlis_topics FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND (created_by IS NULL OR created_by = auth.uid()));

CREATE POLICY "Creator or admin can update topics"
    ON public.majlis_topics FOR UPDATE
    USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- 4. Votes Policies
CREATE POLICY "Users can view majlis votes"
    ON public.majlis_votes FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert majlis votes"
    ON public.majlis_votes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));
