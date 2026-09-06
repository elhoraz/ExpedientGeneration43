-- ====================================================================
-- MIGRATION: 20260908000001_directory_indexes.sql
-- DESCRIPTION: High-Performance PostgreSQL Trigram & Filter Indexing
-- PURPOSE: Fast fuzzy search across alumni directory, eliminating table scans
-- ====================================================================

-- 1. Enable pg_trgm extension for fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN Trigram Indexes for high-speed alumni profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_nama_lengkap_trgm 
  ON public.profiles USING gin (nama_lengkap gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_kota_asal_trgm 
  ON public.profiles USING gin (kota_asal gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_alamat_lengkap_trgm 
  ON public.profiles USING gin (alamat_lengkap gin_trgm_ops);

-- 3. Composite and B-Tree Indexes for directory filters and status checks
CREATE INDEX IF NOT EXISTS idx_profiles_active_status 
  ON public.profiles (is_active, id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_lookup 
  ON public.user_blocks (blocker_id, blocked_user_id);
