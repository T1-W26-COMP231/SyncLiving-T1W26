'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ReviewTarget, HighlightTag } from './types';

export const MOCK_REVIEW_TARGET: ReviewTarget = {
  id: 'user_123',
  name: 'Alex Johnson',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTxODj-YIjr-mN8PBjuRjpMMi8gvg0K5ifbNoiJAK85Xs9MswY7478O8Xiv2zeoXlh5FMtORXCqt14pWd7i-FQlQxHCtrs7oOzPnelf6Zylo8FrSffhCZZtAtyZMxuYJQ4HMJ1_erQ_VoZ_iaFVuz31dLHLowSiJqkDzzxqSGNJW3jUERwbUhdwSVUtj01CXiBWxmbSRBPi5p5wETIlGV--DGG6xN-oHYzvSfQAnNNnXOqfrcI9lHegW36IDaXGaMLvTIkg88J6ZI',
  matchedTime: '3 months ago',
  location: 'New York, NY',
  isVerified: true,
};

const HIGHLIGHT_TAGS: HighlightTag[] = [
  { id: 'cleanliness', label: 'Cleanliness', icon: 'clean_hands' },
  { id: 'noise_level', label: 'Noise Level', icon: 'volume_off' },
  { id: 'communication', label: 'Communication', icon: 'chat' },
  { id: 'bill_payment', label: 'Bill Payment', icon: 'payments' },
  { id: 'guests', label: 'Guests', icon: 'group' },
  { id: 'pet_friendly', label: 'Pet Friendly', icon: 'pets' },
];

interface WriteReviewFormProps {
  target?: ReviewTarget;
}

export default function WriteReviewForm({ target = MOCK_REVIEW_TARGET }: WriteReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedHighlights, setSelectedHighlights] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState('');

  const toggleHighlight = (id: string) => {
    const newSelection = new Set(selectedHighlights);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedHighlights(newSelection);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting review:', { rating, highlights: Array.from(selectedHighlights), feedback });
    // Handle submission logic here
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[800px]">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold leading-tight">
          Write a Review
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-base">
          Your feedback helps the SyncLiving community find better matches.
        </p>
      </div>

      {/* Roommate Snippet */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex items-center gap-6">
        <div className="relative">
          <div 
            className="size-24 rounded-full bg-cover bg-center border-4 border-primary/20"
            style={{ backgroundImage: `url("${target.avatarUrl}")` }}
            role="img"
            aria-label={`Professional headshot of ${target.name} for review`}
          />
        </div>
        <div className="flex flex-col">
          <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold">{target.name}</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Matched {target.matchedTime} • {target.location}
          </p>
          {target.isVerified && (
            <div className="flex items-center gap-1 mt-1 text-primary">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Verified Roommate</span>
            </div>
          )}
        </div>
      </div>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl flex flex-col gap-8 shadow-sm">
        
        {/* Rating */}
        <div className="flex flex-col gap-3">
          <label className="text-slate-900 dark:text-slate-100 font-bold text-lg">Overall Rating</label>
          <div className="flex gap-2" onMouseLeave={() => setHoveredRating(0)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`transition-colors ${(hoveredRating || rating) >= star ? 'text-primary' : 'text-slate-300 hover:text-primary'}`}
                onMouseEnter={() => setHoveredRating(star)}
                onClick={() => setRating(star)}
              >
                <span 
                  className="material-symbols-outlined text-4xl" 
                  style={{ fontVariationSettings: `'FILL' ${(hoveredRating || rating) >= star ? 1 : 0}` }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Lifestyle Highlights */}
        <div className="flex flex-col gap-4">
          <label className="text-slate-900 dark:text-slate-100 font-bold text-lg">Lifestyle Highlights</label>
          <div className="flex flex-wrap gap-2">
            {HIGHLIGHT_TAGS.map((tag) => {
              const isSelected = selectedHighlights.has(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleHighlight(tag.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-colors border-none ${
                    isSelected 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tag.icon}</span> 
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comments */}
        <div className="flex flex-col gap-3">
          <label className="text-slate-900 dark:text-slate-100 font-bold text-lg">Detailed Feedback</label>
          <textarea 
            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-primary focus:border-primary p-4" 
            placeholder={`What was it like living with ${target.name.split(' ')[0]}? Mention their strengths and any areas for improvement...`}
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90"
          >
            Submit Review
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Request a Review Section */}
      <div className="bg-gradient-to-br from-primary to-primary/80 p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h4 className="dark:text-slate-100 font-bold text-xl text-white">Reciprocity is key</h4>
          <p className="dark:text-slate-400 max-w-md text-white">
            Would you like to ask {target.name.split(' ')[0]} to review you as well? It helps build your profile's trustworthiness.
          </p>
        </div>
        <Button 
          variant="outline"
          className="whitespace-nowrap flex items-center gap-2 bg-white border-white text-primary hover:text-primary hover:bg-slate-50 rounded-xl border-none shadow-sm font-bold"
        >
          <span className="material-symbols-outlined">send</span>
          Request a Review
        </Button>
      </div>

      {/* Footer Help */}
      <div className="text-center py-6">
        <p className="text-slate-400 text-sm flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-base">lock</span>
          Reviews are shared only with potential matches and SyncLiving staff.
        </p>
      </div>

    </div>
  );
}