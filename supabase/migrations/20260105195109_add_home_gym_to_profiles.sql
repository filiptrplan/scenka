-- Add home_gym column to profiles table
ALTER TABLE public.profiles ADD COLUMN home_gym TEXT DEFAULT 'My Gym';

UPDATE public.profiles SET home_gym = 'My Gym' WHERE home_gym IS NULL;
