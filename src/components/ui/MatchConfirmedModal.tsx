'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Handshake, X } from 'lucide-react';

interface MatchedUser {
  full_name: string | null;
  avatar_url: string | null;
}

interface MatchConfirmedModalProps {
  matchedUser: MatchedUser;
  onClose: () => void;
}

export const MatchConfirmedModal: React.FC<MatchConfirmedModalProps> = ({ matchedUser, onClose }) => {
  const router = useRouter();
  const name = matchedUser.full_name || 'your new match';
  const avatarSrc =
    matchedUser.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00f0d1&color=111`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 flex flex-col items-center text-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Avatar */}
        <div className="relative mb-6">
          <div className="size-24 rounded-full overflow-hidden border-4 border-primary shadow-lg shadow-primary/30">
            <img src={avatarSrc} alt={name} className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-2 shadow-md">
            <Handshake size={18} className="text-dark" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-dark mb-1">Match Confirmed!</h2>
        <p className="text-lg font-bold text-primary mb-3">You and {name} are a match!</p>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          SyncLiving has confirmed a great roommate compatibility. Messaging is now
          enabled — start chatting to discuss living arrangements.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => { onClose(); router.push('/messages'); }}
            className="w-full py-3 rounded-full bg-primary text-dark font-bold text-sm hover:brightness-105 transition-all shadow-lg shadow-primary/20"
          >
            Start Messaging {matchedUser.full_name || 'them'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Keep Browsing Matches
          </button>
        </div>
      </div>
    </div>
  );
};
