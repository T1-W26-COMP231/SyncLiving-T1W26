'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronDown } from 'lucide-react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import { logout } from '../../../app/auth/actions';

interface NavbarProps {
  userName?: string;
  activeTab?: string;
}

const Navbar: React.FC<NavbarProps> = ({ userName = 'User', activeTab = 'Listings' }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex-shrink-0">
          <SyncLivingLogo size="md" />
        </div>
        
        {/* Main Navigation */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          <NavLink label="Listings" href="/provider-dashboard" active={activeTab === 'Listings'} />
          <NavLink label="Discovery" href="#" active={activeTab === 'Discovery'} />
          <NavLink label="Matches" href="#" badge="12" active={activeTab === 'Matches'} />
          <NavLink label="Messages" href="#" badge="3" active={activeTab === 'Messages'} />
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Quick search..." 
              className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-primary/30 w-48 outline-none transition-all"
            />
          </div>
          
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer group">
            <div className="size-9 rounded-full bg-primary flex items-center justify-center font-bold text-dark text-xs border-2 border-white shadow-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-dark group-hover:text-primary transition-colors">{userName}</p>
              <button onClick={() => logout()} className="text-[10px] text-slate-500 hover:text-red-500 font-semibold block">Sign Out</button>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-dark transition-colors" />
          </div>
        </div>
      </div>
    </header>
  );
};

// Helper Components
function NavLink({ label, href, active = false, badge }: { label: string; href: string; active?: boolean; badge?: string }) {
  return (
    <Link 
      href={href} 
      className={`relative py-2 px-1 text-sm font-bold transition-colors flex items-center gap-2 ${
        active ? 'text-primary' : 'text-slate-500 hover:text-dark'
      }`}
    >
      {label}
      {badge && (
        <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
          {badge}
        </span>
      )}
      {active && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></span>
      )}
    </Link>
  );
}

export default Navbar;
