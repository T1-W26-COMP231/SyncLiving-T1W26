-- Migration: Add Review Criteria (idempotent)
-- Description: Adds objective review criteria (uses safe insert to avoid requiring unique constraint on label).

INSERT INTO public.review_criteria (label, category, display_order)
SELECT v.label, v.category, v.display_order
FROM (
  VALUES
    ('Paid bills on time', 'Financial', 100),
    ('Cleaned kitchen after use', 'Chores', 101),
    ('Handled trash on schedule', 'Chores', 102),
    ('Respected house rules', 'Rules', 103)
) AS v(label, category, display_order)
LEFT JOIN public.review_criteria rc ON rc.label = v.label
WHERE rc.label IS NULL;
