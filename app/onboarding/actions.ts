'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: {
  full_name: string;
  avatar_url?: string;
  bio?: string;
  photos?: string[];
  age: number;
  location: string;
  longitude?: number;
  latitude?: number;
  role: 'seeker' | 'provider';
  lifestyle_tags: string[];
  budget_min: number;
  budget_max: number;
  preferred_gender: string;
  move_in_date: string;
  roommate_age_min?: number;
  roommate_age_max?: number;
  v_wd?: number[];  // FCRM weekday feature vector [social, acoustic, sanitary, rhythm, boundary]
  v_we?: number[];  // FCRM weekend feature vector
}) {
  const supabase = await createClient();

  // Get current user session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Create WKT Point string if coords are provided
  const location_coords = (formData.longitude && formData.latitude) 
    ? `POINT(${formData.longitude} ${formData.latitude})` 
    : null;

  // Update or insert profile
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      full_name: formData.full_name,
      avatar_url: formData.avatar_url,
      bio: formData.bio,
      age: formData.age,
      location: formData.location,
      location_coords: location_coords,
      lat: formData.latitude ?? null,
      lng: formData.longitude ?? null,
      // Mirror location into preference fields so discovery filters work immediately after onboarding
      pref_reference_location: formData.location,
      pref_location_coords: location_coords,
      pref_lat: formData.latitude ?? null,
      pref_lng: formData.longitude ?? null,
      pref_max_distance: 25, // default 25 km radius
      role: formData.role,
      lifestyle_tags: formData.lifestyle_tags,
      photos: formData.photos,
      budget_min: formData.budget_min,
      budget_max: formData.budget_max,
      // Mirror budget into preference fields
      pref_budget_min: formData.budget_min,
      pref_budget_max: formData.budget_max,
      preferred_gender: formData.preferred_gender,
      move_in_date: formData.move_in_date,
      ...(formData.roommate_age_min !== undefined ? { age_min: formData.roommate_age_min } : {}),
      ...(formData.roommate_age_max !== undefined ? { age_max: formData.roommate_age_max } : {}),
      ...(formData.v_wd ? { v_wd: formData.v_wd } : {}),
      ...(formData.v_we ? { v_we: formData.v_we } : {}),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }

  // Return success instead of redirecting here
  // The client side (OnboardingForm) will handle closing the modal or redirecting
  return { success: true };
}
