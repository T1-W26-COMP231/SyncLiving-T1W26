-- 1. Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Add geography column to profiles table
-- geography(POINT, 4326) uses meters as units and handles Earth's curvature
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS location_coords geography(POINT, 4326);

-- 3. Create a spatial index for high-performance distance queries
CREATE INDEX IF NOT EXISTS profiles_location_coords_idx 
  ON public.profiles USING GIST (location_coords);

-- 4. Keep the 'location' text column for human-readable names (e.g., "Brooklyn, NY")
-- But we will use 'location_coords' for the actual distance calculations.
