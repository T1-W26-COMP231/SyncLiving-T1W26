-- Migration: 20260322000003_add_seeker_preferences
-- Description: Create junction tables for user preferences (lifestyle and amenities).

-- 1. Junction table for seeker's roommate lifestyle preferences
CREATE TABLE IF NOT EXISTS public.seeker_lifestyle_preferences (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_id uuid REFERENCES public.lifestyle_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, tag_id)
);

-- 2. Junction table for seeker's room amenity preferences
CREATE TABLE IF NOT EXISTS public.seeker_amenity_preferences (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    amenity_id uuid REFERENCES public.amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, amenity_id)
);

-- 2.5 Junction table for seeker's room type preferences
CREATE TABLE IF NOT EXISTS public.seeker_room_type_preferences (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    room_type_id uuid REFERENCES public.room_types(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, room_type_id)
);

-- 3. Enable Row Level Security
ALTER TABLE public.seeker_lifestyle_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeker_amenity_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeker_room_type_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Define RLS Policies
CREATE POLICY "Users can manage their own lifestyle preferences" 
ON public.seeker_lifestyle_preferences FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own amenity preferences" 
ON public.seeker_amenity_preferences FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own room type preferences" 
ON public.seeker_room_type_preferences FOR ALL 
USING (auth.uid() = user_id);

-- 5. Add read access for everyone (useful for matching algorithms)
CREATE POLICY "Public can view seeker lifestyle preferences" 
ON public.seeker_lifestyle_preferences FOR SELECT 
USING (true);

CREATE POLICY "Public can view seeker amenity preferences" 
ON public.seeker_amenity_preferences FOR SELECT 
USING (true);

CREATE POLICY "Public can view seeker room type preferences" 
ON public.seeker_room_type_preferences FOR SELECT 
USING (true);


-- 6. Add Search Preference Fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pref_reference_location TEXT,
ADD COLUMN IF NOT EXISTS pref_location_coords extensions.geography(POINT, 4326),
ADD COLUMN IF NOT EXISTS pref_max_distance INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS pref_budget_min INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS pref_budget_max INTEGER DEFAULT 3000;

