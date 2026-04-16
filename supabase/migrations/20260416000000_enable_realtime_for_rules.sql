-- Enable realtime for house rules negotiation tables.
-- REPLICA IDENTITY FULL is required for filtered UPDATE subscriptions
-- (e.g. conversation_id=eq.xxx) to be delivered to clients.
-- Without it, only INSERT events are reliably received.

ALTER TABLE public.conversation_rules REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
