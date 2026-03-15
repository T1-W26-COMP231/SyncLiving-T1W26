'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: {
  full_name: string;
  age: number;
  location: string;
  longitude?: number; // Added for PostGIS
  latitude?: number;  // Added for PostGIS
  role: 'seeker' | 'provider';
  lifestyle_tags: string[];
  budget_min: number;
  budget_max: number;
  preferred_gender: string;
  move_in_date: string;
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
      age: formData.age,
      location: formData.location,
      location_coords: location_coords, // Save as Geography for GIST indexing
      role: formData.role,
      lifestyle_tags: formData.lifestyle_tags,
      budget_min: formData.budget_min,
      budget_max: formData.budget_max,
      preferred_gender: formData.preferred_gender,
      move_in_date: formData.move_in_date,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }

  // Redirect to homepage after success
  redirect('/');
}
