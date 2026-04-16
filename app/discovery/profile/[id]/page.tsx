import { ProfileDetails } from '@/components/discovery/ProfileDetails';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !profile) {
    console.error('Error fetching profile:', error);
    notFound();
  }

  // Check for a pending incoming request from this profile to the current user
  let incomingRequestId: string | null = null;
  let existingRequestStatus: string | null = null;

  if (user) {
    // Incoming: profile user sent me a request
    const { data: incomingRow } = await supabase
      .from('match_requests')
      .select('id')
      .eq('sender_id', id)
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();
    incomingRequestId = incomingRow?.id ?? null;

    // Outgoing: I sent this profile user a request
    const { data: outgoingRow } = await supabase
      .from('match_requests')
      .select('status')
      .eq('sender_id', user.id)
      .eq('receiver_id', id)
      .maybeSingle();
    existingRequestStatus = outgoingRow?.status ?? null;
  }

  // Map database profile to component expected props
  const formattedProfile = {
    id: profile.id,
    full_name: profile.full_name || 'Anonymous',
    avatar_url: profile.avatar_url || undefined,
    bio: profile.bio || undefined,
    age: profile.age || undefined,
    location: profile.location || undefined,
    role: (profile.role as 'seeker' | 'provider') || 'seeker',
    lifestyle_tags: profile.lifestyle_tags || [],
    budget_min: profile.budget_min || undefined,
    budget_max: profile.budget_max || undefined,
    move_in_date: profile.move_in_date || undefined,
    preferred_gender: profile.preferred_gender || undefined,
    photos: profile.photos || [],
  };

  return (
    <ProfileDetails
      profile={formattedProfile}
      incomingRequestId={incomingRequestId}
      existingRequestStatus={existingRequestStatus}
      currentUserId={user?.id ?? null}
    />
  );
}
