import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/layout/Navbar';

export default async function DiscoveryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <Navbar userName={userName} activeTab="Discovery" />
      <main className="max-w-7xl mx-auto px-6 py-16 flex flex-col items-center justify-center text-center gap-4">
        <h1 className="text-3xl font-extrabold text-dark">Discovery</h1>
        <p className="text-slate-500 max-w-md">
          Your roommate matches will appear here based on your lifestyle profile.
          Complete your profile to start finding compatible roommates.
        </p>
      </main>
    </div>
  );
}
