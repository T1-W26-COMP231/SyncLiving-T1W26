'use client';

import React, { useState, useEffect } from 'react';
import { Flag, Star, Trash2, CheckCircle, Filter, Download } from 'lucide-react';
import { getUserReports, updateReportStatus, UserReport } from '../../../app/admin/actions';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportStatus = 'new' | 'investigating' | 'resolved';

interface FlaggedReview {
  id: string;
  stars: number;
  listing: string;
  author: string;
  text: string;
  flagReason: string;
}

// ─── Mock flagged reviews (no DB table yet) ───────────────────────────────────
const INITIAL_REVIEWS: FlaggedReview[] = [
  {
    id: '1',
    stars: 3,
    listing: 'Central Park Apartment',
    author: '@anonymous_99',
    text: '"The landlord is a complete fraud and steals deposits. Everyone avoid this place at all costs!!!"',
    flagReason: 'Libel / False Info',
  },
  {
    id: '2',
    stars: 1,
    listing: 'Studio Loft X',
    author: '@guest_421',
    text: '"I hate this user so much, they are ugly and stupid."',
    flagReason: 'Profanity / Personal Attack',
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STYLES: Record<ReportStatus, { dot: string; text: string; label: string }> = {
  new: { dot: 'bg-admin-primary animate-pulse', text: 'text-admin-primary', label: 'New' },
  investigating: { dot: 'bg-slate-400', text: 'text-slate-500', label: 'Investigating' },
  resolved: { dot: 'bg-emerald-500', text: 'text-emerald-600', label: 'Resolved' },
};

const REASON_STYLES: Record<string, string> = {
  Harassment: 'bg-red-100 text-red-600',
  'Fake Profile': 'bg-orange-100 text-orange-600',
  'Fake Listing': 'bg-orange-100 text-orange-600',
  'Inappropriate Content': 'bg-purple-100 text-purple-600',
  Spam: 'bg-amber-100 text-amber-600',
  'Account Theft': 'bg-rose-100 text-rose-600',
  Other: 'bg-slate-100 text-slate-600',
};

// Star rating row
function StarRow({ count }: { count: number }) {
  return (
    <div className="flex text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < count ? 'fill-yellow-400' : 'fill-none stroke-slate-300'}`}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportsSafety() {
  const [activeTab, setActiveTab] = useState<'reports' | 'reviews'>('reports');
  const [reports, setReports] = useState<UserReport[]>([]);
  const [reviews, setReviews] = useState<FlaggedReview[]>(INITIAL_REVIEWS);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserReports()
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  async function resolveReport(id: string) {
    await updateReportStatus(id, 'resolved');
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'resolved' } : r))
    );
  }

  async function investigateReport(id: string) {
    await updateReportStatus(id, 'investigating');
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'investigating' } : r))
    );
  }

  function dismissReview(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  function removeReview(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const filteredReports = reports.filter(
    (r) => statusFilter === 'All' || r.status === statusFilter
  );

  const newCount = reports.filter((r) => r.status === 'new').length;

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Page Header + Tabs */}
      <div>
        <h1 className="text-2xl font-bold mb-6 tracking-tight">Misconduct &amp; Safety</h1>
        <div className="flex border-b border-slate-200 gap-8">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 border-b-2 pb-4 pt-2 font-bold transition-all ${
              activeTab === 'reports'
                ? 'border-admin-primary text-admin-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Flag className="w-5 h-5" />
            Safety Reports
            {newCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-admin-primary/10 text-admin-primary text-[10px] rounded-full uppercase font-bold">
                {newCount} New
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 border-b-2 pb-4 pt-2 font-bold transition-all ${
              activeTab === 'reviews'
                ? 'border-admin-primary text-admin-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Star className="w-5 h-5" />
            Review Moderation
            {reviews.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-admin-primary/10 text-admin-primary text-[10px] rounded-full uppercase font-bold">
                {reviews.length} New
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Safety Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Active Reports</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'All')}
                    className="appearance-none px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors focus:outline-none pr-7 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="new">New</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>
                <button className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Reported User</th>
                    <th className="px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Reporter</th>
                    <th className="px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                        Loading reports...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                        No reports match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${
                          report.status === 'new' ? 'bg-admin-primary/5' : ''
                        }`}
                      >
                        {/* Reported user */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold overflow-hidden">
                              {report.avatarUrl ? (
                                <img src={report.avatarUrl} alt={report.reportedUser} className="w-full h-full object-cover" />
                              ) : (
                                report.reportedUser.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="text-sm font-semibold">{report.reportedUser}</span>
                          </div>
                        </td>

                        {/* Reason badge */}
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight ${
                              REASON_STYLES[report.reason] ?? 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {report.reason}
                          </span>
                        </td>

                        {/* Reporter */}
                        <td className="px-4 py-4 text-sm text-slate-500">{report.reporter}</td>

                        {/* Date */}
                        <td className="px-4 py-4 text-sm text-slate-500">{report.date}</td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`size-2 rounded-full ${STATUS_STYLES[report.status].dot}`} />
                            <span className={`text-xs font-medium ${STATUS_STYLES[report.status].text}`}>
                              {STATUS_STYLES[report.status].label}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {report.status !== 'investigating' && report.status !== 'resolved' && (
                              <button
                                onClick={() => investigateReport(report.id)}
                                className="px-3 py-1 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                              >
                                Investigate
                              </button>
                            )}
                            {report.status !== 'resolved' && (
                              <button
                                onClick={() => resolveReport(report.id)}
                                className="px-3 py-1 text-xs font-bold rounded-xl bg-admin-primary text-white hover:opacity-90 transition-all flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Resolve
                              </button>
                            )}
                            {report.status === 'resolved' && (
                              <span className="px-3 py-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Resolved
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Moderation Tab */}
      {activeTab === 'reviews' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg">Review Moderation</h3>
            <span className="text-xs text-slate-500">Showing reported reviews only</span>
          </div>

          {reviews.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold text-emerald-600">All reviews are cleared!</p>
              <p className="text-sm mt-1">No flagged reviews require moderation at this time.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-5 flex flex-col md:flex-row gap-4 items-start md:items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StarRow count={review.stars} />
                      <span className="text-xs font-bold text-slate-500">
                        on &ldquo;{review.listing}&rdquo; by {review.author}
                      </span>
                    </div>
                    <p className="text-sm italic text-slate-600">{review.text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-500" />
                      <span className="text-[11px] text-red-500 font-bold uppercase">
                        Reported for: {review.flagReason}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => dismissReview(review.id)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => removeReview(review.id)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
