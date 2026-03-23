'use client';

import React, { useState } from 'react';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
import Link from 'next/link';
import { ListingCard, ListingType } from './ListingCard';
import { 
  Search, 
  Home, 
  Zap
} from 'lucide-react';
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
          <p className="text-slate-500 font-medium">Manage your property listings and find the best tenants.</p>
        </div>

        {/* List Your Room - Single Focus CTA */}
        <div className="max-w-4xl">
          <div className="relative overflow-hidden group bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 bg-primary opacity-5 blur-[80px] group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative z-10 h-full flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="size-14 rounded-2xl bg-slate-100 flex items-center justify-center text-dark border border-slate-200">
                  <Zap size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dark mb-2">List Your Room</h2>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
                    Ready to fill an empty space? Create a detailed listing with photos, amenities, 
                    and roommate preferences to attract high-quality applicants today.
                  </p>
                </div>
              </div>
              <Link 
                href="/provider-dashboard/create"
                className="w-full md:w-fit bg-dark hover:bg-slate-800 text-white font-bold py-4 px-10 rounded-full text-center transition-all active:scale-95 shadow-lg shadow-dark/20"
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
      {/* Profile creation modal - Keeping logic but removing CTA trigger */}
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
