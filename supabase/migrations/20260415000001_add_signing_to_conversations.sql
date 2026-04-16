-- Add per-user signing state to conversations for the Digital Handshake feature.
-- Both provider and seeker must sign before the conversation is marked as finalized.
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS provider_signed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seeker_signed   boolean NOT NULL DEFAULT false;
