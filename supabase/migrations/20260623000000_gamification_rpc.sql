-- supabase/migrations/20260623000000_gamification_rpc.sql
CREATE OR REPLACE FUNCTION increment_prestise(user_id uuid, amount integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET prestise_points = COALESCE(prestise_points, 0) + amount
  WHERE id = user_id;
$$;
