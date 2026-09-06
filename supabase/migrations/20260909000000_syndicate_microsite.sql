-- Migration: 20260909000000_syndicate_microsite.sql
-- Description: Menambahkan kolom untuk fitur Alumni Business Microsite (WordPress Lite) dan Multi-Marketplace

ALTER TABLE public.syndicate
ADD COLUMN IF NOT EXISTS tagline VARCHAR(255),
ADD COLUMN IF NOT EXISTS kota VARCHAR(100),
ADD COLUMN IF NOT EXISTS alamat TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS promo_alumni TEXT,
ADD COLUMN IF NOT EXISTS jam_operasional VARCHAR(150),
ADD COLUMN IF NOT EXISTS maps_url TEXT,
ADD COLUMN IF NOT EXISTS marketplace_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS produk_layanan JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS galeri_foto JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'gold';

COMMENT ON COLUMN public.syndicate.tagline IS 'Slogan atau tagline bisnis';
COMMENT ON COLUMN public.syndicate.kota IS 'Kota atau domisili bisnis';
COMMENT ON COLUMN public.syndicate.alamat IS 'Alamat fisik kantor atau toko';
COMMENT ON COLUMN public.syndicate.banner_url IS 'Foto cover banner header website bisnis';
COMMENT ON COLUMN public.syndicate.promo_alumni IS 'Promo/diskon khusus pemilik KTA Sovereign Expedient 43';
COMMENT ON COLUMN public.syndicate.jam_operasional IS 'Jam dan hari kerja/operasional';
COMMENT ON COLUMN public.syndicate.maps_url IS 'Tautan Google Maps lokasi usaha';
COMMENT ON COLUMN public.syndicate.marketplace_links IS 'Tautan marketplace opsional (shopee, tokopedia, tiktok, gofood, instagram)';
COMMENT ON COLUMN public.syndicate.produk_layanan IS 'Daftar produk atau jasa unggulan (array objek)';
COMMENT ON COLUMN public.syndicate.galeri_foto IS 'Daftar URL foto dokumentasi/portofolio usaha';
COMMENT ON COLUMN public.syndicate.theme IS 'Pilihan tema visual landing page bisnis';
