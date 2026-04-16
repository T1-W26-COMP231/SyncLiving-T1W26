"use client";

import React, { useState } from "react";
import { X, Star, AlertTriangle } from "lucide-react";
import { type ReviewData } from "./types";
import { reportReview } from "../../../app/reviews/actions";
import { useRouter } from "next/navigation";

interface ReviewDetailsModalProps {
  review: ReviewData;
  onClose: () => void;
}

// Reusable StarRating component
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

// Mapping criteria to verification labels for display
const VERIFICATION_MAPPING: Record<string, { label: string; icon: string }> = {
  "Paid bills on time": { label: "Paid bills on time", icon: "💰" },
  "Cleaned kitchen after use": { label: "Cleaned kitchen after use", icon: "🍳" },
  "Handled trash on schedule": { label: "Handled trash on schedule", icon: "♻️" },
  "Respected house rules": { label: "Respected house rules", icon: "🤫" }
};

export default function ReviewDetailsModal({
  review,
  onClose,
}: ReviewDetailsModalProps) {
  const [isReporting, setIsReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState(review.status);
  const router = useRouter();

  // Filter for verified positive behaviors (robust to different score shapes)
  const verifications = (review.scores || []).filter((s: { label?: string; criteria_label?: string; score: any }) => {
    const key = s.label ?? (s as any).criteria_label;
    if (!key || !VERIFICATION_MAPPING[key]) return false;
    const val = (s as any).score;
    if (val === null || val === undefined) return false;
    if (typeof val === 'number') return Number(val) === 5;
    if (typeof val === 'boolean') return val === true;
    if (typeof val === 'string') {
      const lower = val.toLowerCase();
      return lower === 'true' || lower === '5' || lower === 'yes';
    }
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  }).map(s => VERIFICATION_MAPPING[s.label ?? (s as any).criteria_label]);

  async function handleReport() {
    if (currentStatus !== "active") return;
    setIsReporting(true);
    setReportMessage("");
    const result = await reportReview(review.id, review.reviewer_id, review.text);
    if (result.error) {
      setReportMessage(result.error);
    } else {
      setReportMessage("Thank you for your feedback. This review has been flagged for investigation.");
      setCurrentStatus("reported");
      router.refresh();
      setTimeout(onClose, 3000);
    }
    setIsReporting(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto p-8 transform animate-scale-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-bold text-slate-800">Review Details</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-4">
            {review.reviewer_avatar ? (
              <img src={review.reviewer_avatar} alt={review.reviewer_name} className="size-12 rounded-full object-cover" />
            ) : (
              <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {review.reviewer_name[0]}
              </div>
            )}
            <div>
              <p className="text-md font-bold text-slate-800">{review.reviewer_name}</p>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} />
                <span className="text-xs text-slate-500 font-semibold">{Number(review.rating || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {review.text && (
            <blockquote className="mt-4 p-4 bg-slate-50 border-l-4 border-slate-200 rounded-r-lg">
              <p className="text-slate-600 text-sm leading-relaxed italic">&ldquo;{review.text}&rdquo;</p>
            </blockquote>
          )}

          {verifications.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Roommate Reviews</h3>
              <div className="flex flex-wrap gap-2">
                {verifications.map((v) => (
                  <div key={v.label} className="bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-2">
                    <span className="text-xs">{v.icon}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              onClick={handleReport}
              disabled={isReporting || currentStatus === "reported" || !!reportMessage}
              className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
            >
              <AlertTriangle size={14} />
              {isReporting ? "Submitting..." : currentStatus === "reported" ? "Reported" : "Report this review"}
            </button>
            {reportMessage && <p className="mt-2 text-xs text-slate-600">{reportMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
