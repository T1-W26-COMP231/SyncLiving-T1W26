'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ReviewCriterion, UserToReview, submitReview, ExistingReview } from '../../../app/reviews/actions';
import { useRouter } from 'next/navigation';

interface WriteReviewFormProps {
  targetUser: UserToReview;
  criteria: ReviewCriterion[];
  initialData?: ExistingReview | null;
  onSuccess?: () => void;
}

export default function WriteReviewForm({ targetUser, criteria, initialData, onSuccess }: WriteReviewFormProps) {
  const [scores, setScores] = useState<Record<string, number>>(initialData?.scores || {});
  const [overallComment, setOverallComment] = useState(initialData?.overall_comment || '');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Update form when initialData changes (new user selected)
  useEffect(() => {
    setScores(initialData?.scores || {});
    setOverallComment(initialData?.overall_comment || '');
  }, [initialData, targetUser.id]);

  const handleScoreChange = (criteriaId: string, score: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: score }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all criteria are scored
    if (Object.keys(scores).length < criteria.length) {
      alert('Please score all items before submitting.');
      return;
    }

    setSubmitting(true);
    const scoreArray = Object.entries(scores).map(([id, score]) => ({
      criteriaId: id,
      score
    }));

    const result = await submitReview(targetUser.id, overallComment, scoreArray);
    
    if (result.success) {
      alert('Review saved successfully!');
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      alert('Error saving review: ' + result.error);
    }
    setSubmitting(false);
  };

  const categories = Array.from(new Set(criteria.map(c => c.category)));

  return (
    <div className="flex flex-col gap-8 w-full max-w-[800px] p-6 lg:p-10 overflow-y-auto max-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold leading-tight">
            Review for {targetUser.full_name}
          </h1>
          {initialData?.status === 'reported' && (
            <span className="px-3 py-1 text-xs font-bold text-red-700 bg-red-100 border border-red-200 rounded-full">
              Reported
            </span>
          )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-base">
          {initialData ? 'You have already reviewed this roommate. You can update your feedback here.' : 'Be honest and objective. Your feedback helps the SyncLiving community.'}
        </p>
      </div>

      {/* Target User Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <img
            alt={targetUser.full_name}
            className="size-20 rounded-full object-cover border-4 border-primary/20"
            src={targetUser.avatar_url || `https://ui-avatars.com/api/?name=${targetUser.full_name}`}
          />
          <div className="flex flex-col">
            <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold">{targetUser.full_name}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Verified Connection</p>
          </div>
        </div>
        
        {targetUser.average_score && targetUser.average_score > 0 ? (
          <div className="flex flex-col items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 rounded-2xl border border-amber-100 dark:border-amber-900/30">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-black text-2xl">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              {targetUser.average_score.toFixed(1)}
            </div>
            <span className="text-[10px] text-amber-500 dark:text-amber-500 font-bold uppercase tracking-widest">Your Previous Rating</span>
          </div>
        ) : null}
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {categories.map((category) => (
          <div key={category} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col gap-6">
            <h3 className="text-primary font-bold uppercase tracking-wider text-sm border-b border-primary/10 pb-2">
              {category}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {criteria.filter(c => c.category === category).map((item) => (
                <div key={item.id} className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <label className="text-slate-700 dark:text-slate-200 font-bold text-sm">
                      {item.label}
                    </label>
                    <span className="text-primary font-bold text-sm">
                      {scores[item.id] || 0}/5
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleScoreChange(item.id, star)}
                        className={`transition-colors ${
                          (scores[item.id] || 0) >= star ? 'text-primary' : 'text-slate-200 dark:text-slate-700 hover:text-primary/50'
                        }`}
                      >
                        <span 
                          className="material-symbols-outlined text-2xl" 
                          style={{ fontVariationSettings: `'FILL' ${(scores[item.id] || 0) >= star ? 1 : 0}` }}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Overall Comment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-sm flex flex-col gap-4">
          <label className="text-slate-900 dark:text-slate-100 font-bold text-lg">Overall Comments</label>
          <textarea 
            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary p-4 text-sm" 
            placeholder={`Tell others about your experience living with ${targetUser.full_name}...`}
            rows={4}
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
          />
        </div>

        {/* Action Button */}
        <Button 
          type="submit" 
          disabled={submitting}
          className="w-full py-4 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
        >
          {submitting ? 'Saving Changes...' : (initialData ? 'Update Review' : 'Complete Review')}
        </Button>
      </form>

      <div className="pb-10" />
    </div>
  );
}
