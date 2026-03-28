-- Migration: 20260320000000_create_room_listings_and_normalization
-- Description: Implement Room Listing feature, standardized filtering (Amenities & Lifestyle Tags), and Junction Tables for SyncLiving.

-- 1. Create ENUM types for statuses
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE room_occupancy_status AS ENUM ('vacant', 'occupied');

-- 2. Create Master Table for Lifestyle Tags (Normalization)
CREATE TABLE public.lifestyle_tags (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    category text, -- Optional: to categorize tags (e.g., 'Habits', 'Social')
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Master Table for Amenities (Normalization)
CREATE TABLE public.amenities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    category text, -- Optional: to categorize amenities (e.g., 'Essentials', 'Comfort')
    created_at timestamp with time zone DEFAULT now()
);

-- 3.5 Create Master Table for Room Types (Normalization)
CREATE TABLE public.room_types (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create Main Listing Table (room_listings)
CREATE TABLE public.room_listings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Content
    title text NOT NULL,
    
    -- Statuses
    status post_status DEFAULT 'draft' NOT NULL,
    room_status room_occupancy_status DEFAULT 'vacant' NOT NULL,
    
    -- Location Information
    address text NOT NULL,
    city text NOT NULL,
    postal_code text NOT NULL,
    -- PostGIS point for matching logic
    location_coords extensions.geography(POINT, 4326),

    -- Financials & Content
    rental_fee numeric(10, 2) NOT NULL CHECK (rental_fee >= 0),
    house_rules text,
    photos text[] DEFAULT '{}', -- Array of URLs stored in blob storage
    
    -- Timeline
    vacant_start_date date NOT NULL,
    expected_move_in_date date,
    lease_start_date date,
    lease_end_date date,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Junction Tables for standardized filtering
-- many-to-many relationship between room_listings and lifestyle_tags
CREATE TABLE public.listing_lifestyle_tags (
    listing_id uuid REFERENCES public.room_listings(id) ON DELETE CASCADE,
    tag_id uuid REFERENCES public.lifestyle_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (listing_id, tag_id)
);

-- many-to-many relationship between room_listings and amenities
CREATE TABLE public.listing_amenities (
    listing_id uuid REFERENCES public.room_listings(id) ON DELETE CASCADE,
    amenity_id uuid REFERENCES public.amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (listing_id, amenity_id)
);

-- relationship between room_listings and room_types (One type per listing)
CREATE TABLE public.listing_room_types (
    listing_id uuid PRIMARY KEY REFERENCES public.room_listings(id) ON DELETE CASCADE,
    room_type_id uuid REFERENCES public.room_types(id) ON DELETE CASCADE
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.lifestyle_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_lifestyle_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_room_types ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies

-- Lifestyle Tags, Amenities & Room Types: Read access for everyone
CREATE POLICY "Public read for lifestyle_tags" ON public.lifestyle_tags FOR SELECT USING (true);
CREATE POLICY "Public read for amenities" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "Public read for room_types" ON public.room_types FOR SELECT USING (true);

-- Room Listings: 
-- 1. Everyone can view 'published' listings
CREATE POLICY "Public read for published listings" 
ON public.room_listings FOR SELECT 
USING (status = 'published');

-- 2. Providers can view/manage their own listings (even draft/archived)
CREATE POLICY "Providers manage own listings" 
ON public.room_listings FOR ALL 
USING (auth.uid() = provider_id);

-- Junction Tables Policies
CREATE POLICY "Public read for listing_tags" ON public.listing_lifestyle_tags FOR SELECT USING (true);
CREATE POLICY "Public read for listing_amenities" ON public.listing_amenities FOR SELECT USING (true);

CREATE POLICY "Providers manage own listing_tags" 
ON public.listing_lifestyle_tags FOR ALL 
USING (EXISTS (SELECT 1 FROM public.room_listings WHERE id = listing_id AND provider_id = auth.uid()));

CREATE POLICY "Providers manage own listing_amenities" 
ON public.listing_amenities FOR ALL 
USING (EXISTS (SELECT 1 FROM public.room_listings WHERE id = listing_id AND provider_id = auth.uid()));

CREATE POLICY "Public read for listing_room_types" ON public.listing_room_types FOR SELECT USING (true);

CREATE POLICY "Providers manage own listing_room_types" 
ON public.listing_room_types FOR ALL 
USING (EXISTS (SELECT 1 FROM public.room_listings WHERE id = listing_id AND provider_id = auth.uid()));

-- 8. Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_room_listings_updated_at
    BEFORE UPDATE ON public.room_listings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
