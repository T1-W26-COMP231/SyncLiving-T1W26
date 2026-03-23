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

  const { error } = await supabase.from('profiles').upsert(updates);

  if (error) {
    console.error('Error updating preferences:', error);
    return { error: error.message };
  }

  return { success: true };
}
