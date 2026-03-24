'use client';

import Link from 'next/link';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import { logout } from '../../../app/auth/actions';

interface LandingNavbarProps {
  user?: any;
}

const LandingNavbar = ({ user }: LandingNavbarProps) => {
  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        <SyncLivingLogo size="md" />

        {/* Public navigation links only */}
        <nav className="hidden md:flex items-center gap-8 flex-1">
          <a className="text-slate-500 hover:text-dark transition-colors text-sm font-bold" href="#how-it-works">
            How it Works
          </a>
          <a className="text-slate-500 hover:text-dark transition-colors text-sm font-bold" href="#testimonials">
            Reviews
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                href="/login"
                className="flex cursor-pointer items-center justify-center rounded-full h-9 px-5 bg-slate-100 text-slate-900 text-sm font-bold hover:bg-slate-200 transition-all"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="flex cursor-pointer items-center justify-center rounded-full h-9 px-5 bg-primary text-dark text-sm font-bold shadow-sm hover:brightness-105 transition-all"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="size-9 rounded-full bg-primary flex items-center justify-center font-bold text-dark text-xs border-2 border-white shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-dark">{userName}</p>
                <button
                  onClick={() => logout()}
                  className="text-[10px] text-slate-500 hover:text-red-500 font-semibold block transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingNavbar;
