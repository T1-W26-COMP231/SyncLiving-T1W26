"use client";

import React, { useState } from "react";
import { submitMatchFeedback } from "../../../app/discovery/actions";
import { Button } from "@/components/ui/Button"; // Assuming Button component exists

interface MatchFeedbackProps {
  targetId: string;
  matchScore: number;
  onSuccess?: (rating: number) => void;
}

const reasonsOptions = [
  "Budget mismatch",
  "Location inaccurate",
  "Lifestyle mismatch",
  "Age difference",
  "Preferences don't align",
  "Not interested",
];

export function MatchFeedback({
  targetId,
  matchScore,
  onSuccess,
}: MatchFeedbackProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [showReasonsPopover, setShowReasonsPopover] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleThumbsUp = async () => {
    setSubmitting(true);
    setError(null);
    const result = await submitMatchFeedback({
      targetId,
      matchScore,
      rating: 1,
      reasons: [],
    });
    if (result.success) {
      setFeedbackGiven(true);
    } else {
      setError(result.error || "Failed to submit feedback.");
    }
    setSubmitting(false);

    if (result.success) {
      onSuccess?.(1);
    } else {
      setError(result.error || "Failed to submit feedback.");
    }
  };

  const handleReasonsChange = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const handleSubmitReasons = async () => {
    setSubmitting(true);
    setError(null);
    const result = await submitMatchFeedback({
      targetId,
      matchScore,
      rating: -1,
      reasons: selectedReasons,
    });
    if (result.success) {
      setFeedbackGiven(true);
      setShowReasonsPopover(false);
    } else {
      setError(result.error || "Failed to submit feedback.");
    }
    setSubmitting(false);

    if (result.success) {
      setShowReasonsPopover(false);
      onSuccess?.(-1);
    } else {
      setError(result.error || "Failed to submit feedback.");
    }
  };

  if (feedbackGiven) {
    return (
      <div className="text-center text-sm text-gray-500 py-2">
        Appreciate your feedback! It helps us improve future recommendations.
      </div>
    );
  }

  return (
    <div
      className="relative p-4 bg-gray-50 border-t border-gray-200"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-sm font-medium text-gray-700 mb-2">
        Is this recommendation accurate?
      </p>
      <div className="flex space-x-2">
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleThumbsUp();
          }}
          disabled={submitting}
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1 text-green-600 hover:bg-green-50"
        >
          <span>👍</span>
          <span>Yes</span>
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowReasonsPopover(true);
          }}
          disabled={submitting}
          variant="ghost"
          size="sm"
          className="flex items-center space-x-1 text-red-600 hover:bg-red-50"
        >
          <span>👎</span>
          <span>No</span>
        </Button>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {showReasonsPopover && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 w-full bg-white border border-gray-200 rounded-lg shadow-sm p-4"
        >
          <p className="text-sm font-semibold mb-3">
            Why is this recommendation inaccurate?
          </p>
          <div className="space-y-2 mb-4">
            {reasonsOptions.map((reason) => (
              <div key={reason} className="flex items-center">
                <input
                  type="checkbox"
                  id={reason.replace(/\s+/g, "-").toLowerCase()}
                  checked={selectedReasons.includes(reason)}
                  onChange={() => handleReasonsChange(reason)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor={reason.replace(/\s+/g, "-").toLowerCase()}
                  className="ml-2 text-sm text-gray-700"
                >
                  {reason}
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReasonsPopover(false);
                setSelectedReasons([]);
              }}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSubmitReasons();
              }}
              disabled={submitting}
              variant="default"
              size="sm"
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
