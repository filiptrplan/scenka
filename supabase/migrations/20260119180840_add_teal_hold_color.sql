-- Add teal to the hold_color check constraint
ALTER TABLE public.climbs
DROP CONSTRAINT IF EXISTS climbs_hold_color_check;

ALTER TABLE public.climbs
ADD CONSTRAINT climbs_hold_color_check CHECK (hold_color IN ('red', 'green', 'blue', 'yellow', 'black', 'white', 'orange', 'purple', 'pink', 'teal'));
