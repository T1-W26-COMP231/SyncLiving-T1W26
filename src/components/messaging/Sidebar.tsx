'use client';

import React from 'react';
import { Match, PendingRequest } from '../../../app/messages/actions';
import { MessageSquare, Gavel, History, Check, X } from 'lucide-react';

interface SidebarProps {
  matches: Match[];
  pendingRequests?: PendingRequest[];
  selectedMatchId: string | null;
  onSelectMatch: (id: string) => void;
  onAcceptRequest?: (id: string) => void;
  onDeclineRequest?: (id: string) => void;
  loading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  matches, 
  pendingRequests = [],
  selectedMatchId, 
  onSelectMatch, 
  onAcceptRequest,
  onDeclineRequest,
  loading 
}) => {
  return (
    <aside className="w-64 border-r border-primary/10 bg-white dark:bg-slate-900 flex-col hidden lg:flex overflow-y-auto">
      <div className="p-4 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Workspace</div>
        <nav className="flex flex-col gap-1">
          <a className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/10 text-primary font-semibold" href="#">
            <MessageSquare size={18} />
            <span>Chat & Activity</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400" href="#">
            <Gavel size={18} />
            <span>Active Rules</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400" href="#">
            <History size={18} />
            <span>Change Log</span>
          </a>
        </nav>

        {pendingRequests.length > 0 && (
          <div className="mt-6 flex flex-col gap-2">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest px-3 py-2">Pending Requests</div>
            <div className="flex flex-col gap-2">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                  <div className="flex items-center gap-3">
                    <img
                      alt={req.sender.full_name || 'User'}
                      className="size-8 rounded-full object-cover"
                      src={req.sender.avatar_url || `https://ui-avatars.com/api/?name=${req.sender.full_name || 'U'}`}
                    />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {req.sender.full_name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAcceptRequest?.(req.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-700 transition-colors"
                    >
                      <Check size={12} />
                      Accept
                    </button>
                    <button
                      onClick={() => onDeclineRequest?.(req.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <X size={12} />
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Matches</div>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="px-3 py-4 text-xs text-slate-400 animate-pulse">Loading matches...</div>
            ) : matches.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400">No matches found.</div>
            ) : (
              matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => onSelectMatch(match.id)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group text-left ${
                    match.id === selectedMatchId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      alt={match.other_user.full_name || 'User'}
                      className={`size-10 rounded-full object-cover ${match.id === selectedMatchId ? 'border-2 border-primary' : ''}`}
                      src={match.other_user.avatar_url || `https://ui-avatars.com/api/?name=${match.other_user.full_name || 'U'}`}
                    />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className={`text-sm font-bold truncate ${match.id === selectedMatchId ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                      {match.other_user.full_name}
                    </span>
                    <span className={`text-[10px] truncate ${match.id === selectedMatchId ? 'text-primary font-medium' : 'text-slate-400'}`}>
                      {match.last_message || 'Start messaging'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-4 border-t border-primary/10">
        <div className="bg-primary/5 rounded-xl p-4">
          <p className="text-xs font-bold text-primary mb-2">AGREEMENT PROGRESS</p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-2">
            <div className="bg-primary h-2 rounded-full w-2/3" style={{ width: '66.6%' }}></div>
          </div>
          <p className="text-[10px] text-slate-500">6 of 9 rules accepted</p>
        </div>
      </div>
    </aside>
  );
};
