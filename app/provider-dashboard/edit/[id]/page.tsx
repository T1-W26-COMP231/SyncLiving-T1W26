import React from 'react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import CreateListingForm from '@/components/provider-dashboard/CreateListingForm';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import LandingNavbar from '@/components/landing/LandingNavbar';

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user for navbar
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch Listing Data with raw coordinates
  // Note: We'll parse the geography point in the server action or here
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
    house_rules: listingRes.data.house_rules,
    room_type_id: currentRoomTypeRes.data?.room_type_id || '',
    amenities_ids: currentAmenitiesRes.data?.map(a => a.amenity_id) || [],
    city: listingRes.data.city,
    postal_code: listingRes.data.postal_code,
    photos: listingRes.data.photos || [],
    // coordinates are tricky to parse from WKB here, 
    // we'll rely on the user re-selecting or a future robust parser.
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <LandingNavbar user={user} />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl uppercase">EDIT LISTING</h1>
          <p className="mt-3 text-lg font-medium text-slate-500">Update your property information</p>
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
