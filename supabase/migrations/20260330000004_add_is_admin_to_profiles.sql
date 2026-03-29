-- Migration: Add is_admin to profiles
-- Description: Adds a boolean flag to identify administrator users.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Optional: Update RLS policies to allow admins to see everything (Example for reviews)
-- This is just a placeholder, you can add more admin-specific policies as needed.
-- CREATE POLICY "Admins can view all reviews" ON public.reviews
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public.profiles
--             WHERE id = auth.uid() AND is_admin = true
--         )
--     );
