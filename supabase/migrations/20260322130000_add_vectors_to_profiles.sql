-- Add FCRM feature vectors (weekday and weekend) to profiles
-- v_wd / v_we: float arrays ordered [social, acoustic, sanitary, rhythm, boundary]
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS v_wd float[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS v_we float[] DEFAULT NULL;

COMMENT ON COLUMN public.profiles.v_wd IS 'FCRM weekday feature vector [social, acoustic, sanitary, rhythm, boundary]';
COMMENT ON COLUMN public.profiles.v_we IS 'FCRM weekend feature vector [social, acoustic, sanitary, rhythm, boundary]';
