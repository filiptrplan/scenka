-- Migration to drop user_limits table and associated functions
-- After migrating to dynamic counting from api_usage table

-- First drop the increment functions (they reference the table)
DROP FUNCTION IF EXISTS public.increment_rec_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_chat_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_tag_count(UUID) CASCADE;

-- Drop RLS policies on user_limits (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_limits') THEN
    DROP POLICY IF EXISTS "Users can view own limits" ON public.user_limits;
  END IF;
END
$$;

-- Drop indexes on user_limits (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_limits') THEN
    DROP INDEX IF EXISTS public.user_limits_limit_date_idx;
  END IF;
END
$$;

-- Finally drop the table if it exists
DROP TABLE IF EXISTS public.user_limits CASCADE;