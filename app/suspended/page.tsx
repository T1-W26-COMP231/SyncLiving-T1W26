'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, LogOut, Clock, Ban } from 'lucide-react';
import Link from 'next/link';

export default function SuspendedPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('account_status, status_reason, suspended_until')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }
    fetchStatus();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isBanned = profile?.account_status === 'banned';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-10 text-center space-y-8">
        
        <div className={`mx-auto size-24 rounded-3xl flex items-center justify-center shadow-lg ${isBanned ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
          {isBanned ? <Ban size={48} /> : <ShieldAlert size={48} />}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {isBanned ? 'Account Banned' : 'Account Suspended'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isBanned 
              ? 'Your access to SyncLiving has been permanently revoked due to a violation of our community guidelines.' 
              : 'Your account has been temporarily suspended. Please review the details below.'}
          </p>
        </div>

        {profile?.status_reason && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Reason provided by Admin</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 italic">"{profile.status_reason}"</p>
          </div>
        )}

        {!isBanned && profile?.suspended_until && (
          <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
            <Clock size={18} />
            <span>Suspension ends: {new Date(profile.suspended_until).toLocaleDateString()}</span>
          </div>
        )}

        <div className="pt-4 flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <LogOut size={18} />
            Sign Out
          </button>
          
          <Link 
            href="mailto:support@syncliving.com"
            className="text-sm text-slate-400 hover:text-primary transition-colors font-medium"
          >
            Contact Support if you believe this is a mistake
          </Link>
        </div>
      </div>
      
      <p className="mt-8 text-xs text-slate-400 font-medium">SyncLiving Security System</p>
    </div>
  );
}
