-- =============================================================================
-- Migration: 20261127000001_cloud_ibadah_sync_and_rate_limit.sql
-- Purpose:
--   1. O28: Create public.user_ibadah_state for cross-device (Web <-> Android APK)
--      sync of Quran last-read, Quran bookmarks, and Tasbih counters with strict RLS.
--   2. O22: Create public.rate_limit_buckets + atomic consume_rate_limit() RPC
--      for distributed rate limiting across Vercel serverless instances.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. O28: USER IBADAH STATE (QURAN + TASBIH CLOUD SYNC)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ibadah_state (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  quran_last_read JSONB DEFAULT NULL,
  quran_bookmarks JSONB DEFAULT '[]'::jsonb NOT NULL,
  tasbih_total BIGINT DEFAULT 0 NOT NULL,
  tasbih_state JSONB DEFAULT '{}'::jsonb NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_ibadah_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ibadah state" ON public.user_ibadah_state;
CREATE POLICY "Users can view own ibadah state"
  ON public.user_ibadah_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ibadah state" ON public.user_ibadah_state;
CREATE POLICY "Users can insert own ibadah state"
  ON public.user_ibadah_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ibadah state" ON public.user_ibadah_state;
CREATE POLICY "Users can update own ibadah state"
  ON public.user_ibadah_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own ibadah state" ON public.user_ibadah_state;
CREATE POLICY "Users can delete own ibadah state"
  ON public.user_ibadah_state FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. O22: DISTRIBUTED SERVERLESS RATE LIMITER BUCKETS & ATOMIC RPC
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket_key TEXT PRIMARY KEY,
  hit_count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_ms BIGINT
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_in_ms BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := clock_timestamp();
  v_window INTERVAL := (GREATEST(p_window_ms, 1000) || ' milliseconds')::INTERVAL;
  v_new_reset TIMESTAMP WITH TIME ZONE := v_now + v_window;
  v_count INTEGER;
  v_reset TIMESTAMP WITH TIME ZONE;
  v_reset_ms BIGINT;
BEGIN
  -- Opportunistic stale bucket cleanup (~2% of calls)
  IF random() < 0.02 THEN
    DELETE FROM public.rate_limit_buckets WHERE reset_at < v_now - INTERVAL '1 hour';
  END IF;

  INSERT INTO public.rate_limit_buckets (bucket_key, hit_count, reset_at)
  VALUES (p_key, 1, v_new_reset)
  ON CONFLICT (bucket_key) DO UPDATE
  SET
    hit_count = CASE
      WHEN public.rate_limit_buckets.reset_at <= v_now THEN 1
      ELSE public.rate_limit_buckets.hit_count + 1
    END,
    reset_at = CASE
      WHEN public.rate_limit_buckets.reset_at <= v_now THEN v_new_reset
      ELSE public.rate_limit_buckets.reset_at
    END
  RETURNING hit_count, reset_at INTO v_count, v_reset;

  v_reset_ms := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_reset - v_now)) * 1000)::BIGINT);

  RETURN QUERY
  SELECT
    (v_count <= p_limit) AS allowed,
    GREATEST(0, p_limit - v_count) AS remaining,
    v_reset_ms AS reset_in_ms;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, BIGINT) TO service_role;

COMMIT;
