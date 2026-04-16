-- Add resolution metadata to user reports and moderation support for admin actions.

-- 1) Extend user_reports with resolution metadata.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'resolution_note'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_reports ADD COLUMN resolution_note text';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'resolved_at'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_reports ADD COLUMN resolved_at timestamptz';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_reports' AND column_name = 'resolved_by'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_reports ADD COLUMN resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL';
  END IF;
END;
$$;

-- 2) Add notifications table for user-facing moderation updates.
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  message text NOT NULL,
  related_object_type text,
  related_object_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id_created_at
ON public.user_notifications (user_id, created_at DESC);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications.
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.user_notifications;
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Administrators can insert notifications for moderation workflows.
DROP POLICY IF EXISTS "Admins can insert user notifications" ON public.user_notifications;
CREATE POLICY "Admins can insert user notifications"
ON public.user_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 3) Allow admins to update user_reports during investigations/resolution.
DROP POLICY IF EXISTS "Admins can update user reports" ON public.user_reports;
CREATE POLICY "Admins can update user reports"
ON public.user_reports
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 4) Allow admins to moderate reviews (soft remove/restore).
DROP POLICY IF EXISTS "Admins can moderate reviews" ON public.reviews;
CREATE POLICY "Admins can moderate reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

COMMENT ON TABLE public.user_notifications IS 'In-app notifications delivered to users for admin decisions and platform updates.';
COMMENT ON COLUMN public.user_reports.resolution_note IS 'Admin-authored note describing the report decision.';
COMMENT ON COLUMN public.user_reports.resolved_at IS 'Timestamp of final admin resolution.';
COMMENT ON COLUMN public.user_reports.resolved_by IS 'Administrator who closed the report.';
