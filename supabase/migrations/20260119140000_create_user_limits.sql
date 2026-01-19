-- Create user_limits table for daily usage tracking
CREATE TABLE public.user_limits (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rec_count INTEGER NOT NULL DEFAULT 0 CHECK (rec_count >= 0),
  chat_count INTEGER NOT NULL DEFAULT 0 CHECK (chat_count >= 0),
  limit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment on table
COMMENT ON TABLE public.user_limits IS 'Daily usage limits for recommendations and chat messages. Counters reset at UTC midnight on first request of the day.';

-- Enable RLS
ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own limits
CREATE POLICY "Users can view own limits"
  ON public.user_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE policies for users. Edge Functions use service role key
-- to call RPC functions for atomic counter increments.

-- Create index on limit_date for daily reset queries
CREATE INDEX user_limits_limit_date_idx ON public.user_limits(limit_date);

-- Create increment_rec_count function
-- Atomically increments recommendation counter with UTC midnight reset
CREATE OR REPLACE FUNCTION public.increment_rec_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, rec_count, chat_count, limit_date)
  VALUES (p_user_id, 1, 0, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    rec_count = CASE
      WHEN user_limits.limit_date < CURRENT_DATE THEN 1  -- Reset and increment
      ELSE user_limits.rec_count + 1                       -- Increment
    END,
    limit_date = CURRENT_DATE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create increment_chat_count function
-- Atomically increments chat counter with UTC midnight reset
CREATE OR REPLACE FUNCTION public.increment_chat_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_limits (user_id, rec_count, chat_count, limit_date)
  VALUES (p_user_id, 0, 1, CURRENT_DATE)
  ON CONFLICT (user_id)
  DO UPDATE SET
    chat_count = CASE
      WHEN user_limits.limit_date < CURRENT_DATE THEN 1  -- Reset and increment
      ELSE user_limits.chat_count + 1                     -- Increment
    END,
    limit_date = CURRENT_DATE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Grant EXECUTE on increment functions to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_rec_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_chat_count(UUID) TO authenticated;
