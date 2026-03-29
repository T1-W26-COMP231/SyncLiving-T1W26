-- Migration: 20260328000001_add_pref_lifestyle_tags
-- Description: Separate binary roommate-filter preferences from the user's own
-- lifestyle_tags (profile data). pref_lifestyle_tags stores what the user
-- WANTS in a roommate; lifestyle_tags stores what the user IS.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pref_lifestyle_tags text[] DEFAULT '{}';
