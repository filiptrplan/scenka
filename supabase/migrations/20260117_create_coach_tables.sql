-- Create coach_recommendations table
CREATE TABLE public.coach_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_cached BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.coach_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations
CREATE POLICY "Users can view own recommendations"
  ON public.coach_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON public.coach_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.coach_recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for recommendations
CREATE INDEX coach_recommendations_user_id_idx ON public.coach_recommendations(user_id);
CREATE INDEX coach_recommendations_generation_date_idx ON public.coach_recommendations(generation_date DESC);
CREATE INDEX coach_recommendations_user_date_idx ON public.coach_recommendations(user_id, generation_date DESC);
CREATE INDEX coach_recommendations_content_idx ON public.coach_recommendations USING GIN (content jsonb_path_ops);

-- Create coach_messages table
CREATE TABLE public.coach_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.coach_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON public.coach_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON public.coach_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.coach_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for messages
CREATE INDEX coach_messages_user_id_idx ON public.coach_messages(user_id);
CREATE INDEX coach_messages_created_at_idx ON public.coach_messages(created_at DESC);
CREATE INDEX coach_messages_user_created_idx ON public.coach_messages(user_id, created_at DESC);
CREATE INDEX coach_messages_context_idx ON public.coach_messages USING GIN (context jsonb_path_ops);

-- Create coach_api_usage table
CREATE TABLE public.coach_api_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  prompt_tokens INTEGER NOT NULL,
  completion_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10, 6) NOT NULL,
  model TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  time_window_start TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.coach_api_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for API usage (users can read their own usage)
CREATE POLICY "Users can view own usage"
  ON public.coach_api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for API usage
CREATE INDEX coach_api_usage_user_id_idx ON public.coach_api_usage(user_id);
CREATE INDEX coach_api_usage_time_window_idx ON public.coach_api_usage(time_window_start);
CREATE INDEX coach_api_usage_user_window_idx ON public.coach_api_usage(user_id, time_window_start);
