import React from 'react';
import WriteReviewForm from '@/components/reviews/WriteReviewForm';
import Navbar from '@/components/layout/Navbar';

export default function WriteReviewPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f6f8f8] dark:bg-[#101d22] overflow-x-hidden">
      
      {/* 
        Optional: If your layout already handles the Navbar, you can remove this header. 
        Included here to ensure 100% visual fidelity matching the provided design.
      */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101d22] px-6 md:px-10 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <span className="material-symbols-outlined block">sync</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">SyncLiving</h1>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden md:flex items-center gap-9">
            <a className="text-slate-700 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors" href="#">Home</a>
            <a className="text-slate-700 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors" href="#">Matches</a>
            <a className="text-slate-700 dark:text-slate-300 text-sm font-medium hover:text-primary transition-colors" href="#">Messages</a>
          </nav>
          <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 justify-center py-10 px-4 md:px-0">
        <WriteReviewForm />
      </main>

    </div>
  );
}