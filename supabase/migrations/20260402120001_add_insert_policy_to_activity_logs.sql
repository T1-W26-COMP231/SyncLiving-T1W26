-- supabase/migrations/20260402120001_add_insert_policy_to_activity_logs.sql

-- Add a new RLS policy to allow users to insert their own activity logs
CREATE POLICY "Allow users to insert their own activity logs"
ON public.user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);