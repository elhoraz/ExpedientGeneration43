-- ========================================================================
-- PHASE 4: STORAGE BUCKETS (Admin & Chat)
-- ========================================================================

-- Bucket for Announcements
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-assets', 'announcement-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for announcement-assets
CREATE POLICY "Public Access for announcement-assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'announcement-assets' );

-- RLS for chat-attachments
CREATE POLICY "Public Access for chat-attachments"
ON storage.objects FOR SELECT
USING ( bucket_id = 'chat-attachments' );

-- Note: Insert/Update/Delete will be performed via Next.js backend with Service Role Key
