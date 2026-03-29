-- Migration: Create Review System
-- Description: Tables for roommate rating system with dynamic criteria.

-- 1. Create review_criteria table
CREATE TABLE IF NOT EXISTS public.review_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create reviews table (Main metadata)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    overall_comment TEXT,
    average_score DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent self-reviewing
    CONSTRAINT no_self_review CHECK (reviewer_id <> reviewee_id),
    -- Ensure only one review exists between a specific reviewer and reviewee
    UNIQUE(reviewer_id, reviewee_id)
);

-- 3. Create review_scores table (Individual scores)
CREATE TABLE IF NOT EXISTS public.review_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    criteria_id UUID NOT NULL REFERENCES public.review_criteria(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CONSTRAINT score_range CHECK (score >= 1 AND score <= 5),
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one score per criteria per review
    UNIQUE(review_id, criteria_id)
);

-- 4. Automatic Average Calculation Logic
CREATE OR REPLACE FUNCTION public.calculate_review_average()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.reviews
    SET average_score = (
        SELECT ROUND(AVG(score)::numeric, 2)
        FROM public.review_scores
        WHERE review_id = NEW.review_id
    )
    WHERE id = NEW.review_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_average_score
AFTER INSERT OR UPDATE OR DELETE ON public.review_scores
FOR EACH ROW
EXECUTE FUNCTION public.calculate_review_average();

-- Enable RLS
ALTER TABLE public.review_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- review_criteria: Everyone can read active items
CREATE POLICY "Allow public read active criteria" ON public.review_criteria
    FOR SELECT USING (is_active = true);

-- reviews: Everyone can read reviews (public reputation)
CREATE POLICY "Allow public read reviews" ON public.reviews
    FOR SELECT USING (true);

-- reviews: Authenticated users can insert reviews where they are the reviewer
CREATE POLICY "Allow users to insert reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- reviews: Authenticated users can update their own reviews
CREATE POLICY "Allow users to update their own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = reviewer_id) WITH CHECK (auth.uid() = reviewer_id);

-- review_scores: Everyone can read scores
CREATE POLICY "Allow public read scores" ON public.review_scores
    FOR SELECT USING (true);

-- review_scores: Users can insert scores for reviews they created
CREATE POLICY "Allow users to insert scores" ON public.review_scores
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reviews
            WHERE id = review_id AND reviewer_id = auth.uid()
        )
    );

-- review_scores: Users can update scores for reviews they created
CREATE POLICY "Allow users to update scores" ON public.review_scores
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.reviews
            WHERE id = review_id AND reviewer_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.reviews
            WHERE id = review_id AND reviewer_id = auth.uid()
        )
    );
