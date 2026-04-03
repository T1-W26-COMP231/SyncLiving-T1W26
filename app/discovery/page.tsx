import React from 'react';
import { getMatches } from './actions';
import RoommateDiscovery from '@/components/discovery/RoommateDiscovery';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DiscoveryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profile?.is_admin) {
      redirect('/admin/dashboard');
    }
  }

  const {
    matches,
    roomListings,
    userRole,
    preferredTagNames,
    userBinaryPrefs,
    userPreferredGender,
    prefAgeMin,
    prefAgeMax,
    prefBudgetMin,
    prefBudgetMax,
    prefLat,
    prefLng,
    prefMaxDistance,
    prefReferenceLocation,
    bufferKm,
    userAmenityNames,
    userRoomTypeNames,
    allAmenityNames,
    allRoomTypeNames,
    error,
  } = await getMatches();

  return (
    <RoommateDiscovery
      matches={matches}
      roomListings={roomListings}
      userRole={userRole}
      preferredTagNames={preferredTagNames}
      userBinaryPrefs={userBinaryPrefs}
      userPreferredGender={userPreferredGender}
      prefAgeMin={prefAgeMin}
      prefAgeMax={prefAgeMax}
      prefBudgetMin={prefBudgetMin}
      prefBudgetMax={prefBudgetMax}
      prefLat={prefLat}
      prefLng={prefLng}
      prefMaxDistance={prefMaxDistance}
      prefReferenceLocation={prefReferenceLocation}
      bufferKm={bufferKm}
      userAmenityNames={userAmenityNames}
      userRoomTypeNames={userRoomTypeNames}
      allAmenityNames={allAmenityNames}
      allRoomTypeNames={allRoomTypeNames}
      error={error}
    />
  );
}
