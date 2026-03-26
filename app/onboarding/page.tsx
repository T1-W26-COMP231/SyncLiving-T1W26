'use client';

import React, { useState, useEffect } from 'react';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
import Navbar from '@/components/layout/Navbar';
import SettingsModal from '@/components/settings/SettingsModal';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(profile);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isEditing = !!profile?.full_name;

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans">
        <Navbar />

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
    </>
  );
}
