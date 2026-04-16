'use client';

import React, { useState, useEffect } from 'react';
import { X, Star, Send, Check } from 'lucide-react';
import { getReviewCriteria, submitReview, getExistingReview, ReviewCriterion } from '../../../app/reviews/actions';

interface ReviewModalProps {
  targetUserId: string;
  targetName: string | null;
  targetAvatarUrl: string | null;
  requestId?: string;
  onSubmitted?: (requestId: string) => void;
  onClose: () => void;
}

const VERIFICATION_ITEMS = [
  { label: "Paid bills on time", mapping: "Paid bills on time", category: "Financial Clarity" },
  { label: "Cleaned kitchen after use", mapping: "Cleaned kitchen after use", category: "Shared Space Chores" },
  { label: "Handled trash on schedule", mapping: "Handled trash on schedule", category: "Shared Space Chores" },
  { label: "Respected house rules", mapping: "Respected house rules", category: "Rule Adherence" }
];

export function ReviewModal({ targetUserId, targetName, targetAvatarUrl, requestId, onSubmitted, onClose }: ReviewModalProps) {
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [starRating, setStarRating] = useState<number>(0);
  const [selectedVerifications, setSelectedVerifications] = useState<string[]>([]);
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
          setStarRating(existingReview.average_score);
          setComment(existingReview.overall_comment);

          const verifs: string[] = [];
          VERIFICATION_ITEMS.forEach(item => {
            const critId = criteriaData.find(c => c.label === item.mapping)?.id;
            if (critId && existingReview.scores[critId] === 5) {
              verifs.push(item.mapping);
            }
          });
          setSelectedVerifications(verifs);
        }
      } catch (err) {
        console.error('Error loading review data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [targetUserId]);

  const toggleVerification = (mapping: string) => {
    setSelectedVerifications(prev => 
      prev.includes(mapping) 
        ? prev.filter(m => m !== mapping)
        : [...prev, mapping]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (starRating === 0) {
      alert('Please provide an overall rating.');
      return;
    }

    setSubmitting(true);
    
    const scoreArray: { criteriaId: string; score: number }[] = [];
    
    VERIFICATION_ITEMS.forEach(item => {
      const crit = criteria.find(c => c.label === item.mapping);
      if (crit) {
        scoreArray.push({ 
          criteriaId: crit.id, 
          score: selectedVerifications.includes(item.mapping) ? 5 : 1 
        });
      }
    });

    const result = await submitReview(targetUserId, comment, scoreArray, starRating);
    
    if (result.success) {
      console.log('submitReview result:', result);
      setSuccess(true);
      // show the saved review id in console for debugging
      if (result.reviewId) console.log('Review saved with id:', result.reviewId);
      // If this modal was opened in response to a review request, notify the parent so it can remove that request from the sidebar
      if (requestId && onSubmitted) {
        try {
          onSubmitted(requestId);
        } catch (e) {
          console.warn('onSubmitted callback failed', e);
        }
      }
      setTimeout(onClose, 2000);
    } else {
      alert(result.error || 'Failed to submit review.');
      setSubmitting(false);
    }
  }

  const categories = Array.from(new Set(VERIFICATION_ITEMS.map(i => i.category)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-4">
          <div className="flex items-center gap-4">
            <img src={avatarSrc} alt={displayName} className="size-12 rounded-full object-cover border-2 border-primary/20" />
            <div>
              <h2 className="text-xl font-black text-dark leading-none mb-1">Review Living Experience</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reviewing {displayName}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 pt-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
                <Check size={40} className="text-primary" />
              </div>
              <p className="font-black text-dark text-2xl">Review Saved!</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Star Rating */}
              <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Overall Experience (Mandatory)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setStarRating(star)} className="transition-all hover:scale-110">
                      <Star size={32} className={`${starRating >= star ? 'text-primary fill-primary' : 'text-slate-200 fill-slate-200'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification Checkboxes */}
              <div className="space-y-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Objective Review Items (Optional)</p>
                {categories.map(cat => (
                  <div key={cat} className="space-y-3">
                    <h4 className="text-[11px] font-black text-dark uppercase tracking-wider pl-1">{cat}</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {VERIFICATION_ITEMS.filter(i => i.category === cat).map(item => (
                        <button
                          key={item.mapping}
                          type="button"
                          onClick={() => toggleVerification(item.mapping)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                            selectedVerifications.includes(item.mapping)
                              ? 'bg-primary/5 border-primary text-dark'
                              : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                          }`}
                        >
                          <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            selectedVerifications.includes(item.mapping) ? 'bg-primary border-primary' : 'border-slate-200'
                          }`}>
                            {selectedVerifications.includes(item.mapping) && <Check size={12} className="text-dark stroke-[4]" />}
                          </div>
                          <span className="text-sm font-bold">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Comments */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Feedback (Optional)</p>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Anything else you'd like to share?"
                  rows={3}
                  className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-primary/20 text-sm font-medium transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 rounded-2xl bg-dark text-white font-black text-base shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Submit Review</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
