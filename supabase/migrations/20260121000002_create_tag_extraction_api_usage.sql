-- Create tag_extraction_api_usage table for tracking AI tag extraction API usage
CREATE TABLE public.tag_extraction_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL DEFAULT 'openrouter-tag-extract',
  time_window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment on table for documentation
COMMENT ON TABLE public.tag_extraction_api_usage IS 'Tracks AI API usage for tag extraction. Costs and tokens tracked from OpenRouter API responses.';

-- Enable RLS
ALTER TABLE public.tag_extraction_api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view own tag extraction usage
CREATE POLICY "Users can view own tag extraction usage"
  ON public.tag_extraction_api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Note: No INSERT/UPDATE policies for users. Edge Functions use service role key.

-- Create index on user_id for faster user-specific queries
CREATE INDEX tag_extraction_api_usage_user_id_idx ON public.tag_extraction_api_usage(user_id);

-- Create index on time_window_start for time-based queries
CREATE INDEX tag_extraction_api_usage_time_window_idx ON public.tag_extraction_api_usage(time_window_start);

-- Create composite index for efficient user + time window queries
CREATE INDEX tag_extraction_api_usage_user_time_idx ON public.tag_extraction_api_usage(user_id, time_window_start);
