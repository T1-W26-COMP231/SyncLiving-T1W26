import React from 'react';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
import Navbar from '@/components/layout/Navbar';
import { createClient } from '@/utils/supabase/server';

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-slate-600">User not authenticated</p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const userName = user.email?.split('@')[0] || 'User';
  const isEditing = !!profile?.full_name;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar userName={userName} />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Page title & subtitle */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">
            {isEditing ? 'Edit Your Profile' : 'Create Your Profile'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isEditing
              ? 'Update your details to improve your roommate matches.'
              : 'Tell us about yourself so we can find your perfect roommate match.'}
          </p>
        </div>

        <OnboardingForm initialData={profile} />
      </main>
    </div>
  );
}
