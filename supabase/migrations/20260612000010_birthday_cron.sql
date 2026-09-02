-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the birthday wish cron job to run daily at 07:00 AM
-- Make sure to replace <project> and <anon_key> when deploying to production Supabase
SELECT cron.schedule(
    'birthday-daily', 
    '0 7 * * *', 
    $$
    SELECT net.http_post(
        url := 'https://expedientgeneration.com/api/cron/birthday', -- Placeholder URL, adjust to edge function or actual API URL
        headers := '{"Content-Type": "application/json"}'::jsonb
    )
    $$
);
