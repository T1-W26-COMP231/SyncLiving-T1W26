-- Migration: Add status to reviews table
-- Description: Adds a 'status' column to track the state of a review (active, reported, hidden).

-- 1. Add 'status' column to public.reviews
ALTER TABLE public.reviews
ADD COLUMN status TEXT DEFAULT 'active';

-- 2. Create an index on the new 'status' column for query optimization
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- 3. Add a check constraint to ensure only valid statuses are used (optional but recommended)
ALTER TABLE public.reviews
ADD CONSTRAINT valid_review_status CHECK (status IN ('active', 'reported', 'hidden'));

-- RLS Policy: Allow reviewees to report reviews
CREATE POLICY "Allow reviewees to report reviews"
ON public.reviews
FOR UPDATE
TO authenticated
-- USING condition: Only allow the "reviewee" to see and update their own reviews
USING ( auth.uid() = reviewee_id )
-- WITH CHECK condition: Ensure they can only change the status to 'reported', not modify other fields
WITH CHECK ( auth.uid() = reviewee_id AND status = 'reported' );