import React from 'react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import CreateListingForm from '@/components/provider-dashboard/CreateListingForm';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

import LandingNavbar from '@/components/landing/LandingNavbar';

export default async function CreateListingPage() {
  const supabase = await createClient();
  
  // Get current user for navbar
  const { data: { user } } = await supabase.auth.getUser();

  // Parallel fetch for room types and amenities
  const [roomTypesRes, amenitiesRes] = await Promise.all([
    supabase.from('room_types').select('id, name').order('name'),
    supabase.from('amenities').select('id, name, category').order('name')
  ]);

  const roomTypes = roomTypesRes.data || [];
  const amenities = amenitiesRes.data || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <LandingNavbar user={user} />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl uppercase">CREATE NEW LISTING</h1>
          <p className="mt-3 text-lg font-medium text-slate-500">Provider View • New Property Registration</p>
        </div>

        {/* Client Form Component */}
        <CreateListingForm 
          roomTypes={roomTypes} 
          amenities={amenities} 
        />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <p className="text-sm font-medium text-slate-500">© {new Date().getFullYear()} SyncLiving. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              <Link href="#" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Help Center</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
