-- Migration: Add missing WebAuthn columns and unique constraint to user_biometrics
ALTER TABLE public.user_biometrics
    ADD COLUMN IF NOT EXISTS counter BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS transports TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS device_type TEXT,
    ADD COLUMN IF NOT EXISTS backed_up BOOLEAN DEFAULT false;

-- Add Unique Constraint on credential_id if not present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_biometrics_credential_id_key'
    ) THEN
        ALTER TABLE public.user_biometrics ADD CONSTRAINT user_biometrics_credential_id_key UNIQUE (credential_id);
    END IF;
END $$;

-- Sync counter from sign_count if sign_count exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_biometrics' 
        AND column_name = 'sign_count'
    ) THEN
        UPDATE public.user_biometrics SET counter = sign_count WHERE (counter = 0 OR counter IS NULL) AND sign_count > 0;
    END IF;
END $$;

