-- ========================================================================
-- Migration: Fix Baitul Maal Schema, Constraints, and Columns
-- File: supabase/migrations/20260907000003_fix_baitul_maal.sql
-- ========================================================================

-- 1. Ensure columns status and proof_url exist
ALTER TABLE public.baitul_maal_transactions 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 2. Drop and recreate check constraint on transaction_type to support all formats safely
ALTER TABLE public.baitul_maal_transactions 
  DROP CONSTRAINT IF EXISTS baitul_maal_transactions_transaction_type_check;

ALTER TABLE public.baitul_maal_transactions 
  ADD CONSTRAINT baitul_maal_transactions_transaction_type_check 
  CHECK (transaction_type IN ('infaq', 'pengeluaran', 'donasi_khusus', 'IN', 'OUT'));

-- 3. Ensure status check constraint exists
ALTER TABLE public.baitul_maal_transactions 
  DROP CONSTRAINT IF EXISTS baitul_maal_transactions_status_check;

ALTER TABLE public.baitul_maal_transactions 
  ADD CONSTRAINT baitul_maal_transactions_status_check 
  CHECK (status IN ('pending', 'completed', 'rejected'));

-- 4. Enable RLS
ALTER TABLE public.baitul_maal_transactions ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies to prevent conflicts
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.baitul_maal_transactions;
DROP POLICY IF EXISTS "Everyone can view baitul maal" ON public.baitul_maal_transactions;
DROP POLICY IF EXISTS "Everyone can view completed baitul maal" ON public.baitul_maal_transactions;
DROP POLICY IF EXISTS "Admin can insert baitul maal" ON public.baitul_maal_transactions;
DROP POLICY IF EXISTS "Bendahara can insert baitul maal" ON public.baitul_maal_transactions;
DROP POLICY IF EXISTS "Bendahara can update baitul maal" ON public.baitul_maal_transactions;
DROP POLICY IF EXISTS "Users can insert donation baitul maal" ON public.baitul_maal_transactions;

-- 6. Create robust RLS policies
-- Anyone authenticated can view completed transactions or their own transactions; managers can view all
CREATE POLICY "Everyone can view completed baitul maal" 
  ON public.baitul_maal_transactions FOR SELECT 
  USING (
    status = 'completed' 
    OR status IS NULL
    OR auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'bendahara')
    )
  );

-- Authenticated users can insert donation (status will be pending or completed)
CREATE POLICY "Users can insert donation baitul maal"
  ON public.baitul_maal_transactions FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'bendahara')
    )
  );

-- Managers can update (verify/approve/reject) transactions
CREATE POLICY "Managers can update baitul maal"
  ON public.baitul_maal_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'superadmin', 'bendahara')
    )
  );
