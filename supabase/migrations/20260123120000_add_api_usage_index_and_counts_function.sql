-- Migration to support dynamic daily limits from api_usage table
-- Adds composite index for fast daily count queries and creates helper function

-- Composite index for counting daily usage per user per endpoint
CREATE INDEX IF NOT EXISTS api_usage_user_endpoint_day_idx ON public.api_usage 
  (user_id, endpoint, time_window_start);

-- Function to get daily API usage counts for a user
-- Returns counts of today's API calls per endpoint type
CREATE OR REPLACE FUNCTION public.get_daily_api_counts(p_user_id UUID)
RETURNS TABLE (
  rec_count BIGINT,
  chat_count BIGINT,
  tag_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE endpoint = 'openrouter-coach') as rec_count,
    COUNT(*) FILTER (WHERE endpoint = 'openrouter-chat') as chat_count,
    COUNT(*) FILTER (WHERE endpoint = 'openrouter-tag-extract') as tag_count
  FROM public.api_usage
  WHERE 
    user_id = p_user_id AND
    time_window_start >= CURRENT_DATE; -- UTC midnight
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_daily_api_counts(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_daily_api_counts(UUID) IS 
  'Returns daily counts of API usage for recommendations, chat, and tag extraction for a given user. Counts reset at UTC midnight based on time_window_start.';