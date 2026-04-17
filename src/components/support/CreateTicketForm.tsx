'use client';

import React, { useState, useTransition } from 'react';
import { createSupportTicket } from '../../../app/support/actions';
import { Loader2, Send, AlertCircle, ShieldAlert, LifeBuoy } from 'lucide-react';
import { useRouter } from "next/navigation";

export default function CreateTicketForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [priority, setPriority] = useState('medium');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    switch (category) {
      case 'Bug Report':
        setPriority('low');
        break;
      case 'Safety / Report User':
        setPriority('high');
        break;
      case 'Account Issue':
      default:
        setPriority('medium');
        break;
    }
  };

  const handleSubmit = async (formData: FormData) => {
  setError(null);
  
  startTransition(async () => {
    try {
      // 1. Get the execution result from the Server Action
      const result = await createSupportTicket(formData);

      // 2. If the backend returns a custom error, set it to be displayed in the UI
      if (result?.error) {
        setError(result.error);
        return; // Stop further actions
      }

      // 3. [Key] If the backend indicates success, perform the redirect on the frontend!
      if (result?.success) {
        router.push("/support");
      }

    } catch (err) {
      // Here, only "real" unexpected errors (e.g., network failure, server 500 crash) will be caught.
      // Redirect signals will no longer be caught here!
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  });
};

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 bg-primary/5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl text-dark shadow-lg shadow-primary/20">
              <LifeBuoy size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-dark">Submit a Support Ticket</h1>
              <p className="text-slate-500 text-sm">We&apos;re here to help. Tell us what&apos;s happening.</p>
            </div>
          </div>
        </div>

        <form action={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="subject" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              maxLength={100}
              placeholder="Briefly describe your issue"
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary/50 focus:bg-white outline-none transition-all text-dark font-medium placeholder:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="category" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                onChange={handleCategoryChange}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary/50 focus:bg-white outline-none transition-all text-dark font-medium cursor-pointer appearance-none"
              >
                <option value="Account Issue">Account Issue</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Safety / Report User">Safety / Report User</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                Priority Level
              </label>
              <div className="px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-slate-500 font-bold text-sm flex items-center gap-2">
                {priority === 'high' && <ShieldAlert size={16} className="text-rose-500" />}
                {priority === 'medium' && <AlertCircle size={16} className="text-amber-500" />}
                {priority === 'low' && <LifeBuoy size={16} className="text-emerald-500" />}
                <span className="capitalize">{priority}</span>
              </div>
              <input type="hidden" name="priority" value={priority} />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
              Detailed Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={6}
              placeholder="Please provide as much detail as possible so we can assist you better."
              className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-primary/50 focus:bg-white outline-none transition-all text-dark font-medium placeholder:text-slate-300 resize-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-primary text-dark font-black rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Typical response time is within 24 hours. For urgent safety issues, please use the &apos;Safety&apos; category.
          </p>
        </div>
      </div>
    </div>
  );
}
