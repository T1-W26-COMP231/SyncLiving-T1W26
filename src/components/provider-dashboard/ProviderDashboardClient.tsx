'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ListingCard, ListingType } from './ListingCard';
import { 
  Search, 
  Plus, 
  LayoutDashboard, 
  Home, 
  Users, 
  MessageSquare, 
  Settings, 
  LogOut,
  Bell,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  Zap
} from 'lucide-react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';
import { logout } from '../../../app/auth/actions';

interface ProviderDashboardClientProps {
  initialListings: ListingType[];
  inquiries: any[];
}

export default function ProviderDashboardClient({ initialListings, inquiries }: ProviderDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'All' | 'Published' | 'Drafts' | 'Archived'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredListings = initialListings.filter(listing => {
    const statusMatch = activeTab === 'All' || 
      (activeTab === 'Published' && listing.status === 'published') ||
      (activeTab === 'Drafts' && listing.status === 'draft') ||
      (activeTab === 'Archived' && listing.status === 'archived');
      
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f8fafb] font-sans pb-20">
      
      {/* Top Navigation Bar - Reference "SyncLiving - Roommate discovery with Listing" */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <SyncLivingLogo size="md" />
          </div>
          
          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            <NavLink label="Listings" href="/provider-dashboard" active />
            <NavLink label="Discovery" href="#" />
            <NavLink label="Matches" href="#" badge="12" />
            <NavLink label="Messages" href="#" badge="3" />
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
                JD
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-dark group-hover:text-primary transition-colors">John Doe</p>
                <button onClick={() => logout()} className="text-[10px] text-slate-500 hover:text-red-500 font-semibold block">Sign Out</button>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-dark transition-colors" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">Manage Listings</h1>
          <p className="text-slate-500 font-medium">Manage your properties and find the most compatible roommates for your space.</p>
        </div>

        {/* Two Section CTAs - Reference "SyncLiving - Final Dashboard with Listings" */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Find your compatible roommate */}
          <div className="relative overflow-hidden group bg-dark rounded-[2.5rem] p-8 text-white shadow-2xl shadow-dark/20 border border-white/5">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-primary opacity-10 blur-[80px] group-hover:opacity-20 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <div className="size-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Find your compatible roommate</h2>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                    Our compatibility-first matching system connects you with individuals who share your lifestyle, 
                    values, and living habits for a stress-free shared experience.
                  </p>
                </div>
              </div>
              <button className="w-fit bg-primary hover:brightness-105 text-dark font-bold py-3 px-8 rounded-full transition-all active:scale-95 shadow-lg shadow-primary/20">
                Discover Matches
              </button>
            </div>
          </div>

          {/* List Your Room */}
          <div className="relative overflow-hidden group bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-primary opacity-5 blur-[80px] group-hover:opacity-10 transition-opacity"></div>
            <div className="relative z-10 h-full flex flex-col justify-between gap-8">
              <div className="space-y-4">
                <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center text-dark border border-slate-200">
                  <Zap size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dark mb-2">List Your Room</h2>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
                    Ready to fill an empty space? Create a detailed listing with photos, amenities, 
                    and roommate preferences to attract high-quality applicants today.
                  </p>
                </div>
              </div>
              <Link 
                href="/provider-dashboard/create"
                className="w-fit bg-dark hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-full transition-all active:scale-95 shadow-lg shadow-dark/20"
              >
                Add New Listing
              </Link>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-dark tracking-tight">Your Current Listings</h2>
              <p className="text-sm text-slate-500 font-medium">Tracking {initialListings.length} properties in your portfolio</p>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {['All', 'Published', 'Drafts', 'Archived'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab 
                      ? 'bg-white text-dark shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by title, location or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            />
          </div>

          {/* Listings Feed */}
          <div className="space-y-4">
            {filteredListings.length > 0 ? (
              filteredListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-200">
                <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Home size={40} />
                </div>
                <h3 className="text-xl font-bold text-dark">No listings found</h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">
                  Try clearing your filters or create your first listing to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

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
