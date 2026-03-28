'use client';

import React from 'react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import Link from 'next/link';
import { Search, Bell } from 'lucide-react';

export const MessagingNavbar: React.FC = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-10 py-3 sticky top-0 z-50 shrink-0">
      <div className="flex items-center gap-8">
        <SyncLivingLogo size="sm" />
        <div className="hidden md:flex items-center gap-6">
          <Link className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="/">
            Discovery
          </Link>
          <Link className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="/listings">
            Listing
          </Link>
          <Link className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors" href="/matches">
            Matches
          </Link>
          <Link className="text-sm font-semibold text-primary" href="/messages">
            Messages
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:block">
          <label className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 border border-transparent focus-within:border-primary transition-all">
            <Search size={18} className="text-slate-500 shrink-0" />
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
              placeholder="Search messages or rules"
              type="text"
            />
          </label>
        </div>
        <button className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-primary/10 hover:text-primary transition-all">
          <Bell size={20} />
        </button>
        <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary overflow-hidden">
          <img
            alt="User Profile"
            className="h-full w-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQ2EfOy_Aj2r2e4KRKI2r9NHjgVZbuUbhsaYt3am74eXtHuwdJyvJzBf-LZN4L7T6FS4Rf27Flr0coQahPBthCHPWW61vHst_P0eEP1xOrZL31ZcE7BavpBZtar2plArXCRZsmly9rupQoDWOERXNy1NT70pkatFcrHDkuVwqlSG7I2hxK4-HWTRvthqnhuNQfdp8OjW7u8cFBL9hlqVwbD0KSaURhPaeAaO1ovKU5p1Ze4dnMbG8ODLGAwFtyG-4sa_vV5KNzJnM"
          />
        </div>
      </div>
    </header>
  );
};
