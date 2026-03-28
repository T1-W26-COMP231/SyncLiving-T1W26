'use server';

import { createClient } from '@/utils/supabase/server';

export async function updatePreferences(data: {
  age_min?: number;
  age_max?: number;
  budget_min?: number;
  budget_max?: number;
  move_in_date?: string;
  lifestyle_tags?: string[];
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const updates: Record<string, any> = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  if (data.age_min !== undefined)      updates.age_min        = data.age_min;
  if (data.age_max !== undefined)      updates.age_max        = data.age_max;
  if (data.budget_min !== undefined)   updates.budget_min     = data.budget_min;
  if (data.budget_max !== undefined)   updates.budget_max     = data.budget_max;
  if (data.move_in_date !== undefined) updates.move_in_date   = data.move_in_date;
  if (data.lifestyle_tags !== undefined) updates.lifestyle_tags = data.lifestyle_tags;

  const { error } = await supabase.from('profiles').upsert(updates as any);

  if (error) {
    console.error('Error updating preferences:', error);
    return { error: error.message };
  }

  return { success: true };
}

export async function updateRoomPreferences(data: {
  amenity_ids: string[];
  room_type_ids: string[];
  reference_location: string;
  latitude?: number;
  longitude?: number;
  max_distance: number;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const location_coords = (data.longitude && data.latitude)
    ? `POINT(${data.longitude} ${data.latitude})`
    : null;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      pref_reference_location: data.reference_location,
      pref_location_coords:    location_coords,
      pref_lat:                data.latitude ?? null,
      pref_lng:                data.longitude ?? null,
      pref_max_distance:       data.max_distance,
    })
    .eq('id', user.id);

  if (profileError) return { error: profileError.message };

  // Replace amenity preferences
  await supabase.from('seeker_amenity_preferences').delete().eq('user_id', user.id);
  if (data.amenity_ids.length > 0) {
    await supabase.from('seeker_amenity_preferences').insert(
      data.amenity_ids.map(id => ({ user_id: user.id, amenity_id: id }))
    );
  }

  // Replace room type preferences
  await supabase.from('seeker_room_type_preferences').delete().eq('user_id', user.id);
  if (data.room_type_ids.length > 0) {
    await supabase.from('seeker_room_type_preferences').insert(
      data.room_type_ids.map(id => ({ user_id: user.id, room_type_id: id }))
    );
  }

  return { success: true };
}
