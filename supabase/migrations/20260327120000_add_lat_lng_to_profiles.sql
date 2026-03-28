-- Add plain float lat/lng columns to profiles for easy JS-side distance filtering.
-- These mirror location_coords and pref_location_coords but are readable without PostGIS parsing.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lat  double precision,
  ADD COLUMN IF NOT EXISTS lng  double precision,
  ADD COLUMN IF NOT EXISTS pref_lat double precision,
  ADD COLUMN IF NOT EXISTS pref_lng double precision;
