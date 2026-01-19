-- Drop redundant generation_date column from coach_recommendations
-- The created_at TIMESTAMPTZ column already captures the exact timestamp

ALTER TABLE public.coach_recommendations DROP COLUMN IF EXISTS generation_date;

-- Drop indexes that referenced generation_date
DROP INDEX IF EXISTS coach_recommendations_generation_date_idx;
DROP INDEX IF EXISTS coach_recommendations_user_date_idx;
