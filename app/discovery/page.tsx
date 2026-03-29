import React from 'react';
import { getMatches } from './actions';
import RoommateDiscovery from '@/components/discovery/RoommateDiscovery';

export default async function DiscoveryPage() {
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
