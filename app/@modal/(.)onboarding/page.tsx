import React from 'react';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
import { createClient } from '@/utils/supabase/server';

export default async function OnboardingModalPage() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return <OnboardingForm initialData={profile} isModal={true} />;
}
