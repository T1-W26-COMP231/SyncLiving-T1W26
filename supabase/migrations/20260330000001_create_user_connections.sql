-- Migration: Create User Connections
-- Description: Table to track formal relationships between users to gatekeep features like reviews.

CREATE TABLE IF NOT EXISTS public.user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active, completed, terminated
    connection_type TEXT NOT NULL DEFAULT 'roommate', -- roommate, landlord_tenant
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    can_review BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Ensure user_1_id is always less than user_2_id to prevent duplicate pairs (A-B and B-A)
    CONSTRAINT user_pair_ordering CHECK (user_1_id < user_2_id),
    -- Ensure no duplicate active relationships between the same two users
    UNIQUE(user_1_id, user_2_id, status)
);

-- Enable RLS
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own connections" ON public.user_connections
    FOR SELECT USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Allow users to create connections" ON public.user_connections
    FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id);

CREATE POLICY "Allow users to update their own connections" ON public.user_connections
    FOR UPDATE USING (auth.uid() = user_1_id OR auth.uid() = user_2_id);
