-- Backfill lat/lng from existing PostGIS geography columns for all profiles.
-- ST_X = longitude, ST_Y = latitude (PostGIS convention).

UPDATE public.profiles
SET
  lat = extensions.ST_Y(location_coords::extensions.geometry),
  lng = extensions.ST_X(location_coords::extensions.geometry)
WHERE location_coords IS NOT NULL
  AND (lat IS NULL OR lng IS NULL);

UPDATE public.profiles
SET
  pref_lat = extensions.ST_Y(pref_location_coords::extensions.geometry),
  pref_lng = extensions.ST_X(pref_location_coords::extensions.geometry)
WHERE pref_location_coords IS NOT NULL
  AND (pref_lat IS NULL OR pref_lng IS NULL);

-- Default pref_max_distance to 25 km for profiles that have coords but no distance set.
UPDATE public.profiles
SET pref_max_distance = 25
WHERE pref_lat IS NOT NULL
  AND pref_max_distance IS NULL;
