-- Add enabled_hold_colors column to profiles table
ALTER TABLE public.profiles
ADD COLUMN enabled_hold_colors TEXT[] DEFAULT ARRAY['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink']::TEXT[] NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.enabled_hold_colors IS 'Hold colors enabled by user in settings (subset of all available colors)';
