-- Add separate lat/lng columns to room_listings for client-side distance filtering
ALTER TABLE public.room_listings
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision;
