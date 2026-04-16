"use client";

import { useState, useTransition } from "react";
import { createAnnouncement } from "../actions"; // 已修正為相對路徑
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
          // 成功後清空表單
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
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Publish Announcement
        </h1>
      </div>

      {/* 成功與錯誤的提示訊息 */}
      {message && (
        <div
          className={`p-4 mb-6 rounded-md flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* 純 Tailwind 表單 */}
      <form id="announcement-form" action={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Announcement Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="e.g., Scheduled Maintenance this Sunday"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
          >
            Message Body
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white resize-y"
            placeholder="Enter the full details of your announcement here..."
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 flex justify-center items-center gap-2"
        >
          {isPending ? "Publishing..." : "Publish Announcement"}
        </button>
      </form>
    </div>
  );
}
