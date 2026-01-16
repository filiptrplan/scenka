-- Add redemption_at column to track when failed climbs are marked as sent
ALTER TABLE public.climbs ADD COLUMN redemption_at TIMESTAMPTZ;
