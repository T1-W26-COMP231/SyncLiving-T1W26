'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, MapPin, Archive, Users, Star, Send, CheckCircle, XCircle, MessageSquare, Heart } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { MatchedUser, ReviewRequest, sendReviewRequest, respondToReviewRequest } from '../../../app/matches/actions';
import { deleteReview } from '../../../app/reviews/actions';
import { ReportUserModal } from './ReportUserModal';
import { ReviewModal } from './ReviewModal';

interface MatchesPageProps {
  activeMatches: MatchedUser[];
  archivedMatches: MatchedUser[];
  incomingReviewRequests: ReviewRequest[];
}

export default function MatchesPage({ activeMatches, archivedMatches, incomingReviewRequests }: MatchesPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [reportTarget, setReportTarget] = useState<{ userId: string; name: string | null } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ userId: string; name: string | null; avatarUrl: string | null } | null>(null);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>(incomingReviewRequests);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const displayed = tab === 'active' ? activeMatches : archivedMatches;

  async function handleSendReviewRequest(userId: string) {
    setSendingRequest(userId);
    const result = await sendReviewRequest(userId);
    if (result.success) {
      setSentRequests(prev => new Set(prev).add(userId));
    }
    setSendingRequest(null);
  }

  async function handleRespondToReviewRequest(requestId: string, status: 'accepted' | 'declined') {
    setRespondingId(requestId);
    const result = await respondToReviewRequest(requestId, status);
    if (result.success) {
      setReviewRequests(prev => prev.filter(r => r.id !== requestId));
    }
    setRespondingId(null);
  }

  async function handleDeleteReview(userId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    setDeletingId(userId);
    const result = await deleteReview(userId);
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Failed to delete review');
    }
    setDeletingId(null);
  }

  return (
    <div className="min-h-screen bg-[#f6f8f8]">
      <Navbar activeTab="Matches" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-dark tracking-tight mb-1">Review My Matches</h1>
          <p className="text-slate-500 font-medium">
            Rate your experience with your matched roommates and build community trust.
          </p>
        </div>

        {/* Two-column layout: cards left, review requests right */}
        <div className="flex gap-8 items-start">

          {/* Left: Matches */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Tabs — dashboard-style pill */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-full w-fit">
              {(['active', 'archived'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                    tab === t ? 'bg-white text-dark shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'active' ? <Users size={15} /> : <Archive size={15} />}
                  {t === 'active' ? 'Active Matches' : 'Archived'}
                  {t === 'active' && activeMatches.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-primary/10 text-primary">
                      {activeMatches.length}
                    </span>
                  )}
                  {t === 'archived' && archivedMatches.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-extrabold bg-slate-200 text-slate-500">
                      {archivedMatches.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Empty state */}
            {displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  {tab === 'active' ? <Users size={28} className="text-slate-400" /> : <Archive size={28} className="text-slate-400" />}
                </div>
                <p className="text-lg font-bold text-slate-500 mb-1">
                  {tab === 'active' ? 'No matches yet' : 'No archived matches'}
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  {tab === 'active'
                    ? 'Head to Discovery to connect with potential roommates.'
                    : 'Declined requests will appear here.'}
                </p>
                {tab === 'active' && (
                  <button
                    onClick={() => router.push('/discovery')}
                    className="px-6 py-2.5 rounded-full bg-primary text-dark font-bold text-sm hover:brightness-105 transition-all"
                  >
                    Browse Discovery
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayed.map(match => (
                  <MatchCard
                    key={match.requestId}
                    match={match}
                    isArchived={tab === 'archived'}
                    isSentRequest={sentRequests.has(match.userId)}
                    isSendingRequest={sendingRequest === match.userId}
                    isDeleting={deletingId === match.userId}
                    onReport={() => setReportTarget({ userId: match.userId, name: match.full_name })}
                    onReview={() => setReviewTarget({ userId: match.userId, name: match.full_name, avatarUrl: match.avatar_url })}
                    onReviewRequest={() => handleSendReviewRequest(match.userId)}
                    onDeleteReview={() => handleDeleteReview(match.userId)}
                    onCardClick={() => router.push(`/profile/${match.userId}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Review Requests sidebar */}
          <aside className="w-80 shrink-0 sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-dark flex items-center gap-2">
                <MessageSquare size={17} className="text-primary" />
                Review Requests
              </h2>
              {reviewRequests.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                  {reviewRequests.length}
                </span>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {reviewRequests.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center text-center p-8 gap-4">
                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-dark text-sm mb-1">No pending requests</p>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                      Reviewing your matches helps build a trusted community. Send a review request to a match and encourage honest feedback.
                    </p>
                  </div>
                  <div className="w-full pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Your reviews are confidential and used only to improve matching quality and community safety.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviewRequests.map(req => {
                    const avatar =
                      req.requesterAvatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName || 'U')}&background=00f0d1&color=111&size=64`;
                    const timeAgo = new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <div key={req.id} className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={avatar} alt={req.requesterName || 'User'} className="size-9 rounded-full object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-dark text-sm truncate">{req.requesterName || 'Anonymous'}</p>
                            <p className="text-[11px] text-slate-400">Requested a review · {timeAgo}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={respondingId === req.id}
                            onClick={() => handleRespondToReviewRequest(req.id, 'accepted')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-primary text-dark text-xs font-bold hover:brightness-105 transition-all disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            Accept
                          </button>
                          <button
                            disabled={respondingId === req.id}
                            onClick={() => handleRespondToReviewRequest(req.id, 'declined')}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {reportTarget && (
        <ReportUserModal
          reportedUserId={reportTarget.userId}
          reportedUserName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          targetUserId={reviewTarget.userId}
          targetName={reviewTarget.name}
          targetAvatarUrl={reviewTarget.avatarUrl}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
interface MatchCardProps {
  match: MatchedUser;
  isArchived: boolean;
  isSentRequest: boolean;
  isSendingRequest: boolean;
  isDeleting: boolean;
  onReport: () => void;
  onReview: () => void;
  onReviewRequest: () => void;
  onDeleteReview: () => void;
  onCardClick: () => void;
}

function MatchCard({ match, isArchived, isSentRequest, isSendingRequest, isDeleting, onReport, onReview, onReviewRequest, onDeleteReview, onCardClick }: MatchCardProps) {
  const avatarSrc =
    match.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(match.full_name || 'U')}&background=00f0d1&color=111&size=256`;

  return (
    <article
      onClick={onCardClick}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 cursor-pointer"
    >
      {/* Report icon — top-right */}
      <button
        onClick={e => { e.stopPropagation(); onReport(); }}
        title="Report this user"
        className="absolute top-3 right-3 z-10 size-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all shadow-sm"
      >
        <AlertTriangle size={15} />
      </button>

      {/* Archived badge */}
      {isArchived && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-slate-700/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
          <Archive size={10} />
          Archived
        </div>
      )}

      {/* Avatar */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={avatarSrc}
          alt={match.full_name || 'User'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-dark text-base leading-tight truncate">
            {match.full_name || 'Anonymous'}
          </h3>
          {match.role && (
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {match.role}
            </span>
          )}
        </div>

        {match.location && (
          <p className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mb-3">
            <MapPin size={11} />
            {match.location}
          </p>
        )}

        {/* Action buttons */}
        {!isArchived ? (
          <div className="flex flex-col gap-2 mt-3" onClick={e => e.stopPropagation()}>
            <button
              onClick={onReview}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-dark text-xs font-bold hover:brightness-105 transition-all"
            >
              <Star size={13} />
              Review
            </button>
            <button
              onClick={onReviewRequest}
              disabled={isSentRequest || isSendingRequest}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {isSendingRequest ? (
                <div className="size-3 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
              ) : isSentRequest ? (
                <>
                  <CheckCircle size={13} className="text-emerald-500" />
                  <span className="text-emerald-600">Sent</span>
                </>
              ) : (
                <>
                  <Send size={13} />
                  Review Request
                </>
              )}
            </button>
            <button
              onClick={onDeleteReview}
              disabled={!match.hasReviewed || isDeleting}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <div className="size-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              ) : (
                <>
                  <XCircle size={13} />
                  Delete Review
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); onCardClick(); }}
            className="w-full mt-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            View Profile
          </button>
        )}
      </div>
    </article>
  );
}
