'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  MessageSquare, 
  Activity, 
  Calendar, 
  Download,
  ChevronDown
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { type AdminDashboardOverview, resolveAlert, getLiveFeedData, type FeedItem } from '../../../app/admin/actions';

interface AdminDashboardProps {
  initialData: AdminDashboardOverview;
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'critical-alerts' | 'user-reports'>('critical-alerts');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    newUserReports: initialData.newUserReports,
    openAlerts: initialData.unresolvedAlerts.length
  });

  // Fetch feed items when category changes
  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true);
      try {
        const data = await getLiveFeedData(selectedCategory);
        setFeedItems(data);
      } catch (err) {
        console.error('Failed to load feed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFeed();
  }, [selectedCategory]);

  /**
   * Realtime Implementation
   * Listening for events to update the feed instantly.
   */
  useEffect(() => {
    const supabase = createClient();
    
    // Listen for admin alerts
    const alertsChannel = supabase
      .channel('admin-alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_alerts' },
        (payload) => {
          const newAlert = payload.new as any;
          if (newAlert.severity === 'high' && selectedCategory === 'critical-alerts') {
            setFeedItems((prev) => [{
              id: newAlert.id,
              displayMessage: newAlert.message,
              createdAt: newAlert.created_at,
              category: 'alert',
              severity: newAlert.severity
            }, ...prev]);
          }
          if (!newAlert.is_resolved) {
            setStats((prev) => ({ ...prev, openAlerts: prev.openAlerts + 1 }));
          }
        }
      )
      .subscribe();

    // Listen for user reports
    const reportsChannel = supabase
      .channel('user-reports-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_reports' },
        (payload) => {
          const newReport = payload.new as any;
          if (newReport.status === 'new' && selectedCategory === 'user-reports') {
            setFeedItems((prev) => [{
              id: newReport.id,
              displayMessage: newReport.reason || 'No reason provided',
              createdAt: newReport.created_at,
              category: 'report'
            }, ...prev]);
          }
          setStats((prev) => ({ ...prev, newUserReports: prev.newUserReports + 1 }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, [selectedCategory]);

  async function handleResolveAlert(id: string) {
    if (!confirm('Mark this alert as resolved?')) return;
    try {
      await resolveAlert(id);
      setFeedItems((prev) => prev.filter((a) => a.id !== id));
      if (selectedCategory === 'critical-alerts') {
        setStats((prev) => ({ ...prev, openAlerts: Math.max(prev.openAlerts - 1, 0) }));
      }
    } catch (err) {
      alert('Failed to resolve alert: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  function handleViewDetails(item: FeedItem) {
    if (item.category === 'report') {
      router.push(`/admin/reports/${item.id}`);
      return;
    }

    router.push('/admin/reports');
  }

  const severityStyles: Record<string, string> = {
    low: 'bg-blue-100 text-blue-700 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-300 animate-pulse font-bold',
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500">Real-time monitoring and security alerts</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-semibold bg-white hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={16} /> Last 24 Hours
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold hover:opacity-90 transition-all shadow-md">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="New Reports"
          value={stats.newUserReports}
          icon={<MessageSquare className="text-rose-600" />}
          badgeClass="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Open Alerts"
          value={stats.openAlerts}
          icon={<ShieldAlert className="text-orange-600" />}
          badgeClass="bg-orange-50 text-orange-600"
        />
        <StatCard
          title="System Health"
          value="N/A"
          icon={<Activity className="text-emerald-600" />}
          badgeClass="bg-emerald-50 text-emerald-600"
          change="Placeholder"
        />
      </div>

      {/* Alerts Feed */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="text-rose-500" />
            Live Alerts Feed
          </h3>
          
          <div className="relative inline-block text-left">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-10 text-sm font-bold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm cursor-pointer transition-all"
            >
              <option value="critical-alerts">Critical Alerts</option>
              <option value="user-reports">User Reports</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {isLoading ? (
            <div className="bg-white border rounded-xl p-12 text-center text-slate-400 font-medium animate-pulse">
              Loading feed data...
            </div>
          ) : feedItems.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center text-emerald-700 font-medium">
              ✓ No active {selectedCategory.replace('-', ' ')} detected.
            </div>
          ) : (
            feedItems.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white border rounded-xl p-5 flex items-start gap-4 shadow-sm transition-all hover:shadow-md ${item.severity ? severityStyles[item.severity].split(' ')[2] : 'border-slate-200'}`}
              >
                <div className={`p-3 rounded-lg shrink-0 ${item.category === 'alert' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                  {item.category === 'alert' ? <ShieldAlert size={18} /> : <MessageSquare size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-900 leading-snug break-words">{item.displayMessage}</h4>
                    {item.severity && (
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border shrink-0 ml-4 ${severityStyles[item.severity]}`}>
                        {item.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Received at {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="shrink-0 self-start flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(item)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-slate-50 transition-colors"
                  >
                    Details
                  </button>
                  {item.category === 'alert' && (
                    <button
                      onClick={() => handleResolveAlert(item.id)}
                      className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold whitespace-nowrap hover:bg-slate-800 transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon, badgeClass, change }: { title: string, value: string | number, icon: React.ReactNode, badgeClass: string, change?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">{title}</span>
        <div className={`p-2 rounded-lg ${badgeClass}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-black text-slate-900">{value}</p>
        {change && (
           <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${badgeClass}`}>
             {change}
           </span>
        )}
      </div>
    </div>
  );
}
