'use client';

import React, { useState } from 'react';
import { respondToMatchRequest } from '../../../app/messages/actions';
import { sendMatchRequest } from '../../../app/discovery/actions';
import { MatchConfirmedModal } from '@/components/ui/MatchConfirmedModal';

interface ProfileConnectButtonProps {
  targetUserId: string;
  targetUserName: string | null;
  targetAvatarUrl: string | null;
  /** Request ID if this person has already sent me a pending request */
  incomingRequestId?: string | null;
  /** My existing outgoing request status for this person */
  existingRequestStatus?: string | null;
}

export const ProfileConnectButton: React.FC<ProfileConnectButtonProps> = ({
  targetUserId,
  targetUserName,
  targetAvatarUrl,
  incomingRequestId,
  existingRequestStatus,
}) => {
  const [connecting, setConnecting] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(existingRequestStatus ?? null);
  const [matchedUser, setMatchedUser] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

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

      {matchedUser && (
        <MatchConfirmedModal
          matchedUser={matchedUser}
          onClose={() => setMatchedUser(null)}
        />
      )}
    </>
  );
};
