-- Create user_reports table for reporting inappropriate/unsafe users
CREATE TABLE public.user_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id uuid       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason          text        NOT NULL CHECK (reason IN ('Harassment', 'Fake Profile', 'Inappropriate Content', 'Spam', 'Other')),
  description     text,
  status          text        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit reports
CREATE POLICY "Users can create reports"
ON public.user_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own submitted reports
CREATE POLICY "Users can view their own reports"
ON public.user_reports FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);
