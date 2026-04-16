-- Migration: Create Sensitive Keywords Table
-- Description: Table for storing keywords that trigger security alerts in messages.

-- 1. Create sensitive_keywords table
CREATE TABLE IF NOT EXISTS public.sensitive_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Seed initial keywords
INSERT INTO public.sensitive_keywords (keyword, category) VALUES
  ('wire transfer', 'scam'),
  ('western union', 'scam'),
  ('moneygram', 'scam'),
  ('gift card', 'scam'),
  ('bitcoin', 'scam'),
  ('pay in advance', 'scam'),
  ('deposit before viewing', 'scam'),
  ('send a code', 'scam'),
  
  -- Harassment
  ('bitch', 'harassment'),
  ('bastard', 'harassment'),
  ('idiot', 'harassment'),
  
  -- Violence / Danger
  ('kill', 'danger'),
  ('stab', 'danger'),
  ('shoot', 'danger'),
  ('beat you', 'danger'),
  ('assault', 'danger'),
  
  -- NSFW / Solicitation
  ('nude', 'nsfw'),
  ('naked', 'nsfw'),
  ('hookup', 'nsfw'),
  ('fwb', 'nsfw'),
  ('sugar daddy', 'nsfw'),
  ('sugar baby', 'nsfw'),
  ('escort', 'nsfw'),

  -- Discrimination
  ('no foreigners', 'discrimination'),
  ('whites only', 'discrimination'),
  ('no gays', 'discrimination')
ON CONFLICT (keyword) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.sensitive_keywords ENABLE ROW LEVEL SECURITY;

-- 4. Define RLS Policies
-- Only administrators can manage keywords
CREATE POLICY "Admins can manage sensitive keywords"
ON public.sensitive_keywords
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Authenticated users can read keywords (for frontend/server action checks)
CREATE POLICY "Authenticated users can view sensitive keywords"
ON public.sensitive_keywords
FOR SELECT
TO authenticated
USING (true);

-- 5. Add comments
COMMENT ON TABLE public.sensitive_keywords IS 'Stores keywords used for automated message monitoring and security alerts.';

-- 6. Grant permissions
GRANT SELECT ON public.sensitive_keywords TO authenticated;
CREATE POLICY "Allow authenticated to read keywords" 
ON public.sensitive_keywords FOR SELECT 
TO authenticated 
USING (true);

-- 7. Create admin_alerts table for storing alerts triggered by sensitive keywords
CREATE POLICY "Allow authenticated to insert alerts" 
ON public.admin_alerts FOR INSERT 
TO authenticated 
WITH CHECK (true);