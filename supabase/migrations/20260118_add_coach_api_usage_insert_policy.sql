-- Add INSERT policy for coach_api_usage table
-- This allows the Edge Function to track API usage

CREATE POLICY "Users can insert own usage"
  ON public.coach_api_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
