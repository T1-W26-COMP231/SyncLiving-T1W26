import React from 'react';
import { getMatches } from './actions';
import RoommateDiscovery from '@/components/discovery/RoommateDiscovery';

export default async function DiscoveryPage() {
  const {
    matches,
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
    error,
  } = await getMatches();

  return (
    <RoommateDiscovery
      matches={matches}
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
      error={error}
    />
  );
}
