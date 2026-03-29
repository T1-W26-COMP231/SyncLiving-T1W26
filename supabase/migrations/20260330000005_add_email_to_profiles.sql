-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Function to automatically fetch email from auth.users when a profile is created
CREATE OR REPLACE FUNCTION public.handle_profile_email_on_create()
RETURNS trigger AS $$
BEGIN
  -- When a profile is inserted, look up the email from auth.users
  SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger for new profiles (BEFORE INSERT)
DROP TRIGGER IF EXISTS on_profile_created_fetch_email ON public.profiles;
CREATE TRIGGER on_profile_created_fetch_email
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_email_on_create();

-- 4. Function to sync email when it changes in auth.users
CREATE OR REPLACE FUNCTION public.handle_sync_user_email_on_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger for auth.users updates (AFTER UPDATE)
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_sync_user_email_on_update();

-- 6. Backfill: Update existing profiles that don't have an email yet
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');
