-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 3. Create policy: Allow all authenticated users to select announcements
CREATE POLICY "Allow all authenticated users to select announcements" 
ON public.announcements 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. Create policy: Allow admins to insert announcements
CREATE POLICY "Allow admins to insert announcements" 
ON public.announcements 
FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- 5. Create policy: Allow admins to update announcements
CREATE POLICY "Allow admins to update announcements" 
ON public.announcements 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- 6. Create policy: Allow admins to delete announcements
CREATE POLICY "Allow admins to delete announcements" 
ON public.announcements 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    )
);

-- 7. Create index for performance
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements (created_at DESC);
