-- Add hold_color column to climbs table
ALTER TABLE public.climbs
ADD COLUMN hold_color TEXT CHECK (hold_color IN ('red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'pink'));

-- Add comment for documentation
COMMENT ON COLUMN public.climbs.hold_color IS 'Hold color selected by user when logging climb';
