-- Add missing UPDATE RLS policies needed for the Digital Handshake and mark-as-read features.

-- Allow participants to update their own conversation (e.g., set provider_signed / seeker_signed / is_finalized)
CREATE POLICY "Participants can update their conversation"
ON public.conversations FOR UPDATE
USING (auth.uid() = seeker_id OR auth.uid() = provider_id)
WITH CHECK (auth.uid() = seeker_id OR auth.uid() = provider_id);

-- Allow participants to update messages in their conversation (e.g., mark as read)
CREATE POLICY "Participants can update messages in their conversation"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (seeker_id = auth.uid() OR provider_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND (seeker_id = auth.uid() OR provider_id = auth.uid())
  )
);
