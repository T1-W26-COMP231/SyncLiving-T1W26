'use server';

import { createClient } from '@/utils/supabase/server';

export async function toggleSavedProfile(savedUserId: string): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, error: 'Not authenticated' };

  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('saved_user_id', savedUserId)
    .single();

  if (existing) {
    await supabase.from('saved_profiles').delete()
      .eq('user_id', user.id)
      .eq('saved_user_id', savedUserId);
    return { saved: false };
  } else {
    await supabase.from('saved_profiles').insert({ user_id: user.id, saved_user_id: savedUserId });
    return { saved: true };
  }
}
