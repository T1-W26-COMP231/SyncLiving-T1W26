import React from 'react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import CreateListingForm from '@/components/provider-dashboard/CreateListingForm';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function CreateListingPage() {
  const supabase = await createClient();
  
  // Parallel fetch for room types and amenities
  const [roomTypesRes, amenitiesRes] = await Promise.all([
    supabase.from('room_types').select('id, name').order('name'),
    supabase.from('amenities').select('id, name, category').order('name')
  ]);

  const roomTypes = roomTypesRes.data || [];
  const amenities = amenitiesRes.data || [];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <SyncLivingLogo size="md" />
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <button className="flex items-center gap-2 pl-2 focus:outline-none">
              <img
                alt="User Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-slate-100"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0bDjsyS7oF7JyzuuowQsP6vIbqstRGiR1WVMRwBgYg2e3ne9dN4jrXDYSm33-Fu18ra1nLoVBpWPKWKEy9XM31oS70Q3UAxON3mr4oLPY8BMgx4IVBYNnOeHzQKKqNjeJsPCi17qTKWuezySEsCuVi7j2aCcgW05sYUggToaaDQj2H2j1j3m68hwi2IM7ulMT0zAp1mgHcltBS0XjrOctcyU6sltLm9gK2IjVB3d21zOrte-PSlFleSIydfnK19DqdeFoIZ6KVEy3"
              />
            </button>
          </div>
        </div>
      </header>

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
