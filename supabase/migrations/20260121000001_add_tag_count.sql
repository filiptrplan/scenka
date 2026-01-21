-- Add tag_count column to user_limits table for daily tag extraction tracking
ALTER TABLE public.user_limits
ADD COLUMN tag_count INTEGER NOT NULL DEFAULT 0 CHECK (tag_count >= 0);

-- Add comment on column for documentation
COMMENT ON COLUMN public.user_limits.tag_count IS 'Daily count of tag extractions for AI-powered tagging. Resets at UTC midnight.';

-- Create increment_tag_count function
-- Atomically increments tag counter with UTC midnight reset
CREATE OR REPLACE FUNCTION public.increment_tag_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, rec_count, chat_count, tag_count, limit_date)
  VALUES (p_user_id, 0, 0, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    tag_count = CASE
      WHEN user_limits.limit_date < CURRENT_DATE THEN 1  -- Reset and increment
      ELSE user_limits.tag_count + 1                     -- Increment
    END,
    limit_date = CURRENT_DATE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Grant EXECUTE on increment_tag_count to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_tag_count(UUID) TO authenticated;
