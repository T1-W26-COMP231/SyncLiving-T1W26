'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { respondToMatchRequest } from '../../../app/messages/actions';
import { sendMatchRequest } from '../../../app/discovery/actions';
import { MatchConfirmedModal } from '@/components/ui/MatchConfirmedModal';
import { createClient } from '@/utils/supabase/client';
import OnboardingForm from '@/components/onboarding/OnboardingForm';

interface ProfileConnectButtonProps {
  targetUserId: string;
  targetUserName: string | null;
  targetAvatarUrl: string | null;
  /** Request ID if this person has already sent me a pending request */
  incomingRequestId?: string | null;
  /** My existing outgoing request status for this person */
  existingRequestStatus?: string | null;
  /** True when the viewer is looking at their own profile */
  isOwnProfile?: boolean;
}

export const ProfileConnectButton: React.FC<ProfileConnectButtonProps> = ({
  targetUserId,
  targetUserName,
  targetAvatarUrl,
  incomingRequestId,
  existingRequestStatus,
  isOwnProfile = false,
}) => {
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(existingRequestStatus ?? null);
  const [matchedUser, setMatchedUser] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<any>(null);

  async function handleEditProfile() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, bio, age, preferred_gender, location, lat, lng, role, budget_min, budget_max, move_in_date, age_min, age_max, lifestyle_tags')
      .eq('id', user.id)
      .single();
    if (profile) {
      setEditProfileData({ ...profile, latitude: profile.lat, longitude: profile.lng });
      setShowEditProfile(true);
    }
  }

  const effectiveStatus = localStatus;

  async function handleClick() {
    setConnecting(true);
    try {
      if (incomingRequestId && effectiveStatus !== 'accepted') {
        // Accept the incoming request
        const result = await respondToMatchRequest(incomingRequestId, 'accepted');
        if (result.error) { alert('Could not accept: ' + result.error); return; }
        setMatchedUser({ full_name: targetUserName, avatar_url: targetAvatarUrl });
        setLocalStatus('accepted');
      } else if (!effectiveStatus) {
        const result = await sendMatchRequest(targetUserId);
        if (result.error) { alert('Could not send request: ' + result.error); return; }
        setLocalStatus('pending');
      }
    } finally {
      setConnecting(false);
    }
  }

  const isAccepted = effectiveStatus === 'accepted';
  const isPending  = effectiveStatus === 'pending' && !incomingRequestId;
  const isIncoming = !!incomingRequestId && !isAccepted;

  return (
    <>
      {isOwnProfile ? (
        <button
          onClick={handleEditProfile}
          className="w-full py-4 rounded-full text-base font-bold transition-all shadow-xl bg-primary text-dark hover:brightness-105 shadow-primary/20"
        >
          Edit Profile
        </button>
      ) : (
        <button
          onClick={handleClick}
          disabled={connecting || isPending || isAccepted}
          className={`w-full py-4 rounded-full text-base font-bold transition-all shadow-xl disabled:opacity-70 disabled:cursor-not-allowed ${
            isAccepted
              ? 'bg-emerald-100 text-emerald-700 shadow-emerald-100'
              : isIncoming
              ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200'
              : isPending
              ? 'bg-amber-100 text-amber-700 shadow-amber-100'
              : 'bg-primary text-dark hover:brightness-105 shadow-primary/20'
          }`}
        >
          {connecting
            ? isIncoming ? 'Accepting…' : 'Sending…'
            : isAccepted
            ? 'Matched'
            : isIncoming
            ? 'Accept Request'
            : isPending
            ? 'Request Sent'
            : 'Send Match Request'}
        </button>
      )}

      {matchedUser && (
        <MatchConfirmedModal
          matchedUser={matchedUser}
          onClose={() => setMatchedUser(null)}
        />
      )}

      {showEditProfile && (
        <OnboardingForm
          initialData={editProfileData}
          isModal
          onClose={() => {
            setShowEditProfile(false);
            setEditProfileData(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
};
