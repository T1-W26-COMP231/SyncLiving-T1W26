-- Add 'deleted' to the valid_review_status check constraint
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS valid_review_status;
ALTER TABLE public.reviews ADD CONSTRAINT valid_review_status CHECK (status IN ('active', 'reported', 'hidden', 'deleted'));
