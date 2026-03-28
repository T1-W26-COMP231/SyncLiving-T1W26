-- Backfill lat/lng from existing PostGIS geography columns for all profiles.
-- ST_X = longitude, ST_Y = latitude (PostGIS convention).

UPDATE public.profiles
SET
  lat = ST_Y(location_coords::geometry),
  lng = ST_X(location_coords::geometry)
WHERE location_coords IS NOT NULL
  AND (lat IS NULL OR lng IS NULL);

UPDATE public.profiles
SET
  pref_lat = ST_Y(pref_location_coords::geometry),
  pref_lng = ST_X(pref_location_coords::geometry)
WHERE pref_location_coords IS NOT NULL
  AND (pref_lat IS NULL OR pref_lng IS NULL);

-- Default pref_max_distance to 25 km for profiles that have coords but no distance set.
UPDATE public.profiles
SET pref_max_distance = 25
WHERE pref_lat IS NOT NULL
  AND pref_max_distance IS NULL;
