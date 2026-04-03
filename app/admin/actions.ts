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

  try {
    // Fetch everything in parallel
    const [profileRes, listingsRes, connectionsRes, reviewsGivenRes, reviewsReceivedRes, activityLogsRes] = await Promise.all([
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
        .eq('reviewee_id', userId),
      supabase.from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100)
    ]);

    // Error handling for each query
    if (profileRes.error) {
      console.error('Error fetching profile:', profileRes.error);
      // If the main profile fails, we can't proceed.
      throw new Error(`Error fetching profile: ${profileRes.error.message}`);
    }
    if (listingsRes.error) console.error('Error fetching listings:', listingsRes.error);
    if (connectionsRes.error) console.error('Error fetching connections:', connectionsRes.error);
    if (reviewsGivenRes.error) console.error('Error fetching reviews given:', reviewsGivenRes.error);
    if (reviewsReceivedRes.error) console.error('Error fetching reviews received:', reviewsReceivedRes.error);
    if (activityLogsRes.error) console.error('Error fetching activity logs:', activityLogsRes.error);


    return {
      profile: profileRes.data,
      listings: listingsRes.data || [],
      connections: connectionsRes.data || [],
      reviewsGiven: reviewsGivenRes.data || [],
      reviewsReceived: reviewsReceivedRes.data || [],
      activityLogs: activityLogsRes.data || []
    };
  } catch (error) {
    console.error('General error in getUserFullDetails:', error);
    // Re-throw the error to be caught by the page component
    throw error;
  }
}

export async function updateUserStatus(
  userId: string, 
  status: 'active' | 'suspended' | 'banned', 
  reason?: string, 
  suspendedUntil?: string
) {
  if (!(await isAdmin())) throw new Error('Unauthorized');

  const supabase = await createClient();
  
  const updateData: any = {
    account_status: status,
    status_reason: reason || null,
    suspended_until: status === 'suspended' ? (suspendedUntil || null) : null
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Update status error:', error);
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('No rows updated. Please check if the user exists and your admin permissions.');
  }

  return data[0];
}
