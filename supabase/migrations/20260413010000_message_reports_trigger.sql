-- Migration: Automate high-severity alerts for message reports
-- Description: Creates a trigger to insert an admin alert if a user receives > 3 reports in 1 hour.

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.trigger_high_severity_alert_on_reports()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    reported_user UUID;
    alert_exists BOOLEAN;
BEGIN
    -- Find the user who sent the reported message
    SELECT sender_id INTO reported_user
    FROM public.messages
    WHERE id = NEW.message_id;

    -- If we can't find the sender (shouldn't happen with valid FKs), just exit
    IF reported_user IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count how many reports this user's messages have received in the last hour
    SELECT COUNT(*) INTO report_count
    FROM public.message_reports mr
    JOIN public.messages m ON mr.message_id = m.id
    WHERE m.sender_id = reported_user
      AND mr.created_at >= NOW() - INTERVAL '1 hour';

    -- If count is strictly greater than 3 (meaning this is at least the 4th report)
    IF report_count > 3 THEN
        -- Check if we already have an active (unresolved) alert for this specific issue
        -- to prevent spamming the alerts table for the 5th, 6th report etc.
        SELECT EXISTS (
            SELECT 1 
            FROM public.admin_alerts 
            WHERE type = 'security' 
              AND severity = 'high'
              AND is_resolved = false
              AND message LIKE 'User ' || reported_user || ' has received multiple reports recently.%'
        ) INTO alert_exists;

        -- Insert the alert only if one doesn't already exist
        IF NOT alert_exists THEN
            INSERT INTO public.admin_alerts (type, message, severity, is_resolved, created_at)
            VALUES (
                'security',
                'User ' || reported_user || ' has received multiple reports recently. Immediate review required.',
                'high',
                false,
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS after_message_report_insert ON public.message_reports;
CREATE TRIGGER after_message_report_insert
AFTER INSERT ON public.message_reports
FOR EACH ROW
EXECUTE FUNCTION public.trigger_high_severity_alert_on_reports();

-- Add comment
COMMENT ON FUNCTION public.trigger_high_severity_alert_on_reports() IS 'Automatically generates a high severity admin alert when a user receives multiple message reports within an hour.';
