'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Handshake } from 'lucide-react';
import { getPendingRequests, respondToMatchRequest, PendingRequest } from '../../../app/messages/actions';
import { MatchConfirmedModal } from '@/components/ui/MatchConfirmedModal';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface AcceptedNotification {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_object_type: string | null;
  related_object_id: string | null;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [acceptedNotifications, setAcceptedNotifications] = useState<AcceptedNotification[]>([]);
  const [systemNotifications, setSystemNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [matchedUser, setMatchedUser] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const pending = await getPendingRequests();
    setPendingRequests(pending);
  }

  async function refreshSystemNotifications() {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_notifications')
      .select('id, type, title, message, related_object_type, related_object_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    setSystemNotifications((data ?? []) as UserNotification[]);
  }

  useEffect(() => {
    Promise.all([refresh(), refreshSystemNotifications()]).finally(() => setLoading(false));
  }, []);

  // Real-time: incoming new requests + accepted sent requests
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel = supabase
        .channel('match-requests-realtime')
        // New incoming request sent TO me — refresh badge
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'match_requests',
            filter: `receiver_id=eq.${user.id}`,
          },
          () => {
            refresh();
          }
        )
        // Someone accepted MY sent request — add a notification item
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'match_requests',
            filter: `sender_id=eq.${user.id}`,
          },
          async (payload) => {
            const updated = payload.new as { id: string; status: string; receiver_id: string };
            if (updated.status !== 'accepted') return;

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', updated.receiver_id)
              .single();

            setAcceptedNotifications(prev => [
              { id: updated.id, full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null },
              ...prev,
            ]);
          }
        )
        // New moderation or system notification for me.
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const inserted = payload.new as UserNotification;
            setSystemNotifications(prev => [inserted, ...prev].slice(0, 20));
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleAccept(req: PendingRequest) {
    setRespondingId(req.id);
    try {
      const result = await respondToMatchRequest(req.id, 'accepted');
      if (result.error) {
        alert('Could not accept request: ' + result.error);
        return;
      }
      setMatchedUser(req.sender);
      setOpen(false);
      await refresh();
    } finally {
      setRespondingId(null);
    }
  }

  async function handleDecline(req: PendingRequest) {
    setRespondingId(req.id);
    try {
      await respondToMatchRequest(req.id, 'declined');
      await refresh();
    } finally {
      setRespondingId(null);
    }
  }

  function dismissAccepted(id: string) {
    setAcceptedNotifications(prev => prev.filter(n => n.id !== id));
  }

  function dismissSystemNotification(id: string) {
    setSystemNotifications(prev => prev.filter(n => n.id !== id));
  }

  const totalCount = pendingRequests.length + acceptedNotifications.length + systemNotifications.length;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(prev => !prev)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
        >
          <Bell size={20} />
          {totalCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notifications</p>
            </div>

            {loading ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400 animate-pulse">Loading…</div>
            ) : totalCount === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">No notifications</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">

                {/* Match accepted notifications */}
                {acceptedNotifications.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                      New Matches
                    </p>
                    <div className="flex flex-col gap-2">
                      {acceptedNotifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => { dismissAccepted(notif.id); setOpen(false); router.push('/messages'); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-left"
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                notif.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(notif.full_name || 'U')}&background=00f0d1&color=111`
                              }
                              alt={notif.full_name || 'User'}
                              className="size-9 rounded-full object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                              <Handshake size={10} className="text-dark" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {notif.full_name}
                            </p>
                            <p className="text-[11px] text-primary font-medium">accepted your request!</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin/system notifications */}
                {systemNotifications.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">
                      Updates
                    </p>
                    <div className="flex flex-col gap-2">
                      {systemNotifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => {
                            dismissSystemNotification(notif.id);
                            setOpen(false);
                            if (notif.related_object_type === 'user_report' && notif.related_object_id) {
                              router.push('/support');
                              return;
                            }
                            router.push('/messages');
                          }}
                          className="w-full p-3 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors text-left"
                        >
                          <p className="text-xs font-bold text-slate-800 truncate">{notif.title}</p>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Incoming connection requests */}
                {pendingRequests.length > 0 && (
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">
                      Connection Requests
                    </p>
                    <div className="flex flex-col gap-2">
                      {pendingRequests.map(req => (
                        <div
                          key={req.id}
                          className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                req.sender.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(req.sender.full_name || 'U')}`
                              }
                              alt={req.sender.full_name || 'User'}
                              className="size-9 rounded-full object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">
                                {req.sender.full_name}
                              </p>
                              <p className="text-[11px] text-slate-500">wants to connect with you</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(req)}
                              disabled={respondingId === req.id}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700 transition-colors disabled:opacity-60"
                            >
                              <Check size={12} />
                              Accept
                            </button>
                            <button
                              onClick={() => handleDecline(req)}
                              disabled={respondingId === req.id}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-300 transition-colors disabled:opacity-60"
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

              </div>
            )}
          </div>
        )}
      </div>

      {/* Only shown when YOU accept someone else's request */}
      {matchedUser && (
        <MatchConfirmedModal
          matchedUser={matchedUser}
          onClose={() => setMatchedUser(null)}
        />
      )}
    </>
  );
};
