import { ProfileDetails } from '@/components/discovery/ProfileDetails';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !profile) {
    console.error('Error fetching profile:', error);
    notFound();
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

  return <ProfileDetails profile={formattedProfile} />;
}
