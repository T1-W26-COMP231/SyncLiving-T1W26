-- Migration: 20260321000000_create_messaging_and_rules_schema
-- Description: Implement messaging system and collaborative house rules negotiation.

-- 1. Create ENUM types for messaging and rules
CREATE TYPE rule_status AS ENUM ('drafting', 'pending', 'accepted');
CREATE TYPE message_type AS ENUM ('text', 'action');

-- 2. Create Conversations Table
-- This links two users (seeker and provider) and optionally a room listing.
CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.room_listings(id) ON DELETE SET NULL,
    seeker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Status of the overall agreement
    is_finalized boolean DEFAULT false NOT NULL,
    finalized_at timestamp with time zone,
    
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Ensure a seeker and provider have only one active conversation per listing
    UNIQUE (seeker_id, provider_id, listing_id)
);

-- 3. Create Messages Table
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    content text NOT NULL,
    type message_type DEFAULT 'text' NOT NULL,
    
    -- For 'action' type messages (e.g., rule proposals)
    metadata jsonb DEFAULT '{}'::jsonb, 
    
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 4. Create House Rules Negotiation Table
-- Rules are specific to a conversation between two people.
CREATE TABLE public.conversation_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    proposer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    title text NOT NULL,
    description text NOT NULL,
    status rule_status DEFAULT 'drafting' NOT NULL,
    
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Create Rule Comments Table
CREATE TABLE public.rule_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id uuid NOT NULL REFERENCES public.conversation_rules(id) ON DELETE CASCADE,
    author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_comments ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies

-- Conversations: Users can only see/manage conversations they are part of
CREATE POLICY "Users can view their own conversations" 
ON public.conversations FOR SELECT 
USING (auth.uid() = seeker_id OR auth.uid() = provider_id);

CREATE POLICY "Users can create conversations" 
ON public.conversations FOR INSERT 
WITH CHECK (auth.uid() = seeker_id OR auth.uid() = provider_id);

-- Messages: Users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations" 
ON public.messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
        AND (seeker_id = auth.uid() OR provider_id = auth.uid())
    )
);

CREATE POLICY "Users can send messages in their conversations" 
ON public.messages FOR INSERT 
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
        AND (seeker_id = auth.uid() OR provider_id = auth.uid())
    )
);

-- Rules: Users can see/manage rules in their conversations
CREATE POLICY "Users can view rules in their conversations" 
ON public.conversation_rules FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
        AND (seeker_id = auth.uid() OR provider_id = auth.uid())
    )
);

CREATE POLICY "Users can manage rules in their conversations" 
ON public.conversation_rules FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.conversations 
        WHERE id = conversation_id 
        AND (seeker_id = auth.uid() OR provider_id = auth.uid())
    )
);

-- Rule Comments: Users can see/add comments in their conversations
CREATE POLICY "Users can view rule comments" 
ON public.rule_comments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_rules r
        JOIN public.conversations c ON r.conversation_id = c.id
        WHERE r.id = rule_id 
        AND (c.seeker_id = auth.uid() OR c.provider_id = auth.uid())
    )
);

CREATE POLICY "Users can add rule comments" 
ON public.rule_comments FOR INSERT 
WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_rules r
        JOIN public.conversations c ON r.conversation_id = c.id
        WHERE r.id = rule_id 
        AND (c.seeker_id = auth.uid() OR c.provider_id = auth.uid())
    )
);

-- 8. Add trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_conversation_rules_updated_at
    BEFORE UPDATE ON public.conversation_rules
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
