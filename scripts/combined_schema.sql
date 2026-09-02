-- Supabase Initial Schema Migration
-- Dikonversi dari CodeIgniter 4 Migrations ke PostgreSQL DDL

-- ========================================================================
-- 1. PROFILES (Extends auth.users)
-- ========================================================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nama_lengkap VARCHAR(150) NOT NULL,
    nama_panggilan VARCHAR(50),
    jenis_kelamin VARCHAR(20) CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
    tempat_lahir VARCHAR(100),
    tanggal_lahir DATE,
    tempat_tanggal_lahir VARCHAR(150),
    alamat_lengkap TEXT,
    no_whatsapp VARCHAR(20),
    motivasi_hidup TEXT,
    cita_cita TEXT,
    akun_ig VARCHAR(100),
    akun_tiktok VARCHAR(100),
    foto_profil VARCHAR(255),
    face_data JSONB,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    role VARCHAR(50) DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    prestise_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- Auto-create profile trigger on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama_lengkap, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'Alumni Baru'), 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================================
-- 2. USER BIOMETRICS (WebAuthn/Passkeys)
-- ========================================================================
CREATE TABLE public.user_biometrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL,
    public_key TEXT NOT NULL,
    sign_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_biometrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own biometrics" ON public.user_biometrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own biometrics" ON public.user_biometrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own biometrics" ON public.user_biometrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own biometrics" ON public.user_biometrics FOR DELETE USING (auth.uid() = user_id);

-- ========================================================================
-- 3. THE SYNDICATE
-- ========================================================================
CREATE TABLE public.syndicate (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    nama_bisnis VARCHAR(150) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    deskripsi TEXT NOT NULL,
    logo_bisnis VARCHAR(255),
    link_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.syndicate ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Syndicate is viewable by everyone" ON public.syndicate FOR SELECT USING (true);
CREATE POLICY "Users can insert their own syndicate" ON public.syndicate FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own syndicate" ON public.syndicate FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own syndicate" ON public.syndicate FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER on_syndicate_updated BEFORE UPDATE ON public.syndicate FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- ========================================================================
-- 4. BUKU TAMU
-- ========================================================================
CREATE TABLE public.buku_tamu (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- optional link to profile
    nama VARCHAR(150) NOT NULL,
    pesan TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.buku_tamu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buku tamu is viewable by everyone" ON public.buku_tamu FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert buku tamu" ON public.buku_tamu FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ========================================================================
-- 5. CHAT MESSAGES
-- ========================================================================
CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means lounge
    message TEXT,
    image_url VARCHAR(255),
    is_lounge BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lounge chats are viewable by authenticated users" ON public.chat_messages FOR SELECT USING (auth.uid() IS NOT NULL AND is_lounge = true);
CREATE POLICY "Personal chats are viewable by sender and receiver" ON public.chat_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can insert chats" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete (soft delete) own chats" ON public.chat_messages FOR UPDATE USING (auth.uid() = sender_id);

-- ========================================================================
-- 6. CMS CONTENT
-- ========================================================================
CREATE TABLE public.cms_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name VARCHAR(150) UNIQUE NOT NULL,
    content_value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CMS is viewable by everyone" ON public.cms_content FOR SELECT USING (true);
-- Only admins can update (policy handled via app logic or role check)
CREATE POLICY "Only admins can update CMS" ON public.cms_content FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
-- ========================================================================
-- PHASE 3: EVENT & AGENDA SYSTEM
-- ========================================================================

CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.event_rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL, -- Hadir, Tentatif, Tidak Hadir
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- RLS untuk events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by authenticated users" ON public.events FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own events" ON public.events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own events" ON public.events FOR DELETE USING (auth.uid() = creator_id);

-- RLS untuk event_rsvps
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs viewable by authenticated users" ON public.event_rsvps FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert own RSVP" ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own RSVP" ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own RSVP" ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Aktifkan Realtime untuk chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
-- Phase 4: Standalone / Gamification Modules Schema
-- Table for Oracle's Vision (Time Capsule)

CREATE TABLE IF NOT EXISTS public.oracle_visions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vision_text TEXT NOT NULL,
    unlock_date DATE NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.oracle_visions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visions"
    ON public.oracle_visions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visions"
    ON public.oracle_visions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visions"
    ON public.oracle_visions
    FOR UPDATE
    USING (auth.uid() = user_id);
-- Phase 5: Advanced Features Schema
-- Includes Majlis Syura and Wasiat Vault

-- 1. MAJLIS SYURA (Topics and Votes)
CREATE TABLE IF NOT EXISTS public.majlis_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    votes_setuju INTEGER DEFAULT 0,
    votes_tidak_setuju INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.majlis_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES public.majlis_topics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('Setuju', 'Tidak Setuju')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(topic_id, user_id)
);

-- RLS Policies for Majlis
ALTER TABLE public.majlis_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majlis_votes ENABLE ROW LEVEL SECURITY;

-- Topics: anyone authenticated can select
CREATE POLICY "Users can view majlis topics"
    ON public.majlis_topics FOR SELECT USING (auth.uid() IS NOT NULL);

-- Topics: authenticated users can insert
CREATE POLICY "Users can insert majlis topics"
    ON public.majlis_topics FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Topics: creator or admin can update (e.g. close topic)
CREATE POLICY "Creator or admin can update topics"
    ON public.majlis_topics FOR UPDATE
    USING (
        auth.uid() = created_by OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Votes: anyone authenticated can select
CREATE POLICY "Users can view majlis votes"
    ON public.majlis_votes FOR SELECT USING (auth.uid() IS NOT NULL);

-- Votes: authenticated users can insert
CREATE POLICY "Users can insert majlis votes"
    ON public.majlis_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. WASIAT VAULT (Encrypted Messages)
CREATE TABLE IF NOT EXISTS public.wasiats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_message TEXT NOT NULL,
    passphrase_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Wasiat
ALTER TABLE public.wasiats ENABLE ROW LEVEL SECURITY;

-- Wasiat: anyone can view the list of wasiats (metadata), but message is encrypted anyway
CREATE POLICY "Users can view all wasiats"
    ON public.wasiats FOR SELECT USING (auth.uid() IS NOT NULL);

-- Wasiat: users can insert their own
CREATE POLICY "Users can insert their own wasiats"
    ON public.wasiats FOR INSERT WITH CHECK (auth.uid() = user_id);
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

