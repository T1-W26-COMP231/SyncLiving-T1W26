'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronDown, Settings, LogOut } from 'lucide-react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import { logout } from '../../../app/auth/actions';
import { createClient } from '@/utils/supabase/client';


interface NavbarProps {
  activeTab?: string;
  onOpenSettings?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeTab = 'Listings', onOpenSettings }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string>('User');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        const name = profile?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
      }
    };
    
    fetchUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
          <SyncLivingLogo size="md" />
        </Link>

        {/* Main Navigation */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          <NavLink label="Listings" href="/provider-dashboard" active={activeTab === 'Listings'} />
          <NavLink label="Discovery" href="#" active={activeTab === 'Discovery'} />
          <NavLink label="Matches" href="#" badge="12" active={activeTab === 'Matches'} />
          <NavLink label="Messages" href="/messages" badge="3" active={activeTab === 'Messages'} />
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

          {/* User menu with dropdown */}
          <div className="relative pl-4 border-l border-slate-200" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="size-9 rounded-full bg-primary flex items-center justify-center font-bold text-dark text-xs border-2 border-white shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-dark group-hover:text-primary transition-colors">{userName}</p>
                <p className="text-[10px] text-slate-500 font-semibold">My Account</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-slate-400 group-hover:text-dark transition-all ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-dark truncate">{userName}</p>
                  <p className="text-[10px] text-slate-400">Signed in</p>
                </div>

                {/* Settings */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenSettings?.();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-dark transition-colors"
                >
                  <Settings size={15} className="text-slate-400" />
                  <span className="font-medium">Settings</span>
                </button>

                {/* Divider */}
                <div className="my-1 border-t border-slate-100" />

                {/* Logout */}
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            )}
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
      className={`relative py-2 px-1 text-sm font-bold transition-colors flex items-center gap-2 ${active ? 'text-primary' : 'text-slate-500 hover:text-dark'
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
