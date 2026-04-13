-- Convert house_rules from TEXT to TEXT[]
ALTER TABLE public.room_listings 
ALTER COLUMN house_rules TYPE text[] 
USING CASE 
    WHEN house_rules IS NULL OR house_rules = '' THEN '{}'::text[]
    ELSE ARRAY[house_rules] 
END;

-- Set default value
ALTER TABLE public.room_listings ALTER COLUMN house_rules SET DEFAULT '{}'::text[];
