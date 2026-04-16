-- Fix mutable search_path on SECURITY DEFINER trigger functions.
-- Both functions query auth.users with elevated privileges, so pinning
-- search_path to '' forces all references to be schema-qualified and
-- prevents schema-injection attacks.

CREATE OR REPLACE FUNCTION public.handle_profile_email_on_create()
RETURNS trigger AS $$
BEGIN
  -- Look up the email from auth.users using fully-qualified names
  SELECT email INTO NEW.email FROM auth.users WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_sync_user_email_on_update()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
