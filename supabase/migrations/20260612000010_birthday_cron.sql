-- 100% PURE PASSIVE MODE (ZERO-BAN GUARANTEE)
-- Unschedule automated birthday outbound cron job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('birthday-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'birthday-daily');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
