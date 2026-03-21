'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ListingCard, ListingType } from '@/components/provider-dashboard/ListingCard';
import { Search, Plus } from 'lucide-react';

// Mock Data
const MOCK_LISTINGS: ListingType[] = [
  {
    id: '1',
    title: 'Urban Oasis Studio',
    price: 950,
    location: 'Downtown Core',
    distance: '5 mins to Subway',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stats: { views: 342, favorites: 45, inquiries: 12 }
  },
  {
    id: '2',
    title: 'Sunny Shared Apartment',
    price: 750,
    location: 'West End',
    distance: '10 mins to Transit',
    status: 'published',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1e5250ad11?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stats: { views: 128, favorites: 15, inquiries: 3 }
  },
  {
    id: '3',
    title: 'Cozy Room in Tech Hub',
    price: 1100,
    location: 'North York',
    distance: '2 mins to Station',
    status: 'draft',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    stats: { views: 0, favorites: 0, inquiries: 0 }
  }
];

const INQUIRIES = [
  { id: 1, name: 'Alex Johnson', listing: 'Urban Oasis Studio', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Sarah Smith', listing: 'Sunny Shared Apartment', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Mike Brown', listing: 'Urban Oasis Studio', avatar: 'https://i.pravatar.cc/150?u=3' },
];

export default function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState<'All' | 'Published' | 'Drafts' | 'Archived'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredListings = MOCK_LISTINGS.filter(listing => {
    const matchesTab = activeTab === 'All' || listing.status.toLowerCase() === activeTab.toLowerCase().replace('s', ''); // Handle 'Drafts' -> 'draft'
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f6f8f8] font-['Plus_Jakarta_Sans'] pb-20">
      
      {/* Top Navbar Placeholder */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SyncLiving</h1>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
              <a href="#" className="hover:text-gray-900">Discovery</a>
              <a href="#" className="text-[#00e5d1] border-b-2 border-[#00e5d1] py-5">Listings</a>
              <a href="#" className="hover:text-gray-900">Matches</a>
              <a href="#" className="hover:text-gray-900">Messages</a>
            </nav>
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Listings Management */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold text-[#101d22]">My Listings</h2>
            <Link href="/provider-dashboard/create" className="bg-[#00e5d1] hover:bg-[#00c9b7] text-[#101d22] font-semibold py-2.5 px-5 rounded-lg flex items-center transition-colors">
              <Plus size={20} className="mr-2" />
              Create New Listing
            </Link>
          </div>

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 bg-gray-50 p-1 rounded-lg w-full md:w-auto">
              {['All', 'Published', 'Drafts', 'Archived'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 md:flex-none ${
                    activeTab === tab 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search listings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00e5d1] focus:border-transparent"
              />
            </div>
          </div>

          {/* Listings Feed */}
          <div className="space-y-4">
            {filteredListings.length > 0 ? (
              filteredListings.map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">No listings found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Recent Inquiries Widget */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-[#101d22] mb-4">Recent Inquiries</h3>
            <div className="space-y-4">
              {INQUIRIES.map((inquiry) => (
                <div key={inquiry.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                  <img src={inquiry.avatar} alt={inquiry.name} className="w-10 h-10 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{inquiry.name}</p>
                    <p className="text-xs text-gray-500 truncate">For: {inquiry.listing}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    ›
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm font-semibold text-[#00e5d1] hover:text-[#00c9b7] transition-colors">
              View All Inquiries
            </button>
          </div>

          {/* Rules / Guide Widget */}
          <div className="bg-gradient-to-br from-[#00e5d1]/10 to-transparent p-6 rounded-xl border border-[#00e5d1]/20">
            <h3 className="text-lg font-bold text-[#101d22] mb-2">Standardize Rules</h3>
            <p className="text-sm text-gray-600 mb-4">
              Set default house rules to apply them instantly to your new properties and save time.
            </p>
            <button className="w-full py-2 bg-white text-gray-800 text-sm font-semibold rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
              Manage Rules
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
