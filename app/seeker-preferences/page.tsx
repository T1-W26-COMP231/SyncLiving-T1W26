import React from 'react';
import { createClient } from '@/utils/supabase/server';
import SeekerPreferencesClient from '@/components/seeker-preferences/SeekerPreferencesClient';
import { redirect } from 'next/navigation';

export default async function SeekerPreferencesPage() {
  const supabase = await createClient();

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch Master Data and User Profile
  const [tagsRes, amenitiesRes, roomTypesRes, userLsPrefsRes, userAmPrefsRes, userRtPrefsRes, profileRes] = await Promise.all([
    supabase.from('lifestyle_tags').select('*').order('name'),
    supabase.from('amenities').select('*').order('name'),
    supabase.from('room_types').select('*').order('name'),
    supabase.from('seeker_lifestyle_preferences').select('tag_id').eq('user_id', user.id),
    supabase.from('seeker_amenity_preferences').select('amenity_id').eq('user_id', user.id),
    supabase.from('seeker_room_type_preferences').select('room_type_id').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  const allTags = tagsRes.data || [];
  const allAmenities = amenitiesRes.data || [];
  const allRoomTypes = roomTypesRes.data || [];
  
  const initialTagIds = userLsPrefsRes.data?.map(p => p.tag_id) || [];
  const initialAmenityIds = userAmPrefsRes.data?.map(p => p.amenity_id) || [];
  const initialRoomTypeIds = userRtPrefsRes.data?.map(p => p.room_type_id) || [];
  
  const profile = profileRes.data;

  // Parse initial coordinates for preferences
  let initialLat: number | undefined;
  let initialLng: number | undefined;
  if (profile?.pref_location_coords) {
    if (typeof profile.pref_location_coords === 'string') {
      const m = profile.pref_location_coords.match(/POINT\((.+) (.+)\)/);
      if (m) { initialLng = parseFloat(m[1]); initialLat = parseFloat(m[2]); }
    } else if (profile.pref_location_coords.coordinates) {
      initialLng = profile.pref_location_coords.coordinates[0];
      initialLat = profile.pref_location_coords.coordinates[1];
    }
  }

  const initialData = {
    reference_location: profile?.pref_reference_location || '',
    latitude: initialLat,
    longitude: initialLng,
    max_distance: profile?.pref_max_distance || 10,
    budget_min: profile?.pref_budget_min || 500,
    budget_max: profile?.pref_budget_max || 3000,
  };

  return (
    <SeekerPreferencesClient 
      allTags={allTags}
      allAmenities={allAmenities}
      allRoomTypes={allRoomTypes}
      initialTagIds={initialTagIds}
      initialAmenityIds={initialAmenityIds}
      initialRoomTypeIds={initialRoomTypeIds}
      initialData={initialData}
    />
  );
}
