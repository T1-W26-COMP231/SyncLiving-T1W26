-- Create account status enum type
CREATE TYPE public.account_status_type AS ENUM ('active', 'suspended', 'banned');

-- Add status columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN account_status public.account_status_type DEFAULT 'active' NOT NULL,
ADD COLUMN status_reason TEXT,
ADD COLUMN suspended_until TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.account_status IS 'User account lifecycle status: active, suspended, or banned';
COMMENT ON COLUMN public.profiles.status_reason IS 'Internal or external reason for the current account status';
COMMENT ON COLUMN public.profiles.suspended_until IS 'Timestamp when a suspension is scheduled to expire';

-- DROP potentially recursive policies to clean up
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a SECURITY DEFINER function to check if a user is an admin
-- This function bypasses RLS, which prevents the infinite recursion error
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- POLICY: Admins can view all profiles
-- Uses the is_admin function to safely check permissions without recursion
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  public.is_admin(auth.uid())
);

-- POLICY: Admins can update any profile
-- Uses the is_admin function to safely check permissions without recursion
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  public.is_admin(auth.uid())
)
WITH CHECK (
  public.is_admin(auth.uid())
);

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;
