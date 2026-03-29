-- 1. Create enum for match request status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_request_status') THEN
        CREATE TYPE public.match_request_status AS ENUM ('pending', 'accepted', 'declined');
    END IF;
END $$;

-- 2. Create match_requests table
CREATE TABLE IF NOT EXISTS public.match_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.match_request_status NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure a user cannot send multiple pending requests to the same person
    CONSTRAINT unique_pending_request UNIQUE (sender_id, receiver_id)
);

-- 3. Enable RLS
ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Users can see requests where they are either the sender or receiver
CREATE POLICY "Users can view their own match requests"
ON public.match_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Only senders can create a request
CREATE POLICY "Users can create a match request"
ON public.match_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Both parties can update the status (receiver accepts/declines, sender might cancel)
CREATE POLICY "Users can update their own match requests"
ON public.match_requests FOR UPDATE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 5. Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Add trigger for updated_at
CREATE TRIGGER handle_match_requests_updated_at
    BEFORE UPDATE ON public.match_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
