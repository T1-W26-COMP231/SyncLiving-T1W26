-- Stores profiles that a user has saved (hearted) in discovery
CREATE TABLE IF NOT EXISTS public.saved_profiles (
    user_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    saved_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at    timestamptz DEFAULT NOW(),
    PRIMARY KEY (user_id, saved_user_id)
);

ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved profiles"
ON public.saved_profiles FOR ALL
USING (auth.uid() = user_id);
