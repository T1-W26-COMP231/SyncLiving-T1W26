'use server';

import { createClient } from '@/utils/supabase/server';

export interface MatchProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface PendingRequest {
  id: string;
  sender_id: string;
  sender: MatchProfile;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined';
}

export interface Match {
  id: string;
  listing_id: string | null;
  seeker_id: string;
  provider_id: string;
  other_user: MatchProfile;
  last_message?: string;
}

export interface MessageData {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ConversationWithProfiles {
  id: string;
  listing_id: string | null;
  seeker_id: string;
  provider_id: string;
  seeker: MatchProfile;
  provider: MatchProfile;
}

/**
 * Fetches all pending match requests received by the current user.
 */
export async function getPendingRequests(): Promise<PendingRequest[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: requests, error } = await supabase
    .from('match_requests')
    .select(`
      id,
      sender_id,
      message,
      status
    `)
    .eq('receiver_id', user.id)
    .eq('status', 'pending');

  if (error || !requests || requests.length === 0) {
    if (error) console.error('Error fetching pending requests:', error);
    return [];
  }

  // Fetch profiles for all senders
  const senderIds = requests.map(r => r.sender_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', senderIds);

  if (profileError) {
    console.error('Error fetching sender profiles:', profileError);
    return [];
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return requests
    .map(item => {
      const senderProfile = profileMap.get(item.sender_id);
      if (!senderProfile) return null;
      return {
        id: item.id,
        sender_id: item.sender_id,
        message: item.message,
        status: item.status as any,
        sender: senderProfile as MatchProfile,
      };
    })
    .filter((req): req is PendingRequest => req !== null);
}

/**
 * Accepts or declines a match request.
 * If accepted, it also ensures a conversation exists.
 */
export async function respondToMatchRequest(requestId: string, status: 'accepted' | 'declined') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // 1. Update the request status
  const { data: request, error: updateError } = await supabase
    .from('match_requests')
    .update({ status })
    .eq('id', requestId)
    .select('sender_id, receiver_id')
    .single();

  if (updateError) {
    console.error('Error updating match request:', updateError);
    return { error: updateError.message };
  }

  // 2. If accepted, create a conversation
  if (status === 'accepted' && request) {
    const { error: convError } = await startOrGetConversation(request.sender_id);
    if (convError) {
      console.error('Error starting conversation after acceptance:', convError);
      // We don't necessarily fail the whole action if the conversation fails, 
      // but it's good to log.
    }
  }

  return { success: true };
}

/**
 * Fetches all conversations (matches) for the current user.
 */
export async function getMatches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      listing_id,
      seeker_id,
      provider_id,
      seeker:seeker_id (id, full_name, avatar_url),
      provider:provider_id (id, full_name, avatar_url)
    `)
    .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`);

  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }

  return (data as unknown as ConversationWithProfiles[] || []).map((item) => {
    const isSeeker = item.seeker_id === user.id;
    const otherUser = isSeeker ? item.provider : item.seeker;
    
    return {
      id: item.id,
      listing_id: item.listing_id,
      seeker_id: item.seeker_id,
      provider_id: item.provider_id,
      other_user: otherUser as MatchProfile,
    };
  }) as Match[];
}

/**
 * Fetches message history for a specific conversation.
 */
export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data as MessageData[];
}

/**
 * Finds or creates a direct conversation between the current user and a target user.
 * Handles any role combination by checking both orientations (seeker↔provider).
 */
export async function startOrGetConversation(targetUserId: string): Promise<{ conversationId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Look for an existing conversation in either direction (no listing attached)
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(seeker_id.eq.${user.id},provider_id.eq.${targetUserId}),` +
      `and(seeker_id.eq.${targetUserId},provider_id.eq.${user.id})`
    )
    .is('listing_id', null)
    .maybeSingle();

  if (existing) return { conversationId: existing.id };

  // Determine seeker/provider assignment based on current user's role
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const currentIsProvider = myProfile?.role === 'provider';
  const seekerId  = currentIsProvider ? targetUserId : user.id;
  const providerId = currentIsProvider ? user.id : targetUserId;

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ seeker_id: seekerId, provider_id: providerId, listing_id: null })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { conversationId: created.id };
}

/**
 * Sends a new message in a conversation.
 */
export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data as MessageData;
}
