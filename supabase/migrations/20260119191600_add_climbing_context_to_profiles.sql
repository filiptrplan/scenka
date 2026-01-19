-- Add climbing_context column to profiles table
ALTER TABLE public.profiles
ADD COLUMN climbing_context TEXT;

-- Add check constraint for max 2000 characters
ALTER TABLE public.profiles
ADD CONSTRAINT climbing_context_max_length
CHECK (climbing_context IS NULL OR length(climbing_context) <= 2000);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.climbing_context IS 'User-provided context about their climbing style, goals, and background for AI coach personalization';
