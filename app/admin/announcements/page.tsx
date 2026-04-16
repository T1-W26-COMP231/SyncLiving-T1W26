"use client";

import { useState, useTransition } from "react";
import { createAnnouncement } from "../actions";
import { Megaphone, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminAnnouncementsPage() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await createAnnouncement(formData);
        if (result?.error) {
          setMessage({ type: "error", text: result.error });
        } else if (result?.success) {
          setMessage({
            type: "success",
            text: "Announcement published successfully!",
          });
          const form = document.getElementById(
            "announcement-form",
          ) as HTMLFormElement;
          if (form) form.reset();
        }
      } catch (err) {
        setMessage({ type: "error", text: "An unexpected error occurred." });
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Form card */}
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 space-y-6">
        {/* Card header */}
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-admin-primary/10 flex items-center justify-center text-admin-primary border border-admin-primary/20">
            <Megaphone size={20} />
          </div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">
            New Announcement
          </h2>
        </div>

        {/* Success / error banner */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-rose-50 text-rose-700 border border-rose-100"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <AlertCircle size={18} className="shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form id="announcement-form" action={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Announcement Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="e.g., Scheduled Maintenance this Sunday"
              className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 text-sm bg-slate-50 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-bold text-slate-700 mb-1.5"
            >
              Message Body
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Enter the full details of your announcement here..."
              className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900 text-sm bg-slate-50 focus:border-admin-primary focus:outline-none focus:ring-2 focus:ring-admin-primary/20 placeholder:text-slate-400 resize-y transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-admin-primary px-4 py-3 text-white font-black text-sm hover:bg-admin-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-admin-primary/25 flex justify-center items-center gap-2"
          >
            <Megaphone size={16} />
            {isPending ? "Publishing..." : "Publish Announcement"}
          </button>
        </form>
      </div>
    </div>
  );
}
