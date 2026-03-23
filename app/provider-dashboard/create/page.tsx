import React from 'react';
import CreateListingForm from '@/components/provider-dashboard/CreateListingForm';
import Navbar from '@/components/layout/Navbar';
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
    <div className="min-h-screen bg-[#f8fafb] font-sans pb-20">
      <Navbar activeTab="Listings" />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">
            Create New Listing
          </h1>
          <p className="text-slate-500 font-medium">Fill in the details below to list your room.</p>
        </div>

        <CreateListingForm
          roomTypes={roomTypes}
          amenities={amenities}
        />
      </main>
    </div>
  );
}
