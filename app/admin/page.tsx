'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { searchUsers, getUserFullDetails, updateUserStatus } from './actions';
import { Search, Home, Link as LinkIcon, Star, ShieldCheck, Mail, Calendar, MapPin, AlertCircle, CheckCircle2, Ban, Clock } from 'lucide-react';

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Local state for status updates
  const [statusReason, setStatusReason] = useState('');
  const [suspendDays, setSuspendDays] = useState('7');

  // Handle Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle User Selection
  useEffect(() => {
    if (selectedUserId) {
      setLoading(true);
      getUserFullDetails(selectedUserId).then(details => {
        setUserDetails(details);
        setLoading(false);
      });
    }
  }, [selectedUserId]);

  const handleStatusChange = async (status: 'active' | 'suspended' | 'banned') => {
    if (!selectedUserId) return;
    
    setUpdating(true);
    try {
      let suspendedUntil = undefined;
      if (status === 'suspended') {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(suspendDays));
        suspendedUntil = date.toISOString();
      }

      const updatedProfile = await updateUserStatus(
        selectedUserId, 
        status, 
        statusReason, 
        suspendedUntil
      );

      // Refresh local data
      setUserDetails({
        ...userDetails,
        profile: {
          ...userDetails.profile,
          account_status: updatedProfile.account_status,
          status_reason: updatedProfile.status_reason,
          suspended_until: updatedProfile.suspended_until
        }
      });
      
      setStatusReason('');
      alert(`Account status updated to ${status}`);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-500/10';
      case 'suspended': return 'text-amber-500 bg-amber-500/10';
      case 'banned': return 'text-red-500 bg-red-500/10';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-white dark:bg-slate-950 dark:text-white font-sans">
      <Navbar activeTab="Admin" />

      <main className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar */}
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-primary" size={24} />
              Admin Console
            </h2>
          </div>

          {/* Search Section */}
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-white border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/30 outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-250px)]">
              {searching ? (
                <div className="p-4 text-center text-xs text-slate-400 animate-pulse">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
                      selectedUserId === user.id
                        ? 'bg-primary/10 border-primary/20'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`}
                      className="size-10 rounded-full object-cover"
                      alt=""
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.full_name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">{user.role || 'User'}</span>
                    </div>
                  </button>
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="p-4 text-center text-xs text-slate-400">No users found.</div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic">Enter at least 2 characters to search.</div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto p-8 lg:p-12">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : userDetails ? (
            <div className="max-w-5xl mx-auto space-y-10">

              {/* Profile Header */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-8 items-start">
                <img
                  src={userDetails.profile.avatar_url || `https://ui-avatars.com/api/?name=${userDetails.profile.full_name}`}
                  className="size-32 rounded-3xl object-cover shadow-lg"
                  alt=""
                />
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white">{userDetails.profile.full_name}</h1>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Mail size={14} /> {userDetails.profile.email || 'No email available'}
                      </p>
                    </div>
                    <div className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                      {userDetails.profile.role}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Age</span>
                      <span className="font-bold dark:text-white">{userDetails.profile.age || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Gender</span>
                      <span className="font-bold dark:text-white">{userDetails.profile.preferred_gender || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Budget</span>
                      <span className="font-bold dark:text-white">${userDetails.profile.budget_min}-${userDetails.profile.budget_max}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Move-in</span>
                      <span className="font-bold dark:text-white">{userDetails.profile.move_in_date || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Management Section */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black flex items-center gap-2 dark:text-white">
                      <ShieldCheck className="text-primary" size={20} />
                      Account Management
                    </h3>
                    <p className="text-sm text-slate-500">Control user access and manage account lifecycle.</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${getStatusColor(userDetails.profile.account_status)}`}>
                    {userDetails.profile.account_status === 'active' && <CheckCircle2 size={16} />}
                    {userDetails.profile.account_status === 'suspended' && <Clock size={16} />}
                    {userDetails.profile.account_status === 'banned' && <Ban size={16} />}
                    <span className="uppercase tracking-wider">{userDetails.profile.account_status}</span>
                  </div>
                </div>

                {userDetails.profile.account_status !== 'active' && (
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                    <div className="space-y-1">
                      <p className="text-sm font-bold dark:text-white">Status Information</p>
                      <p className="text-xs text-slate-500">
                        Reason: <span className="text-slate-700 dark:text-slate-300 italic">&quot;{userDetails.profile.status_reason || 'No reason provided'}&quot;</span>
                      </p>
                      {userDetails.profile.account_status === 'suspended' && userDetails.profile.suspended_until && (
                        <p className="text-xs text-slate-500">
                          Suspended until: <span className="font-bold">{new Date(userDetails.profile.suspended_until).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Reason for Change</label>
                    <textarea
                      placeholder="Enter reason for suspension or ban..."
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm min-h-[100px] outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Suspension Period (Days)</label>
                      <input
                        type="number"
                        value={suspendDays}
                        onChange={(e) => setSuspendDays(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleStatusChange('active')}
                        disabled={updating || userDetails.profile.account_status === 'active'}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-green-500 text-white font-bold text-xs gap-2 hover:bg-green-600 transition-colors disabled:opacity-20"
                      >
                        <CheckCircle2 size={20} />
                        Restore
                      </button>
                      <button
                        onClick={() => handleStatusChange('suspended')}
                        disabled={updating || userDetails.profile.account_status === 'suspended'}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500 text-white font-bold text-xs gap-2 hover:bg-amber-600 transition-colors disabled:opacity-20"
                      >
                        <Clock size={20} />
                        Suspend
                      </button>
                      <button
                        onClick={() => handleStatusChange('banned')}
                        disabled={updating || userDetails.profile.account_status === 'banned'}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-red-500 text-white font-bold text-xs gap-2 hover:bg-red-600 transition-colors disabled:opacity-20"
                      >
                        <Ban size={20} />
                        Ban User
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Listings Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black flex items-center gap-2 dark:text-white">
                    <Home className="text-primary" size={20} />
                    Room Listings ({userDetails.listings.length})
                  </h3>
                  <div className="grid gap-3">
                    {userDetails.listings.map((l: any) => (
                      <div key={l.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm truncate dark:text-white">{l.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin size={10} /> {l.address}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-bold text-sm">${l.rental_fee}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{l.status}</p>
                        </div>
                      </div>
                    ))}
                    {userDetails.listings.length === 0 && <p className="text-sm text-slate-400 italic">No listings found.</p>}
                  </div>
                </div>

                {/* Connections Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black flex items-center gap-2 dark:text-white">
                    <LinkIcon className="text-blue-500" size={20} />
                    Connections ({userDetails.connections.length})
                  </h3>
                  <div className="grid gap-3">
                    {userDetails.connections.map((c: any) => {
                      const otherUser = c.user_1_id === selectedUserId ? c.profiles_2 : c.profiles_1;
                      return (
                        <div key={c.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500" />
                            <span className="font-bold text-sm dark:text-white">{otherUser.full_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{c.connection_type}</p>
                            <p className="text-[10px] text-blue-500 font-bold uppercase">{c.status}</p>
                          </div>
                        </div>
                      );
                    })}
                    {userDetails.connections.length === 0 && <p className="text-sm text-slate-400 italic">No connections found.</p>}
                  </div>
                </div>

                {/* Reviews Received Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black flex items-center gap-2 dark:text-white">
                    <Star className="text-amber-500" size={20} />
                    Reviews Received ({userDetails.reviewsReceived.length})
                  </h3>
                  <div className="grid gap-3">
                    {userDetails.reviewsReceived.map((r: any) => (
                      <div key={r.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">From: {r.reviewer?.full_name}</span>
                          <span className="text-xs font-black text-amber-500">★ {r.average_score}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">{r.overall_comment}</p>
                      </div>
                    ))}
                    {userDetails.reviewsReceived.length === 0 && <p className="text-sm text-slate-400 italic">No reviews received.</p>}
                  </div>
                </div>

                {/* Reviews Given Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-black flex items-center gap-2 dark:text-white">
                    <Calendar className="text-slate-400" size={20} />
                    Reviews Given ({userDetails.reviewsGiven.length})
                  </h3>
                  <div className="grid gap-3">
                    {userDetails.reviewsGiven.map((r: any) => (
                      <div key={r.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">To: {r.reviewee?.full_name}</span>
                          <span className="text-xs font-black text-amber-500">★ {r.average_score}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">{r.overall_comment}</p>
                      </div>
                    ))}
                    {userDetails.reviewsGiven.length === 0 && <p className="text-sm text-slate-400 italic">No reviews given.</p>}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-10 gap-6 opacity-40">
              <ShieldCheck size={80} className="text-slate-300" />
              <div className="max-w-md space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">SyncLiving Admin</h3>
                <p className="text-slate-500 dark:text-slate-400">Select an account from the sidebar to view detailed system information, listings, and connections.</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
