"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flag,
  Star,
  Trash2,
  CheckCircle,
  Filter,
  Download,
} from "lucide-react";
import {
  getUserReports,
  getFlaggedReviewsForModeration,
  moderateReviewStatus,
  updateReportStatus,
  ModerationReview,
  UserReport,
} from "../../../app/admin/actions";

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportStatus = "new" | "investigating" | "resolved";

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STYLES: Record<
  ReportStatus,
  { dot: string; text: string; label: string }
> = {
  new: {
    dot: "bg-admin-primary animate-pulse",
    text: "text-admin-primary",
    label: "New",
  },
  investigating: {
    dot: "bg-slate-400",
    text: "text-slate-500",
    label: "Investigating",
  },
  resolved: {
    dot: "bg-emerald-500",
    text: "text-emerald-600",
    label: "Resolved",
  },
};

const REASON_STYLES: Record<string, string> = {
  Harassment: "bg-red-100 text-red-600",
  "Fake Profile": "bg-orange-100 text-orange-600",
  "Fake Listing": "bg-orange-100 text-orange-600",
  "Inappropriate Content": "bg-purple-100 text-purple-600",
  Spam: "bg-amber-100 text-amber-600",
  "Account Theft": "bg-rose-100 text-rose-600",
  Other: "bg-slate-100 text-slate-600",
};

// Star rating row
function StarRow({ count }: { count: number }) {
  return (
    <div className="flex text-yellow-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < count ? "fill-yellow-400" : "fill-none stroke-slate-300"}`}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportsSafety() {
  const [activeTab, setActiveTab] = useState<"reports" | "reviews">("reports");
  const [reports, setReports] = useState<UserReport[]>([]);
  const [reviews, setReviews] = useState<ModerationReview[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "All">("All");
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string>("");

  function showActionMessage(message: string) {
    setActionMessage(message);
    window.setTimeout(() => setActionMessage(""), 2500);
  }

  useEffect(() => {
    getUserReports()
      .then(setReports)
      .finally(() => setLoading(false));

    getFlaggedReviewsForModeration()
      .then(setReviews)
      .finally(() => setReviewsLoading(false));
  }, []);

  async function investigateReport(id: string) {
    try {
      await updateReportStatus(id, "investigating");
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "investigating" } : r)),
      );
      showActionMessage("Report marked as investigating.");
    } catch {
      showActionMessage("Unable to update report status.");
    }
  }

  async function dismissReview(id: string) {
    await moderateReviewStatus(id, "active");
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  async function removeReview(id: string) {
    await moderateReviewStatus(id, "deleted");
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const filteredReports = reports.filter(
    (r) => statusFilter === "All" || r.status === statusFilter,
  );

  function exportFilteredReports() {
    if (filteredReports.length === 0) {
      showActionMessage("No rows to export for current filter.");
      return;
    }

    const headers = [
      "report_id",
      "reported_user",
      "reason",
      "reporter",
      "date",
      "status",
    ];

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const rows = filteredReports.map((r) =>
      [r.id, r.reportedUser, r.reason, r.reporter, r.date, r.status]
        .map((value) => escapeCsv(String(value ?? "")))
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `safety-reports-${statusFilter.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showActionMessage("CSV export downloaded.");
  }

  const newCount = reports.filter((r) => r.status === "new").length;

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Page Header + Tabs */}
      <div>
        <h1 className="text-2xl font-bold mb-6 tracking-tight">
          Misconduct &amp; Safety
        </h1>
        <div className="flex border-b border-slate-200 gap-8">
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 border-b-2 pb-4 pt-2 font-bold transition-all ${
              activeTab === "reports"
                ? "border-admin-primary text-admin-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
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
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 border-b-2 pb-4 pt-2 font-bold transition-all ${
              activeTab === "reviews"
                ? "border-admin-primary text-admin-primary"
                : "border-transparent text-slate-500 hover:text-slate-700"
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
      {activeTab === "reports" && (
        <div className="space-y-6">
          {actionMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {actionMessage}
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Active Reports</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as ReportStatus | "All")
                    }
                    className="appearance-none px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors focus:outline-none pr-7 cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="new">New</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
                </div>
                <button
                  onClick={exportFilteredReports}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-full hover:bg-slate-200 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-left border-collapse">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[17%]" />
                  <col className="w-[16%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Reported User
                    </th>
                    <th className="px-3 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-3 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-3 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-3 text-slate-500 text-xs font-bold uppercase tracking-wider text-left">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-400 text-sm"
                      >
                        Loading reports...
                      </td>
                    </tr>
                  ) : filteredReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-400 text-sm"
                      >
                        No reports match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer group ${
                          report.status === "new" ? "bg-admin-primary/5" : ""
                        }`}
                      >
                        {/* Reported user */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold overflow-hidden">
                              {report.avatarUrl ? (
                                <img
                                  src={report.avatarUrl}
                                  alt={report.reportedUser}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                report.reportedUser.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="text-sm font-semibold">
                              {report.reportedUser}
                            </span>
                          </div>
                        </td>

                        {/* Reason badge */}
                        <td className="px-3 py-3">
                          <span
                            title={report.reason}
                            className={`inline-flex max-w-[10.5rem] truncate px-2 py-1 rounded-full text-[10px] font-semibold ${
                              REASON_STYLES[report.reason] ??
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {report.reason}
                          </span>
                        </td>

                        {/* Reporter */}
                        <td className="px-3 py-3 text-sm text-slate-500">
                          {report.reporter}
                        </td>

                        {/* Date */}
                        <td className="px-3 py-3 text-sm text-slate-500">
                          {report.date}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* type conversion */}
                            <span
                              className={`size-2 rounded-full ${STATUS_STYLES[report.status as ReportStatus]?.dot}`}
                            />
                            <span
                              className={`text-xs font-medium ${STATUS_STYLES[report.status as ReportStatus]?.text}`}
                            >
                              {
                                STATUS_STYLES[report.status as ReportStatus]
                                  ?.label
                              }
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-left">
                          <div className="flex gap-1.5 justify-start items-center">
                            <Link
                              href={`/admin/reports/${report.id}`}
                              className="w-20 shrink-0 whitespace-nowrap inline-flex justify-center px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              Details
                            </Link>
                            {report.status === "new" ? (
                              <button
                                onClick={() => investigateReport(report.id)}
                                className="w-24 shrink-0 whitespace-nowrap inline-flex justify-center px-2.5 py-1 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                              >
                                Investigate
                              </button>
                            ) : null}
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
      {activeTab === "reviews" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg">Review Moderation</h3>
            <span className="text-xs text-slate-500">
              Showing reported reviews only
            </span>
          </div>

          {reviewsLoading ? (
            <div className="p-12 text-center text-slate-400">Loading flagged reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
              <p className="font-semibold text-emerald-600">
                All reviews are cleared!
              </p>
              <p className="text-sm mt-1">
                No flagged reviews require moderation at this time.
              </p>
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
                    <p className="text-sm italic text-slate-600">
                      {review.text}
                    </p>
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
