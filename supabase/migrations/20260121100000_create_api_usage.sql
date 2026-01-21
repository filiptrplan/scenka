-- Create consolidated api_usage table
CREATE TABLE public.api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  time_window_start TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE public.api_usage IS 'Tracks AI API usage across all endpoints. Costs and tokens tracked from OpenRouter API responses.';

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api usage"
  ON public.api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX api_usage_user_id_idx ON public.api_usage(user_id);
CREATE INDEX api_usage_time_window_idx ON public.api_usage(time_window_start);
CREATE INDEX api_usage_user_time_idx ON public.api_usage(user_id, time_window_start);
