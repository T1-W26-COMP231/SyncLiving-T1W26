-- Migration: Add overall_rating to reviews and simplify scoring
-- Description: Adds a direct overall_rating column and removes the automatic averaging trigger.

-- 1. Add overall_rating column to public.reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS overall_rating INTEGER CONSTRAINT overall_rating_range CHECK (overall_rating >= 1 AND overall_rating <= 5);

-- 2. Backfill overall_rating from average_score (rounded)
UPDATE public.reviews SET overall_rating = ROUND(average_score);

-- 3. Drop the trigger and function that automatically calculates average from review_scores
DROP TRIGGER IF EXISTS trigger_update_average_score ON public.review_scores;
DROP FUNCTION IF EXISTS public.calculate_review_average();

-- 4. (Optional) We keep average_score for now to avoid breaking existing code, 
-- but we should eventually transition everything to overall_rating.
-- For now, let's keep it in sync manually or just use overall_rating in code.
