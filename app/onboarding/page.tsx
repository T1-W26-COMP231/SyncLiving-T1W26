import React from 'react';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
import { createClient } from '@/utils/supabase/server';

export default async function OnboardingPage() {
  const supabase = await createClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-slate-600">User not authenticated</p>
      </main>
    );
  }

  // Fetch current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 text-slate-900">
      <OnboardingForm initialData={profile} />
    </main>
  );
}
