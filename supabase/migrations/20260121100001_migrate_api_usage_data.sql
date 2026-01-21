-- Migrate data from coach_api_usage
INSERT INTO public.api_usage (
  id, user_id, created_at, prompt_tokens, completion_tokens,
  total_tokens, cost_usd, model, endpoint, time_window_start
)
SELECT id, user_id, created_at, prompt_tokens, completion_tokens,
       total_tokens, cost_usd, model, endpoint, time_window_start
FROM public.coach_api_usage;

-- Migrate data from tag_extraction_api_usage
INSERT INTO public.api_usage (
  id, user_id, created_at, prompt_tokens, completion_tokens,
  total_tokens, cost_usd, model, endpoint, time_window_start
)
SELECT id, user_id, created_at, prompt_tokens, completion_tokens,
       total_tokens, COALESCE(cost_usd, 0), model, endpoint, time_window_start
FROM public.tag_extraction_api_usage;
