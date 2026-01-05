-- Fix the foreign key constraint on climbs table to properly reference auth.users
ALTER TABLE public.climbs DROP CONSTRAINT IF EXISTS climbs_user_id_fkey;

ALTER TABLE public.climbs
  ADD CONSTRAINT climbs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
