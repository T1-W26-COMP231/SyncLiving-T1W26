-- Migration: Allow admins to view all user reports
-- Description: Adds a SELECT policy for user_reports to allow administrators to see all records.

-- Clear any stale migration tracking record so db reset never hits a duplicate key conflict
DELETE FROM supabase_migrations.schema_migrations WHERE version = '20260414130000';

DROP POLICY IF EXISTS "Admins can view all user reports" ON public.user_reports;

CREATE POLICY "Admins can view all user reports"
ON public.user_reports
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

COMMENT ON POLICY "Admins can view all user reports" ON public.user_reports IS 'Allows administrators to view all submitted user reports for moderation.';
