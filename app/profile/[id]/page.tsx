import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import ProfileDetailsPage, { type ProfileData, type ReviewData, type CompatibilityItem } from '@/components/profile/ProfileDetailsPage';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ score?: string }>;
}

// FCRM dimension display labels (index matches vector position)
const DIMENSION_LABELS = [
  'Social Style',
  'Noise Tolerance',
  'Cleanliness',
  'Sleep Schedule',
  'Boundaries & Privacy',
] as const;

/**
 * Compute per-dimension compatibility between two FCRM vectors.
 * Formula: ((1 - |A_wd[i] - B_wd[i]|) * 0.7 + (1 - |A_we[i] - B_we[i]|) * 0.3) * 100
 */
function computeCompatibility(
  viewerWd: number[],
  viewerWe: number[],
  targetWd: number[],
  targetWe: number[],
): CompatibilityItem[] {
  return DIMENSION_LABELS.map((label, i) => {
    const wdSim = 1 - Math.abs((viewerWd[i] ?? 0) - (targetWd[i] ?? 0));
    const weSim = 1 - Math.abs((viewerWe[i] ?? 0) - (targetWe[i] ?? 0));
    const percentage = Math.round((wdSim * 0.7 + weSim * 0.3) * 100);
    return { label, percentage };
  });
}

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { score } = await searchParams;
  const supabase = await createClient();

  // Get the currently logged-in user (for computing compatibility)
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch target profile — include bio, photos, v_wd, v_we
  const { data: profileRow, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, age, location, role, lifestyle_tags, budget_min, budget_max, move_in_date, bio, photos, v_wd, v_we')
    .eq('id', id)
    .single();

  if (profileError || !profileRow) {
    notFound();
  }

  // Fetch reviews left for this profile (reviewee_id = id), joined with reviewer profile
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select(`
      id,
      overall_comment,
      average_score,
      reviewer_id,
      reviewer:profiles!reviews_reviewer_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq('reviewee_id', id)
    .order('id', { ascending: false })
    .limit(20);

  const reviews: ReviewData[] = (reviewRows ?? []).map((r: any) => ({
    id: r.id,
    reviewer_name: r.reviewer?.full_name ?? 'Anonymous',
    reviewer_avatar: r.reviewer?.avatar_url ?? null,
    duration: '',
    rating: r.average_score ? Number(r.average_score) : 5,
    text: r.overall_comment ?? '',
  }));

  // Average reputation from reviews
  const reputation =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  // Compute per-dimension compatibility if both vectors are available
  let compatibility: CompatibilityItem[] | undefined;

  if (profileRow.v_wd && profileRow.v_we) {
    // Try to fetch the viewer's vectors (may be null if not logged in or not set up)
    let viewerWd: number[] | null = null;
    let viewerWe: number[] | null = null;

    if (user) {
      const { data: viewerProfile } = await supabase
        .from('profiles')
        .select('v_wd, v_we')
        .eq('id', user.id)
        .single();
      viewerWd = viewerProfile?.v_wd ?? null;
      viewerWe = viewerProfile?.v_we ?? null;
    }

    if (viewerWd && viewerWe) {
      compatibility = computeCompatibility(viewerWd, viewerWe, profileRow.v_wd, profileRow.v_we);
    } else {
      // Viewer has no vectors yet — show target's self-comparison as placeholder (all 100%)
      // This gives a graceful fallback without crashing
      compatibility = DIMENSION_LABELS.map(label => ({ label, percentage: 100 }));
    }
  }

  // Fetch existing match request status between viewer and this profile (in either direction)
  let initialRequestStatus: 'pending' | 'accepted' | 'declined' | null = null;
  if (user && user.id !== id) {
    const { data: reqRow } = await supabase
      .from('match_requests')
      .select('status')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    initialRequestStatus = (reqRow?.status as unknown as typeof initialRequestStatus) ?? null;
  }

  // Fetch active listing for providers — includes space photos from the listing
  let spaceListing: { title: string; address: string; rental_fee: number } | null = null;
  let spacePhotos: string[] = [];
  if (profileRow.role === 'provider') {
    const { data: listingRow } = await supabase
      .from('room_listings')
      .select('title, address, rental_fee, photos')
      .eq('provider_id', id)
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (listingRow) {
      spaceListing = {
        title: listingRow.title,
        address: listingRow.address,
        rental_fee: listingRow.rental_fee,
      };
      spacePhotos = listingRow.photos ?? [];
    }
  }

  const profile: ProfileData = {
    id: profileRow.id,
    full_name: profileRow.full_name ?? 'Unknown',
    avatar_url: profileRow.avatar_url,
    age: profileRow.age,
    location: profileRow.location,
    role: profileRow.role as 'seeker' | 'provider' | null,
    lifestyle_tags: profileRow.lifestyle_tags ?? [],
    budget_min: profileRow.budget_min,
    budget_max: profileRow.budget_max,
    move_in_date: profileRow.move_in_date,
    bio: profileRow.bio ?? null,
    match_score: score ? Number(score) : null,
    reputation,
    reviews,
    compatibility,
    /** Personal extra photos from profiles.photos — shown in About section */
    profile_photos: profileRow.photos ?? [],
    /** Space photos from the active listing — shown in Living Space section */
    space_photos: spacePhotos,
    space_listing: spaceListing,
  };

  return <ProfileDetailsPage profile={profile} initialRequestStatus={initialRequestStatus} />;
}
