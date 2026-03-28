'use server';

import { createClient } from '@/utils/supabase/server';

export interface MatchProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
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
