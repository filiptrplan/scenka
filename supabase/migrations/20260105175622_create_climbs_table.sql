-- Create climbs table
CREATE TABLE public.climbs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT NOT NULL,
  climb_type TEXT NOT NULL CHECK (climb_type IN ('boulder', 'sport')),
  grade_scale TEXT NOT NULL CHECK (grade_scale IN ('font', 'v_scale', 'color_circuit')),
  grade_value TEXT NOT NULL,
  style TEXT[] NOT NULL DEFAULT '{}',
  outcome TEXT NOT NULL CHECK (outcome IN ('Sent', 'Fail')),
  awkwardness INTEGER NOT NULL CHECK (awkwardness >= 1 AND awkwardness <= 5),
  failure_reasons TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.climbs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own climbs"
  ON public.climbs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own climbs"
  ON public.climbs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own climbs"
  ON public.climbs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own climbs"
  ON public.climbs FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX climbs_user_id_idx ON public.climbs(user_id);
CREATE INDEX climbs_created_at_idx ON public.climbs(created_at DESC);
