import React from 'react';
import Link from 'next/link';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';

const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3" data-purpose="site-navigation">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-8">
        {/* Logo */}
        <div className="flex-shrink-0">
          <SyncLivingLogo size="md" />
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-2xl relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-full bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Search by Location, Keyword..."
            type="text"
          />
        </div>

        {/* Action Icons & User */}
        <nav className="flex items-center gap-6">
          <button className="flex flex-col items-center text-slate-500 hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="text-[10px] font-medium mt-1">Create List</span>
          </button>
          
          <button className="flex flex-col items-center text-slate-500 hover:text-primary transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="text-[10px] font-medium mt-1">Review</span>
          </button>

          <Link href="/messages" className="flex flex-col items-center text-slate-500 hover:text-primary transition-colors relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="text-[10px] font-medium mt-1">Messages</span>
          </Link>

          <button className="flex flex-col items-center text-slate-500 hover:text-primary transition-colors relative">
            <span className="absolute top-0 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="text-[10px] font-medium mt-1">Notifications</span>
          </button>

          <Link href="/onboarding" className="flex flex-col items-center text-slate-500 hover:text-primary transition-colors cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span className="text-[10px] font-medium mt-1">Profile</span>
          </Link>

          <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
          
          <button className="flex items-center gap-2 pl-2 focus:outline-none">
            <img
              alt="User Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0bDjsyS7oF7JyzuuowQsP6vIbqstRGiR1WVMRwBgYg2e3ne9dN4jrXDYSm33-Fu18ra1nLoVBpWPKWKEy9XM31oS70Q3UAxON3mr4oLPY8BMgx4IVBYNnOeHzQKKqNjeJsPCi17qTKWuezySEsCuVi7j2aCcgW05sYUggToaaDQj2H2j1j3m68hwi2IM7ulMT0zAp1mgHcltBS0XjrOctcyU6sltLm9gK2IjVB3d21zOrte-PSlFleSIydfnK19DqdeFoIZ6KVEy3"
            />
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
