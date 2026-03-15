-- Update profiles table to match Onboarding Form requirements
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('seeker', 'provider')),
  ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS budget_min INTEGER,
  ADD COLUMN IF NOT EXISTS budget_max INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_age_min INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_age_max INTEGER,
  ADD COLUMN IF NOT EXISTS preferred_gender TEXT,
  ADD COLUMN IF NOT EXISTS move_in_date DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- If you need any specific new policy, you can add them here.
-- But the existing policies in 20260314000000_init_schema.sql already cover SELECT, INSERT, and UPDATE.
