-- Migration: UGC Moderation Tables (User Reports & User Blocks)
-- File: supabase/migrations/20260908000000_ugc_moderation.sql

-- 1. USER REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content_type VARCHAR(50) DEFAULT 'user_profile',
    content_id TEXT,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports" ON public.user_reports;
CREATE POLICY "Users can insert reports"
    ON public.user_reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view own submitted reports" ON public.user_reports;
CREATE POLICY "Users can view own submitted reports"
    ON public.user_reports FOR SELECT
    USING (
        auth.uid() = reporter_id 
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );

-- 2. USER BLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_block UNIQUE(blocker_id, blocked_user_id)
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocks" ON public.user_blocks;
CREATE POLICY "Users can view own blocks"
    ON public.user_blocks FOR SELECT
    USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can insert own blocks" ON public.user_blocks;
CREATE POLICY "Users can insert own blocks"
    ON public.user_blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can delete own blocks" ON public.user_blocks;
CREATE POLICY "Users can delete own blocks"
    ON public.user_blocks FOR DELETE
    USING (auth.uid() = blocker_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON public.user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_blocks_pair ON public.user_blocks(blocker_id, blocked_user_id);
