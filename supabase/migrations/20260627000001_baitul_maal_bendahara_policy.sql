-- ========================================================================
-- Baitul Maal: allow bendahara role to manage treasury transactions
-- ========================================================================
-- The Next.js UI/API explicitly permits both `admin` and `bendahara` to
-- create Baitul Maal entries, but the original RLS policy only allowed
-- `admin`. This migration adds matching database-level permissions.

CREATE POLICY "Bendahara can insert baitul maal"
    ON public.baitul_maal_transactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'bendahara')
        )
    );

CREATE POLICY "Bendahara can update baitul maal"
    ON public.baitul_maal_transactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'bendahara')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('admin', 'bendahara')
        )
    );
