-- ========================================================================
-- PHASE 5.2 SPIRITUAL TABLES
-- ========================================================================

-- 1. wasiat_vault (Personal Secrets & Last Words)
CREATE TABLE public.wasiat_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    isi_wasiat TEXT NOT NULL,
    terakhir_diperbarui TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.wasiat_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wasiat" 
    ON public.wasiat_vault FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wasiat" 
    ON public.wasiat_vault FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wasiat" 
    ON public.wasiat_vault FOR UPDATE 
    USING (auth.uid() = user_id);

-- 2. baitul_maal_transactions (Transparent Treasury)
CREATE TABLE public.baitul_maal_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Siapa penginput/donatur (bisa admin atau user terkait)
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('IN', 'OUT')) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.baitul_maal_transactions ENABLE ROW LEVEL SECURITY;

-- Everyone can view baitul maal transactions (Transparent Treasury)
CREATE POLICY "Everyone can view baitul maal" 
    ON public.baitul_maal_transactions FOR SELECT 
    USING (true);

-- Only admin can insert/update (Assuming role 'admin' in profiles, but we'll stick to a simple check or manual insertion for now)
-- Let's allow insert for testing, or rely on admin panel later
CREATE POLICY "Admin can insert baitul maal" 
    ON public.baitul_maal_transactions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
