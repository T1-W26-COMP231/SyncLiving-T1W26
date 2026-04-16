'use server';

import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/utils/activity-logger';
import { revalidatePath } from 'next/cache';
import { checkMessageForSensitiveWords } from '../admin/actions';

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

export interface SentRequest {
  id: string;
  receiver_id: string;
  receiver: MatchProfile;
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
  type?: 'text' | 'action';
  metadata?: Record<string, any> | null;
  // Derived from metadata.actionData for MessageItem rendering
  actionData?: {
    title: string;
    description: string;
    actionLabel: string;
  };
}

export interface RuleData {
  id: string;
  conversation_id: string;
  proposer_id: string;
  title: string;
  description: string;
  status: 'drafting' | 'pending' | 'accepted';
  created_at: string;
  updated_at: string;
  comments_count: number;
}

export interface RuleComment {
  id: string;
  rule_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
}

export interface ConversationDetails {
  id: string;
  provider_id: string;
  seeker_id: string;
  is_finalized: boolean;
  provider_signed: boolean;
  seeker_signed: boolean;
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
 * Fetches all pending match requests sent BY the current user.
 */
export async function getSentRequests(): Promise<SentRequest[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: requests, error } = await supabase
    .from('match_requests')
    .select(`
      id,
      receiver_id,
      message,
      status
    `)
    .eq('sender_id', user.id)
    .eq('status', 'pending');

  if (error || !requests || requests.length === 0) {
    if (error) console.error('Error fetching sent requests:', error);
    return [];
  }

  // Fetch profiles for all receivers
  const receiverIds = requests.map(r => r.receiver_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', receiverIds);

  if (profileError) {
    console.error('Error fetching receiver profiles:', profileError);
    return [];
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return requests
    .map(item => {
      const receiverProfile = profileMap.get(item.receiver_id);
      if (!receiverProfile) return null;
      return {
        id: item.id,
        receiver_id: item.receiver_id,
        message: item.message,
        status: item.status as any,
        receiver: receiverProfile as MatchProfile,
      };
    })
    .filter((req): req is SentRequest => req !== null);
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
    .select('sender_id, receiver_id, status')
    .single();

  if (updateError) {
    console.error('Error updating match request:', updateError);
    return { error: updateError.message };
  }

  console.log('Match request updated successfully:', request);

  // Log activity
  await logActivity(user.id, 'match_request_responded', { 
    sender_id: request.sender_id,
    status: status
  });

  // 2. If accepted, create a conversation and a user connection for testing
  if (status === 'accepted' && request) {
    console.log('Attempting to create conversation and connection...');
    // Start the conversation
    const { error: convError } = await startOrGetConversation(request.sender_id);
    if (convError) {
      console.error('Error starting conversation after acceptance:', convError);
    }

    // CREATE USER CONNECTION FOR TESTING REVIEWS
    const [u1, u2] = [request.sender_id, request.receiver_id].sort();
    console.log(`Upserting connection for users ${u1} and ${u2}`);
    const { error: connError } = await supabase
      .from('user_connections')
      .upsert({
        user_1_id: u1,
        user_2_id: u2,
        status: 'active',
        connection_type: 'roommate',
        can_review: true
      }, { onConflict: 'user_1_id, user_2_id, status' });

    if (connError) {
      console.error('Error creating user connection:', connError);
    } else {
      console.log('User connection created/updated successfully');
    }
  }

  // Invalidate the discovery page so request statuses reflect correctly on refresh
  revalidatePath('/discovery');

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
 * Marks all unread messages in a conversation as read for the current user.
 */
export async function markMessagesAsRead(conversationId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false);
}

/**
 * Counts unread messages sent by others in conversations the current user is part of.
 */
export async function getUnreadMessageCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  // Get all conversation IDs the current user is part of
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`);

  if (!convs || convs.length === 0) return 0;

  const convIds = convs.map(c => c.id);

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .neq('sender_id', user.id)
    .eq('is_read', false);

  return count ?? 0;
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

  // Derive actionData from metadata so MessageItem can render action cards
  return (data as any[]).map(msg => ({
    ...msg,
    actionData: msg.metadata?.actionData ?? undefined,
  })) as MessageData[];
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

  // Fire-and-forget security check
  checkMessageForSensitiveWords(content, user.id);

  return data as MessageData;
}

// ─── Rule helpers ─────────────────────────────────────────────────────────────

/**
 * Inserts an action-type message into the conversation chat.
 * Used to notify both parties when a rule status changes.
 */
async function insertActionMessage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  conversationId: string,
  senderId: string,
  content: string,
  actionData: { title: string; description: string; actionLabel: string },
  ruleId?: string,
) {
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    type: 'action',
    metadata: { actionData, ...(ruleId ? { rule_id: ruleId } : {}) },
  });
}

// ─── Rule actions ─────────────────────────────────────────────────────────────

/**
 * Fetches all rules for a conversation.
 * Drafting rules are returned for all participants — visibility filtering
 * (hide other party's drafts) is handled client-side.
 */
export async function getRules(conversationId: string): Promise<RuleData[]> {
  const supabase = await createClient();
  const { data: rules, error } = await supabase
    .from('conversation_rules')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error || !rules) return [];

  // Fetch comment counts in a single query
  const { data: commentRows } = await supabase
    .from('rule_comments')
    .select('rule_id')
    .in('rule_id', rules.map(r => r.id));

  const countMap = (commentRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.rule_id] = (acc[row.rule_id] ?? 0) + 1;
    return acc;
  }, {});

  return rules.map(r => ({ ...r, comments_count: countMap[r.id] ?? 0 })) as RuleData[];
}

/**
 * Fetches conversation details including signing state.
 */
export async function getConversationDetails(conversationId: string): Promise<ConversationDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('id, provider_id, seeker_id, is_finalized, provider_signed, seeker_signed')
    .eq('id', conversationId)
    .single();

  if (error || !data) return null;
  // Cast via unknown because generated types lag behind the migration that adds provider_signed/seeker_signed
  return data as unknown as ConversationDetails;
}

/**
 * Creates a new rule in drafting status (private to proposer).
 */
export async function proposeRule(
  conversationId: string,
  title: string,
  description: string,
): Promise<{ data?: RuleData; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('conversation_rules')
    .insert({ conversation_id: conversationId, proposer_id: user.id, title, description, status: 'drafting' })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data: { ...data, comments_count: 0 } as RuleData };
}

/**
 * Updates the title/description of a drafting rule.
 */
export async function updateRule(
  ruleId: string,
  title: string,
  description: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('conversation_rules')
    .update({ title, description, updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('proposer_id', user.id)
    .eq('status', 'drafting');

  if (error) return { error: error.message };
  return {};
}

/**
 * Submits a drafting rule for review: drafting → pending.
 * Sends an action message so the other party is notified in the chat.
 */
export async function submitRuleForReview(
  ruleId: string,
  conversationId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: rule, error: fetchErr } = await supabase
    .from('conversation_rules')
    .select('title, description')
    .eq('id', ruleId)
    .single();
  if (fetchErr || !rule) return { error: 'Rule not found' };

  const { error } = await supabase
    .from('conversation_rules')
    .update({ status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', ruleId)
    .eq('proposer_id', user.id);
  if (error) return { error: error.message };

  await insertActionMessage(
    supabase,
    conversationId,
    user.id,
    `Proposed a rule for review: "${rule.title}"`,
    {
      title: `📋 New Rule: ${rule.title}`,
      description: rule.description,
      actionLabel: 'View Rule',
    },
    ruleId,
  );

  revalidatePath('/messages');
  return {};
}

/**
 * Accepts a pending rule: pending → accepted.
 * Sends an action message confirming acceptance.
 */
export async function acceptRule(
  ruleId: string,
  conversationId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: rule, error: fetchErr } = await supabase
    .from('conversation_rules')
    .select('title')
    .eq('id', ruleId)
    .single();
  if (fetchErr || !rule) return { error: 'Rule not found' };

  const { error } = await supabase
    .from('conversation_rules')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', ruleId);
  if (error) return { error: error.message };

  await insertActionMessage(
    supabase,
    conversationId,
    user.id,
    `Accepted the rule: "${rule.title}"`,
    {
      title: `✅ Rule Accepted`,
      description: `"${rule.title}" has been accepted by both parties.`,
      actionLabel: 'View Rule',
    },
    ruleId,
  );

  revalidatePath('/messages');
  return {};
}

/**
 * Sends a pending rule back for revision: pending → drafting.
 * Sends an action message notifying the proposer.
 */
export async function sendRuleBack(
  ruleId: string,
  conversationId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: rule, error: fetchErr } = await supabase
    .from('conversation_rules')
    .select('title')
    .eq('id', ruleId)
    .single();
  if (fetchErr || !rule) return { error: 'Rule not found' };

  const { error } = await supabase
    .from('conversation_rules')
    .update({ status: 'drafting', updated_at: new Date().toISOString() })
    .eq('id', ruleId);
  if (error) return { error: error.message };

  await insertActionMessage(
    supabase,
    conversationId,
    user.id,
    `Sent the rule back for revision: "${rule.title}"`,
    {
      title: `📝 Rule Sent Back`,
      description: `"${rule.title}" needs revision before it can be accepted.`,
      actionLabel: 'View Rule',
    },
    ruleId,
  );

  revalidatePath('/messages');
  return {};
}

/**
 * Adds a comment to a rule.
 */
export async function addRuleComment(
  ruleId: string,
  content: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('rule_comments')
    .insert({ rule_id: ruleId, author_id: user.id, content });

  if (error) return { error: error.message };
  return {};
}

/**
 * Fetches all comments for a rule with author profile info.
 */
export async function getRuleComments(ruleId: string): Promise<RuleComment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rule_comments')
    .select('id, rule_id, author_id, content, created_at')
    .eq('rule_id', ruleId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  // Fetch author profiles
  const authorIds = [...new Set(data.map(c => c.author_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', authorIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return data.map(c => ({
    ...c,
    author_name: profileMap.get(c.author_id)?.full_name ?? null,
    author_avatar: profileMap.get(c.author_id)?.avatar_url ?? null,
  }));
}

/**
 * Signs the agreement for the current user (Digital Handshake).
 * When both parties have signed, the conversation is marked as finalized.
 */
export async function signAgreement(
  conversationId: string,
): Promise<{ finalized?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: convRaw, error: convErr } = await supabase
    .from('conversations')
    .select('provider_id, seeker_id, provider_signed, seeker_signed, is_finalized')
    .eq('id', conversationId)
    .single();
  if (convErr || !convRaw) return { error: 'Conversation not found' };
  // Cast via unknown because generated types lag behind the migration that adds provider_signed/seeker_signed
  const conv = convRaw as unknown as {
    provider_id: string;
    seeker_id: string;
    provider_signed: boolean;
    seeker_signed: boolean;
    is_finalized: boolean;
  };
  if (conv.is_finalized) return { finalized: true };

  const isProvider = conv.provider_id === user.id;
  const signedField = isProvider ? 'provider_signed' : 'seeker_signed';
  const otherSigned = isProvider ? conv.seeker_signed : conv.provider_signed;

  // Check all rules are accepted before allowing signing
  const { data: rules } = await supabase
    .from('conversation_rules')
    .select('status')
    .eq('conversation_id', conversationId);

  const allAccepted = (rules ?? []).length > 0 && (rules ?? []).every(r => r.status === 'accepted');
  if (!allAccepted) return { error: 'All rules must be accepted before signing.' };

  const updatePayload: Record<string, any> = { [signedField]: true };
  const willFinalize = otherSigned;
  if (willFinalize) {
    updatePayload.is_finalized = true;
    updatePayload.finalized_at = new Date().toISOString();
  }

  const { error: updateErr } = await supabase
    .from('conversations')
    .update(updatePayload)
    .eq('id', conversationId);
  if (updateErr) return { error: updateErr.message };

  // Fetch current user name for the message
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const name = myProfile?.full_name ?? 'Someone';

  if (willFinalize) {
    await insertActionMessage(
      supabase,
      conversationId,
      user.id,
      'The agreement has been finalized.',
      {
        title: '🎉 Agreement Finalized!',
        description: 'All rules are now binding for both parties.',
        actionLabel: 'View Agreement',
      },
    );
  } else {
    await insertActionMessage(
      supabase,
      conversationId,
      user.id,
      `${name} has signed the agreement.`,
      {
        title: '🤝 Agreement Signed',
        description: `${name} has signed — waiting for the other party to sign.`,
        actionLabel: 'View Rules',
      },
    );
  }

  revalidatePath('/messages');
  return { finalized: willFinalize };
}
