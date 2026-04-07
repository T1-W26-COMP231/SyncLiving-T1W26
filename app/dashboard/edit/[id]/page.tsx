import React from 'react';
import CreateListingForm from '@/components/dashboard/CreateListingForm';
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch Listing Data
  const [
    listingRes,
    roomTypesRes,
    amenitiesRes,
    currentRoomTypeRes,
    currentAmenitiesRes
  ] = await Promise.all([
    supabase.from('room_listings').select('*').eq('id', id).single(),
    supabase.from('room_types').select('id, name').order('name'),
    supabase.from('amenities').select('id, name, category').order('name'),
    supabase.from('listing_room_types').select('room_type_id').eq('listing_id', id).single(),
    supabase.from('listing_amenities').select('amenity_id').eq('listing_id', id)
  ]);

  if (listingRes.error || !listingRes.data) {
    return notFound();
  }

  const initialData = {
    id: listingRes.data.id,
    title: listingRes.data.title,
    address: listingRes.data.address,
    rental_fee: listingRes.data.rental_fee,
    house_rules: listingRes.data.house_rules || '',
    room_type_id: currentRoomTypeRes.data?.room_type_id || '',
    amenities_ids: currentAmenitiesRes.data?.map(a => a.amenity_id) || [],
    city: listingRes.data.city || '',
    postal_code: listingRes.data.postal_code || '',
    lat: listingRes.data.lat || undefined,
    lng: listingRes.data.lng || undefined,
    photos: listingRes.data.photos || [],
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <Navbar activeTab="Listings" />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">Edit Listing</h1>
          <p className="text-slate-500 font-medium">Update your property information.</p>
        </div>

        <CreateListingForm 
          roomTypes={roomTypesRes.data || []} 
          amenities={amenitiesRes.data || []} 
          initialData={initialData}
        />
      </main>
    </div>
  );
}
