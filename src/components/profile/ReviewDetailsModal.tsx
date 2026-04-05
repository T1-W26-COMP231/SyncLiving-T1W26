'use client';

import React from 'react';
import { X, Star } from 'lucide-react';
import { type ReviewData } from './types';

interface ReviewDetailsModalProps {
  review: ReviewData;
  onClose: () => void;
}

// Reusable StarRating component, can be extracted to a shared UI file if needed
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewDetailsModal({ review, onClose }: ReviewDetailsModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-8 transform animate-scale-up"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-slate-800">Review Details</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6 max-h-96 overflow-y-auto">
          {/* Reviewer Info */}
          <div className="flex items-center gap-3 mb-4">
            {review.reviewer_avatar ? (
              <img
                src={review.reviewer_avatar}
                alt={review.reviewer_name}
                className="size-12 rounded-full object-cover border-2 border-slate-100"
              />
            ) : (
              <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {review.reviewer_name[0]}
              </div>
            )}
            <div>
              <p className="text-md font-bold text-slate-800">{review.reviewer_name}</p>
              <p className="text-xs text-slate-500">
                Overall Rating: <span className="font-semibold">{review.rating.toFixed(1)}/5.0</span>
              </p>
            </div>
          </div>

          {/* Overall Comment */}
          {review.text && (
            <blockquote className="mt-4 p-4 bg-slate-50 border-l-4 border-slate-200 rounded-r-lg">
              <p className="text-slate-600 text-sm leading-relaxed italic">
                &ldquo;{review.text}&rdquo;
              </p>
            </blockquote>
          )}

          {/* Detailed Scores */}
          {review.scores && review.scores.length > 0 && (
            <div className="mt-6">
              <h3 className="text-md font-semibold text-slate-700 mb-3">Breakdown</h3>
              <div className="space-y-3">
                {review.scores.map((item) => (
                  <div key={item.label} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                    <StarRating rating={item.score} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
