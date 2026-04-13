'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Send } from 'lucide-react';
import { getReviewCriteria, submitReview, getExistingReview, ReviewCriterion } from '../../../app/reviews/actions';

interface ReviewModalProps {
  targetUserId: string;
  targetName: string | null;
  targetAvatarUrl: string | null;
  onClose: () => void;
}

export function ReviewModal({ targetUserId, targetName, targetAvatarUrl, onClose }: ReviewModalProps) {
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const displayName = targetName || 'this user';
  const avatarSrc =
    targetAvatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=00f0d1&color=111&size=128`;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [criteriaData, existingReview] = await Promise.all([
          getReviewCriteria(),
          getExistingReview(targetUserId)
        ]);
        
        setCriteria(criteriaData);
        if (existingReview) {
          setScores(existingReview.scores);
          setComment(existingReview.overall_comment);
        }
      } catch (err) {
        console.error('Error loading review data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetUserId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(scores).length < criteria.length) {
      alert('Please rate all criteria before submitting.');
      return;
    }
    setSubmitting(true);
    const scoreArray = Object.entries(scores).map(([id, score]) => ({ criteriaId: id, score }));
    const result = await submitReview(targetUserId, comment, scoreArray);
    if (result.success) {
      setSuccess(true);
      setTimeout(onClose, 2000);
    } else {
      alert(result.error || 'Failed to submit review.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              alt={displayName}
              className="size-10 rounded-full object-cover border-2 border-primary"
            />
            <div>
              <p className="text-xs text-slate-400 font-medium">Writing a review for</p>
              <p className="font-bold text-dark">{displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="size-14 rounded-full bg-emerald-100 flex items-center justify-center">
                <Star size={28} className="text-emerald-500 fill-emerald-500" />
              </div>
              <p className="font-bold text-dark text-lg">Review submitted!</p>
              <p className="text-slate-500 text-sm text-center">Thank you for helping build a trusted community.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Criteria ratings */}
              <div className="space-y-5">
                {criteria.map(criterion => (
                  <div key={criterion.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-dark">{criterion.label}</p>
                      {criterion.description && (
                        <p className="text-[11px] text-slate-400">{criterion.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setScores(prev => ({ ...prev, [criterion.id]: star }))}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${
                              (scores[criterion.id] ?? 0) >= star
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200 fill-slate-200 hover:text-amber-300 hover:fill-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                      {scores[criterion.id] && (
                        <span className="ml-2 text-xs text-slate-400 self-center font-semibold">
                          {scores[criterion.id]}/5
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comment */}
              <div>
                <label className="text-sm font-bold text-dark mb-2 block">Overall Comment</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Share your experience living with this person..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-2xl bg-primary text-dark font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <div className="size-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={15} />
                    Submit Review
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
