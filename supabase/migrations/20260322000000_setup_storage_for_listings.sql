-- Migration: 20260322000000_setup_storage_for_listings
-- Description: Create storage bucket for property images and set up RLS policies.

-- 1. Create a public bucket for property images
-- Note: 'public' means the files are accessible via a public URL if the path is known.
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies

-- Policy: Allow anyone to view images (Public access)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'property-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
