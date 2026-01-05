-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_grade_scale TEXT NOT NULL DEFAULT 'font' CHECK (preferred_grade_scale IN ('font', 'v_scale', 'color_circuit')),
  preferred_discipline TEXT NOT NULL DEFAULT 'boulder' CHECK (preferred_discipline IN ('boulder', 'sport')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
