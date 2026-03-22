'use client';

import React, { useState } from 'react';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
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
import Navbar from '@/components/layout/Navbar';

interface ProviderDashboardClientProps {
  initialListings: ListingType[];
  inquiries: any[];
  userName: string;
  name: string;
  initialProfile?: any;
}

export default function ProviderDashboardClient({ initialListings, inquiries, userName, name, initialProfile }: ProviderDashboardClientProps) {
  const [activeTab,         setActiveTab]         = useState<'All' | 'Published' | 'Drafts' | 'Archived'>('All');
  const [searchQuery,       setSearchQuery]       = useState('');
  const [showProfileModal,  setShowProfileModal]  = useState(false);

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
      
      {/* Reusable Top Navigation Bar */}
      <Navbar userName={userName} activeTab="Listings" />

      {/* Main Dashboard Area */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">Welcome, {name}</h1>
          <p className="text-slate-500 font-medium">Find the most compatible roommates for your space.</p>
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
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-fit bg-primary hover:brightness-105 text-dark font-bold py-3 px-8 rounded-full transition-all active:scale-95 shadow-lg shadow-primary/20"
              >
                Add a Profile
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
      {/* Profile creation modal */}
      {showProfileModal && (
        <OnboardingForm
          initialData={initialProfile}
          isModal
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, change, icon }: { label: string; value: string; change: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="size-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
      <div>
        <h4 className="text-2xl font-extrabold text-dark">{value}</h4>
        <p className="text-[11px] font-bold text-green-500 mt-1 uppercase tracking-tighter">{change}</p>
      </div>
    </div>
  );
}
