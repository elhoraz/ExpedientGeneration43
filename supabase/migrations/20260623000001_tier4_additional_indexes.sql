-- supabase/migrations/20260623000001_tier4_additional_indexes.sql

-- Index for notifications read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Index for whatsapp_queue status
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_queue(status);

-- Index for announcements published date
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON announcements(published_at);

-- Index for prestise logs to speed up anti-spam queries
CREATE INDEX IF NOT EXISTS idx_prestise_logs_user_activity ON prestise_logs(user_id, activity_name);
