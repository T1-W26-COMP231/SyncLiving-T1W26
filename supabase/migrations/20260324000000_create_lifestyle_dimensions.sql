-- Create tables for lifestyle dimensions and options
CREATE TABLE IF NOT EXISTS public.lifestyle_dimensions (
    id TEXT PRIMARY KEY, -- e.g., 'social', 'acoustic'
    label TEXT NOT NULL,
    description TEXT,
    icon_name TEXT, -- slug for Lucide icons
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lifestyle_options (
    id SERIAL PRIMARY KEY,
    dimension_id TEXT REFERENCES public.lifestyle_dimensions(id) ON DELETE CASCADE,
    tag TEXT NOT NULL, -- e.g., 'TheHermit'
    label TEXT NOT NULL,
    value NUMERIC(3, 2) NOT NULL, -- e.g., 0.1, 0.5
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dimension_id, tag)
);

-- Enable RLS
ALTER TABLE public.lifestyle_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifestyle_options ENABLE ROW LEVEL SECURITY;

-- Allow public read access (authenticated users)
CREATE POLICY "Allow authenticated read for lifestyle_dimensions" ON public.lifestyle_dimensions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read for lifestyle_options" ON public.lifestyle_options
    FOR SELECT TO authenticated USING (true);
