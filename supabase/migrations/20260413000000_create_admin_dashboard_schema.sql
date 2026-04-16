-- Migration: Create Admin Dashboard Schema
-- Description: Tables for system alerts and message reporting trail.

-- 1. Create admin_alerts table
CREATE TABLE IF NOT EXISTS public.admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('security', 'system', 'performance')),
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create message_reports table
CREATE TABLE IF NOT EXISTS public.message_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- 4. Admin Alerts Policies
-- Only administrators can view or manage alerts
CREATE POLICY "Admins can manage all alerts"
ON public.admin_alerts
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Authenticated users can insert alerts (e.g. triggered by keyword detection)
CREATE POLICY "Allow authenticated to insert alerts"
ON public.admin_alerts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Message Reports Policies
-- Any authenticated user can submit a report
CREATE POLICY "Users can submit message reports"
ON public.message_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Only administrators can view or update reports
CREATE POLICY "Admins can manage message reports"
ON public.message_reports
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- 6. Add comments for clarity
COMMENT ON TABLE public.admin_alerts IS 'Stores system-wide alerts and security notifications for administrators.';
COMMENT ON TABLE public.message_reports IS 'Audit trail for flagged chat messages reported by users.';
