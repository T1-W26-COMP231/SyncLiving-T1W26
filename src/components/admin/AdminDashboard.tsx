'use client';

import React, { useState } from 'react';
import {
  Users,
  Flag,
  Ticket,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  Download,
  Calendar,
  Megaphone,
  BarChart2,
  UserCog,
  Database,
} from 'lucide-react';

// ─── Stat card data ─────────────────────────────────────────────────────────
const STATS = [
  {
    label: 'Total Users',
    value: '12,840',
    change: '+2.5%',
    trend: 'up',
    icon: <Users className="w-5 h-5 text-emerald-600" />,
    badgeClass: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Flagged Reports',
    value: '24',
    change: '-12%',
    trend: 'down',
    icon: <Flag className="w-5 h-5 text-rose-600" />,
    badgeClass: 'bg-rose-100 text-rose-600',
  },
  {
    label: 'Active Tickets',
    value: '156',
    change: '-5%',
    trend: 'down',
    icon: <Ticket className="w-5 h-5 text-amber-600" />,
    badgeClass: 'bg-rose-100 text-rose-600',
  },
  {
    label: 'System Health',
    value: '99.9%',
    change: 'Stable',
    trend: 'stable',
    icon: <Activity className="w-5 h-5 text-slate-600" />,
    badgeClass: 'bg-slate-100 text-slate-600',
  },
];

// ─── Recent reports mock data ────────────────────────────────────────────────
interface ReportRow {
  user: string;
  type: string;
  date: string;
  status: 'Pending' | 'Resolved' | 'Investigating';
}

const RECENT_REPORTS: ReportRow[] = [
  { user: 'Sarah Jenkins', type: 'Harassment', date: 'Oct 24, 2023', status: 'Pending' },
  { user: 'Michael Chen', type: 'Spam Content', date: 'Oct 24, 2023', status: 'Resolved' },
  { user: 'David Miller', type: 'Account Theft', date: 'Oct 23, 2023', status: 'Investigating' },
  { user: 'Emma Wilson', type: 'Inappropriate Media', date: 'Oct 23, 2023', status: 'Resolved' },
];

// ─── Status badge helper ─────────────────────────────────────────────────────
const STATUS_CLASSES: Record<ReportRow['status'], string> = {
  Pending: 'bg-amber-100 text-amber-600',
  Resolved: 'bg-emerald-100 text-emerald-600',
  Investigating: 'bg-rose-100 text-rose-600',
};

// ─── User growth chart data (simple CSS bars) ────────────────────────────────
const CHART_DATA = [
  { month: 'May', value: 55 },
  { month: 'Jun', value: 65 },
  { month: 'Jul', value: 60 },
  { month: 'Aug', value: 75 },
  { month: 'Sep', value: 85 },
  { month: 'Oct', value: 100 },
];

// ─── System activity entries ─────────────────────────────────────────────────
const SYSTEM_ACTIVITY = [
  { text: 'API v2.4 Deployment', sub: 'Completed 2 hours ago', done: true },
  { text: 'New Security Patch', sub: 'Scheduled for 11 PM UTC', done: true },
  { text: 'Daily Report Generated', sub: 'Sent to stakeholders', done: false },
];

// ─── Quick actions ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: <Megaphone className="w-5 h-5" />, label: 'Publish Announcement' },
  { icon: <BarChart2 className="w-5 h-5" />, label: 'View Global Stats' },
  { icon: <UserCog className="w-5 h-5" />, label: 'Manage Roles' },
  { icon: <Database className="w-5 h-5" />, label: 'Backup Database' },
];

export default function AdminDashboard() {
  const [dismissedCritical, setDismissedCritical] = useState(false);
  const [dismissedHigh, setDismissedHigh] = useState(false);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500">Real-time system monitoring and management</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-full text-sm font-semibold bg-white shadow-sm hover:bg-slate-50 transition-colors">
            <Calendar className="w-4 h-4" />
            Last 24 Hours
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-admin-primary text-white rounded-full text-sm font-bold shadow-lg shadow-admin-primary/20 hover:opacity-90 transition-all">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{stat.label}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-xl ${stat.badgeClass}`}>
                {stat.trend === 'up' ? (
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{stat.change}</span>
                ) : stat.trend === 'down' ? (
                  <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" />{stat.change}</span>
                ) : (
                  stat.change
                )}
              </span>
            </div>
            <p className="text-3xl font-black">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-admin-primary" />
          User Growth (Last 6 Months)
        </h3>
        <div className="flex items-end gap-3 h-36">
          {CHART_DATA.map((item) => (
            <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                <div
                  className="w-full bg-admin-primary rounded-t-md transition-all duration-500 hover:opacity-80"
                  style={{ height: `${item.value}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 font-medium">{item.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Priority Alerts + Recent Reports */}
        <div className="lg:col-span-2 space-y-8">
          {/* Priority Alerts */}
          <section>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Priority Alerts
            </h3>
            <div className="space-y-4">
              {!dismissedCritical && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-rose-900">Server Latency Spike: Region US-East</h4>
                      <span className="text-xs font-bold px-2 py-1 bg-rose-200 text-rose-700 rounded-xl ml-2 shrink-0">
                        CRITICAL
                      </span>
                    </div>
                    <p className="text-sm text-rose-800/80 mt-1">
                      Region US-East experiencing over 200ms delay affecting 15% of active users. Automatic load balancing initiated.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-xs font-bold hover:bg-rose-700 transition-colors">
                        Investigate
                      </button>
                      <button
                        onClick={() => setDismissedCritical(true)}
                        className="px-4 py-1.5 border border-rose-300 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!dismissedHigh && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
                  <div className="size-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-amber-900">Security: Unusual Login Pattern</h4>
                      <span className="text-xs font-bold px-2 py-1 bg-amber-200 text-amber-700 rounded-xl ml-2 shrink-0">
                        HIGH
                      </span>
                    </div>
                    <p className="text-sm text-amber-800/80 mt-1">
                      Detected 50+ failed login attempts within 2 minutes from unique IPs in the Stockholm region.
                    </p>
                    <div className="mt-4 flex gap-3">
                      <button className="px-4 py-1.5 bg-amber-600 text-white rounded-full text-xs font-bold hover:bg-amber-700 transition-colors">
                        Review Logs
                      </button>
                      <button
                        onClick={() => setDismissedHigh(true)}
                        className="px-4 py-1.5 border border-amber-300 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {dismissedCritical && dismissedHigh && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center text-emerald-600 font-medium text-sm">
                  ✓ All alerts cleared. System is operating normally.
                </div>
              )}
            </div>
          </section>

          {/* Recent Reports Table */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Recent Reports</h3>
              <a href="/admin/reports" className="text-sm font-bold hover:underline text-admin-primary">
                View All
              </a>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RECENT_REPORTS.map((row) => (
                    <tr key={row.user + row.date} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold">
                            {row.user[0]}
                          </div>
                          <span className="text-sm font-semibold">{row.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{row.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{row.date}</td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${STATUS_CLASSES[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right: Quick Actions + System Activity */}
        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-admin-primary hover:text-white transition-all group"
                >
                  <span className="text-admin-primary group-hover:text-white transition-colors">
                    {action.icon}
                  </span>
                  <span className="text-sm font-bold">{action.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold mb-4">System Activity</h3>
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <div className="space-y-6">
                {SYSTEM_ACTIVITY.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="relative shrink-0">
                      <div
                        className={`size-2 rounded-full mt-1.5 ${item.done ? 'bg-admin-primary' : 'bg-slate-300'}`}
                      />
                      {idx < SYSTEM_ACTIVITY.length - 1 && (
                        <div className="absolute top-4 left-[3px] w-[1px] h-full bg-slate-200" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.text}</p>
                      <p className="text-xs text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
