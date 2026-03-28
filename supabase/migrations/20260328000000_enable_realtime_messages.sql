-- Migration: 20260328000000_enable_realtime_messages
-- Description: Add the messages table to the supabase_realtime publication
-- so that postgres_changes events fire for new messages.

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
