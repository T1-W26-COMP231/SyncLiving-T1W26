'use client';

import Link from 'next/link';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import { Bell, ChevronDown } from 'lucide-react';
import { logout } from '../../../app/auth/actions';

interface LandingNavbarProps {
  user?: any;
}

const LandingNavbar = ({ user }: LandingNavbarProps) => {
  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 px-6 md:px-20 py-4 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-12">
        <SyncLivingLogo size="md" />
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/discovery" className="text-slate-600 hover:text-primary transition-colors text-sm font-bold">
            Discovery
          </Link>
          <Link href="/provider-dashboard" className="text-slate-600 hover:text-primary transition-colors text-sm font-bold">
            Listings
          </Link>
          <Link href="/seeker-preferences" className="text-slate-600 hover:text-primary transition-colors text-sm font-bold">
            Preference
          </Link>
          <Link href="/onboarding" className="text-slate-600 hover:text-primary transition-colors text-sm font-bold">
            Profile
          </Link>
          <a className="text-slate-600 hover:text-primary transition-colors text-sm font-medium" href="#how-it-works">
            How it Works
          </a>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {!user ? (
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-primary text-dark text-sm font-bold shadow-sm hover:brightness-105 transition-all"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-10 px-6 bg-slate-100 text-slate-900 text-sm font-bold hover:bg-slate-200 transition-all"
            >
              Login
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
              <div className="size-9 rounded-full bg-primary flex items-center justify-center font-bold text-dark text-xs border-2 border-white shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-dark group-hover:text-primary transition-colors">{userName}</p>
                <button 
                  onClick={() => logout()} 
                  className="text-[10px] text-slate-500 hover:text-red-500 font-semibold block transition-colors"
                >
                  Sign Out
                </button>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-dark transition-colors" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default LandingNavbar;
