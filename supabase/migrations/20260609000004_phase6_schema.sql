-- Phase 6: Final Modules Schema

-- 1. BAITUL MAAL TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.baitul_maal_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('infaq', 'pengeluaran', 'donasi_khusus')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.baitul_maal_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transactions"
    ON public.baitul_maal_transactions FOR SELECT USING (auth.uid() IS NOT NULL);

-- 2. KONTEMPLASI JOURNALS
CREATE TABLE IF NOT EXISTS public.kontemplasi_journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood TEXT DEFAULT 'Netral',
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.kontemplasi_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own journals"
    ON public.kontemplasi_journals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own journals"
    ON public.kontemplasi_journals FOR SELECT USING (auth.uid() = user_id);

-- 3. BUKU TAMU
CREATE TABLE IF NOT EXISTS public.buku_tamu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.buku_tamu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view buku tamu"
    ON public.buku_tamu FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert to buku tamu"
    ON public.buku_tamu FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. TARBIYAH PROGRESS (Optional simple structure)
CREATE TABLE IF NOT EXISTS public.tarbiyah_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    materi_title TEXT NOT NULL,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, materi_title)
);

ALTER TABLE public.tarbiyah_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their tarbiyah"
    ON public.tarbiyah_progress FOR ALL USING (auth.uid() = user_id);

