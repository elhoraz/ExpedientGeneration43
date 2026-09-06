-- Migration: Add status and proof_url to baitul_maal_transactions
-- File: supabase/migrations/20260907000001_baitul_maal_status.sql

-- 1. Add status and proof_url columns
ALTER TABLE public.baitul_maal_transactions 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 2. Create index for fast status querying (filtering pending donations)
CREATE INDEX IF NOT EXISTS idx_baitul_maal_status ON public.baitul_maal_transactions(status);

-- 3. Policy: Public can only view finalized/completed transactions in transparency ledger
DROP POLICY IF EXISTS "Everyone can view baitul maal" ON public.baitul_maal_transactions;

CREATE POLICY "Everyone can view completed baitul maal" 
  ON public.baitul_maal_transactions FOR SELECT 
  USING (
    status = 'completed' 
    OR auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'bendahara')
    )
  );
