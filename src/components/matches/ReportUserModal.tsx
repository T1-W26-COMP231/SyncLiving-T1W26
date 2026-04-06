'use client';

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { reportUser } from '../../../app/matches/actions';

const REASONS = [
  'Harassment',
  'Fake Profile',
  'Inappropriate Content',
  'Spam',
  'Other',
] as const;

interface ReportUserModalProps {
  reportedUserId: string;
  reportedUserName: string | null;
  onClose: () => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  reportedUserId,
  reportedUserName,
  onClose,
}) => {
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await reportUser(reportedUserId, reason, description);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        setTimeout(onClose, 2500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center text-center py-4">
            <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <AlertTriangle size={24} className="text-green-600" />
            </div>
            <h2 className="text-xl font-black text-dark mb-2">Report Submitted</h2>
            <p className="text-sm text-slate-500">
              Thank you. Our team will review this report and take appropriate action.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-dark">Report User</h2>
                <p className="text-xs text-slate-500">
                  Reporting{' '}
                  <span className="font-bold text-slate-700">
                    {reportedUserName || 'this user'}
                  </span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        reason === r
                          ? 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
                  Additional details <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={!reason || submitting}
                className="w-full py-3 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
