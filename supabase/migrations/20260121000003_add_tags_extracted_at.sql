-- Add tags_extracted_at column to climbs table for deduplication tracking
ALTER TABLE public.climbs
ADD COLUMN tags_extracted_at TIMESTAMPTZ;

-- Add comment on column for documentation
COMMENT ON COLUMN public.climbs.tags_extracted_at IS 'Timestamp when AI tags were last extracted for this climb. Used to prevent duplicate extractions. NULL indicates tags not yet extracted.';
