-- Add preferred roommate age range columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age_min integer DEFAULT 18,
  ADD COLUMN IF NOT EXISTS age_max integer DEFAULT 45;

COMMENT ON COLUMN public.profiles.age_min IS 'Lower bound of preferred roommate age range';
COMMENT ON COLUMN public.profiles.age_max IS 'Upper bound of preferred roommate age range';
