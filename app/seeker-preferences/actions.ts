'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateSeekerPreferences(formData: {
  lifestyle_tag_ids: string[];
  amenity_ids: string[];
  room_type_ids: string[];
  reference_location: string;
  latitude?: number;
  longitude?: number;
  max_distance: number;
  budget_min: number;
  budget_max: number;
}) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const location_coords = (formData.longitude && formData.latitude) 
    ? `POINT(${formData.longitude} ${formData.latitude})` 
    : null;

  try {
    // 1. Update Profile fields (location, distance, budget)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        pref_reference_location: formData.reference_location,
        pref_location_coords: location_coords,
        pref_max_distance: formData.max_distance,
        pref_budget_min: formData.budget_min,
        pref_budget_max: formData.budget_max,
      })
      .eq('id', user.id);
    
    if (profileError) throw profileError;

    // 2. Update Lifestyle Preferences
    await supabase.from('seeker_lifestyle_preferences').delete().eq('user_id', user.id);
    if (formData.lifestyle_tag_ids.length > 0) {
      await supabase.from('seeker_lifestyle_preferences').insert(
        formData.lifestyle_tag_ids.map(id => ({ user_id: user.id, tag_id: id }))
      );
    }

    // 3. Update Amenity Preferences
    await supabase.from('seeker_amenity_preferences').delete().eq('user_id', user.id);
    if (formData.amenity_ids.length > 0) {
      await supabase.from('seeker_amenity_preferences').insert(
        formData.amenity_ids.map(id => ({ user_id: user.id, amenity_id: id }))
      );
    }

    // 4. Update Room Type Preferences
    await supabase.from('seeker_room_type_preferences').delete().eq('user_id', user.id);
    if (formData.room_type_ids.length > 0) {
      await supabase.from('seeker_room_type_preferences').insert(
        formData.room_type_ids.map(id => ({ user_id: user.id, room_type_id: id }))
      );
    }

    revalidatePath('/seeker-preferences');
    return { success: true };
  } catch (err: any) {
    console.error('Error updating preferences:', err);
    return { error: err.message };
  }
}
