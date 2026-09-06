-- ====================================================================
-- MIGRATION: 20260908000002_otp_resiliency.sql
-- DESCRIPTION: OTP Delivery Logging & Failover Audit Trail
-- PURPOSE: Monitor and audit multi-channel OTP delivery (WhatsApp & Gmail)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.otp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  channel text NOT NULL, -- 'whatsapp' or 'gmail'
  status text NOT NULL,  -- 'sent', 'failed', 'fallback_triggered'
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for audit lookup and rate-limit heuristics
CREATE INDEX IF NOT EXISTS idx_otp_logs_email_created 
  ON public.otp_logs (email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_logs_status 
  ON public.otp_logs (status);

-- Secure with Row Level Security (RLS)
ALTER TABLE public.otp_logs ENABLE ROW LEVEL SECURITY;

-- Admins and Service Role can read and write logs
CREATE POLICY "Admins can view otp_logs"
  ON public.otp_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'superadmin')
    )
  );

-- Service role bypasses RLS by default
