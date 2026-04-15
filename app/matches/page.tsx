import { getAcceptedMatches, getDeclinedRequests, getIncomingReviewRequests, getMyReviews } from './actions';
import MatchesPage from '@/components/matches/MatchesPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MatchesRoute() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [activeMatches, archivedMatches, incomingReviewRequests, myReviews] = await Promise.all([
    getAcceptedMatches(),
    getDeclinedRequests(),
    getIncomingReviewRequests(),
    getMyReviews(),
  ]);

  return (
    <MatchesPage
      activeMatches={activeMatches}
      archivedMatches={archivedMatches}
      incomingReviewRequests={incomingReviewRequests}
      myReviews={myReviews}
    />
  );
}
