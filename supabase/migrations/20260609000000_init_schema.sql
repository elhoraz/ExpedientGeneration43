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
