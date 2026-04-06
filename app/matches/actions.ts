'use server';

import { createClient } from '@/utils/supabase/server';

export interface MatchedUser {
  requestId: string;
  userId: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  location: string | null;
  lifestyle_tags: string[];
  matched_at: string;
}

/**
 * Returns all accepted match requests the current user is part of,
 * with the other user's profile data.
 */
export async function getAcceptedMatches(): Promise<MatchedUser[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('match_requests')
    .select('id, sender_id, receiver_id, updated_at')
    .eq('status', 'accepted')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error || !data) return [];

  const otherIds = data.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
  if (otherIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, location, lifestyle_tags')
    .in('id', otherIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return data.map(r => {
    const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
    const profile = profileMap.get(otherId);
    return {
      requestId: r.id,
      userId: otherId,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: profile?.role ?? null,
      location: profile?.location ?? null,
      lifestyle_tags: profile?.lifestyle_tags ?? [],
      matched_at: r.updated_at,
    };
  });
}

/**
 * Returns all declined match requests the current user was part of (archived).
 */
export async function getDeclinedRequests(): Promise<MatchedUser[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('match_requests')
    .select('id, sender_id, receiver_id, updated_at')
    .eq('status', 'declined')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

  if (error || !data) return [];

  const otherIds = data.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id);
  if (otherIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, location, lifestyle_tags')
    .in('id', otherIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return data.map(r => {
    const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id;
    const profile = profileMap.get(otherId);
    return {
      requestId: r.id,
      userId: otherId,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: profile?.role ?? null,
      location: profile?.location ?? null,
      lifestyle_tags: profile?.lifestyle_tags ?? [],
      matched_at: r.updated_at,
    };
  });
}

export interface ReviewRequest {
  id: string;
  requesterId: string;
  requesterName: string | null;
  requesterAvatarUrl: string | null;
  createdAt: string;
}

/**
 * Sends a review request to a matched user, asking them to review you.
 */
export async function sendReviewRequest(
  requesteeId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };
  if (user.id === requesteeId) return { success: false, error: 'Cannot request a review from yourself.' };

  const { error } = await supabase.from('review_requests').upsert(
    { requester_id: user.id, requestee_id: requesteeId, status: 'pending' },
    { onConflict: 'requester_id,requestee_id' },
  );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Fetches incoming review requests for the current user.
 */
export async function getIncomingReviewRequests(): Promise<ReviewRequest[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('review_requests')
    .select('id, requester_id, created_at')
    .eq('requestee_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  const requesterIds = data.map(r => r.requester_id);
  if (requesterIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', requesterIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return data.map(r => {
    const p = profileMap.get(r.requester_id);
    return {
      id: r.id,
      requesterId: r.requester_id,
      requesterName: p?.full_name ?? null,
      requesterAvatarUrl: p?.avatar_url ?? null,
      createdAt: r.created_at,
    };
  });
}

/**
 * Accepts or declines an incoming review request.
 */
export async function respondToReviewRequest(
  requestId: string,
  status: 'accepted' | 'declined',
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('review_requests')
    .update({ status })
    .eq('id', requestId)
    .eq('requestee_id', user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Unmatches the current user from another user by declining the accepted match request.
 */
export async function unmatchUser(
  targetUserId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const { error } = await supabase
    .from('match_requests')
    .update({ status: 'declined' })
    .eq('status', 'accepted')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`
    );

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Submits a user report.
 */
export async function reportUser(
  reportedUserId: string,
  reason: string,
  description?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  if (user.id === reportedUserId)
    return { success: false, error: 'You cannot report yourself.' };

  const { error } = await supabase.from('user_reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    reason,
    description: description || null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
