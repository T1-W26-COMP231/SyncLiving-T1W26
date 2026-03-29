'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Security helper to verify if the current user is an admin.
 */
async function isAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return !!profile?.is_admin;
}

export async function searchUsers(query: string) {
  if (!(await isAdmin())) throw new Error('Unauthorized');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .or(`full_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('Search error:', error);
    return [];
  }
  return data;
}

export async function getUserFullDetails(userId: string) {
  if (!(await isAdmin())) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Fetch everything in parallel
  const [profileRes, listingsRes, connectionsRes, reviewsGivenRes, reviewsReceivedRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('room_listings').select('*').eq('provider_id', userId),
    supabase.from('user_connections')
      .select(`
        *,
        profiles_1:user_1_id (id, full_name),
        profiles_2:user_2_id (id, full_name)
      `)
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`),
    supabase.from('reviews')
      .select('*, reviewee:reviewee_id(full_name)')
      .eq('reviewer_id', userId),
    supabase.from('reviews')
      .select('*, reviewer:reviewer_id(full_name)')
      .eq('reviewee_id', userId)
  ]);

  return {
    profile: profileRes.data,
    listings: listingsRes.data || [],
    connections: connectionsRes.data || [],
    reviewsGiven: reviewsGivenRes.data || [],
    reviewsReceived: reviewsReceivedRes.data || []
  };
}
