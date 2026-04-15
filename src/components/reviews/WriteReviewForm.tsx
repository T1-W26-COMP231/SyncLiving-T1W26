'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ReviewCriterion, UserToReview, submitReview, ExistingReview } from '../../../app/reviews/actions';
import { useRouter } from 'next/navigation';
import { Star, Send, Check, X } from 'lucide-react';

interface WriteReviewFormProps {
  targetUser: UserToReview;
  criteria: ReviewCriterion[];
  initialData?: ExistingReview | null;
  onSuccess?: () => void;
}

const VERIFICATION_ITEMS = [
  { label: "Paid bills on time", mapping: "Paid bills on time", category: "Financial Clarity" },
  { label: "Cleaned kitchen after use", mapping: "Cleaned kitchen after use", category: "Shared Space Chores" },
  { label: "Handled trash on schedule", mapping: "Handled trash on schedule", category: "Shared Space Chores" },
  { label: "Respected house rules", mapping: "Respected house rules", category: "Rule Adherence" }
];

export default function WriteReviewForm({ targetUser, criteria, initialData, onSuccess }: WriteReviewFormProps) {
  const [starRating, setStarRating] = useState<number>(initialData?.average_score || 0);
  const [selectedVerifications, setSelectedVerifications] = useState<string[]>([]);
  const [overallComment, setOverallComment] = useState(initialData?.overall_comment || '');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setStarRating(initialData?.average_score || 0);
    setOverallComment(initialData?.overall_comment || '');
    
    if (initialData) {
      const verifs: string[] = [];
      VERIFICATION_ITEMS.forEach(item => {
        const critId = criteria.find(c => c.label === item.mapping)?.id;
        if (critId) {
          const val = initialData.scores[critId];
          if (val !== undefined && val !== null) {
            if (typeof val === 'number' && Number(val) === 5) verifs.push(item.mapping);
            else if (typeof val === 'boolean' && val === true) verifs.push(item.mapping);
            else if (typeof val === 'string' && (val.toLowerCase() === 'true' || val === '5' || val.toLowerCase() === 'yes')) verifs.push(item.mapping);
            else if (Array.isArray(val) && val.length > 0) verifs.push(item.mapping);
          }
        }
      });
      setSelectedVerifications(verifs);
    } else {
      setSelectedVerifications([]);
    }
  }, [initialData, targetUser.id, criteria]);

  const toggleVerification = (mapping: string) => {
    setSelectedVerifications(prev => 
      prev.includes(mapping) 
        ? prev.filter(m => m !== mapping)
        : [...prev, mapping]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    const result = await submitReview(targetUser.id, overallComment, scoreArray, starRating);
    
    if (result.success) {
      alert('Review saved successfully!');
      if (onSuccess) onSuccess();
      router.refresh();
    } else {
      alert('Error saving review: ' + result.error);
    }
    setSubmitting(false);
  };

  const categories = Array.from(new Set(VERIFICATION_ITEMS.map(i => i.category)));

  return (
    <div className="flex flex-col gap-8 w-full max-w-[800px] p-6 lg:p-10 overflow-y-auto max-h-screen">
      
      <div className="flex flex-col gap-2 text-center items-center">
        <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black leading-tight">
          Verify {targetUser.full_name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">Objective Roommate Review</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* Star Rating */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-[32px] shadow-sm flex flex-col items-center gap-6">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">How was your overall living experience?</p>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setStarRating(star)}
                className="transition-all hover:scale-125 active:scale-95"
              >
                <Star
                  size={48}
                  className={`transition-all duration-300 ${
                    starRating >= star
                      ? 'text-primary fill-primary'
                      : 'text-slate-200 fill-slate-200 dark:text-slate-800 dark:fill-slate-800 hover:text-primary/30'
                  }`}
                />
              </button>
            ))}
          </div>
          {starRating > 0 && (
             <p className="text-xs font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-wider">
              {starRating === 5 ? 'Excellent' : starRating === 4 ? 'Great' : starRating === 3 ? 'Good' : starRating === 2 ? 'Fair' : 'Poor'}
            </p>
          )}
        </div>

        {/* Verifications */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm flex flex-col gap-8">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-xs font-black text-dark dark:text-slate-300 uppercase tracking-widest">Living Behavior Checklist</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">Optional</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {categories.map(cat => (
              <div key={cat} className="space-y-4">
                <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">{cat}</h4>
                <div className="flex flex-col gap-2">
                  {VERIFICATION_ITEMS.filter(i => i.category === cat).map(item => (
                    <button
                      key={item.mapping}
                      type="button"
                      onClick={() => toggleVerification(item.mapping)}
                      className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                        selectedVerifications.includes(item.mapping)
                          ? 'bg-primary/5 border-primary text-dark dark:text-slate-100 shadow-sm'
                          : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-sm font-bold">{item.label}</span>
                      <div className={`size-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        selectedVerifications.includes(item.mapping) ? 'bg-primary border-primary' : 'border-slate-200 dark:border-slate-700'
                      }`}>
                        {selectedVerifications.includes(item.mapping) && <Check size={14} className="text-dark stroke-[4]" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Comment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[32px] shadow-sm flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <label className="text-xs font-black text-dark dark:text-slate-300 uppercase tracking-widest">Additional Context</label>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Optional</span>
          </div>
          <textarea 
            className="w-full rounded-[24px] border-2 border-transparent bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-primary/20 p-6 text-sm font-medium resize-none transition-all placeholder:text-slate-300" 
            placeholder={`Tell others more about what it was like living with ${targetUser.full_name}...`}
            rows={4}
            value={overallComment}
            onChange={(e) => setOverallComment(e.target.value)}
          />
        </div>

        {/* Action Button */}
        <button 
          type="submit" 
          disabled={submitting}
          className="w-full py-6 rounded-[24px] bg-dark dark:bg-primary text-white dark:text-dark font-black text-lg shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {submitting ? (
            <div className="size-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={20} />
              {initialData ? 'Update Review' : 'Submit Review'}
            </>
          )}
        </button>
      </form>

      <div className="pb-10" />
    </div>
  );
}
