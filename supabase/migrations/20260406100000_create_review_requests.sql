-- Creates the review_requests table so matched users can ask each other for reviews.
CREATE TABLE IF NOT EXISTS public.review_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requestee_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, requestee_id)
);

ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

-- Requester can insert and read their own outgoing requests.
CREATE POLICY "Requester can send and view own requests"
  ON public.review_requests
  FOR ALL
  USING (requester_id = auth.uid())
  WITH CHECK (requester_id = auth.uid());

-- Requestee can read and update (accept/decline) incoming requests.
CREATE POLICY "Requestee can view and respond to incoming requests"
  ON public.review_requests
  FOR ALL
  USING (requestee_id = auth.uid());

-- Enable real-time for this table.
ALTER PUBLICATION supabase_realtime ADD TABLE public.review_requests;
