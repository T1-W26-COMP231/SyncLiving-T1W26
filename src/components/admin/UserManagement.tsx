'use client';

import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  Filter,
  UserPlus,
  MoreVertical,
  Eye,
  Ban,
  Gavel,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
type UserRole = 'Seeker' | 'Provider';
type UserStatus = 'Active' | 'Suspended' | 'Banned';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  activityScore: number;
  avatarInitials: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Sarah Jenkins', email: 'sarah.j@example.com', role: 'Seeker', status: 'Active', activityScore: 92, avatarInitials: 'SJ' },
  { id: '2', name: 'Marcus Chen', email: 'm.chen@provider.net', role: 'Provider', status: 'Suspended', activityScore: 34, avatarInitials: 'MC' },
  { id: '3', name: 'Robert Fox', email: 'rfox@studio.com', role: 'Seeker', status: 'Active', activityScore: 78, avatarInitials: 'RF' },
  { id: '4', name: 'Diane Richards', email: 'diane@webmail.co', role: 'Provider', status: 'Banned', activityScore: 12, avatarInitials: 'DR' },
  { id: '5', name: 'James Park', email: 'james.p@home.io', role: 'Seeker', status: 'Active', activityScore: 88, avatarInitials: 'JP' },
  { id: '6', name: 'Priya Nair', email: 'priya@rooms.net', role: 'Provider', status: 'Active', activityScore: 95, avatarInitials: 'PN' },
  { id: '7', name: 'Carlos Rivera', email: 'crivera@sync.co', role: 'Seeker', status: 'Active', activityScore: 61, avatarInitials: 'CR' },
  { id: '8', name: 'Yuki Tanaka', email: 'yuki.t@mail.jp', role: 'Provider', status: 'Suspended', activityScore: 22, avatarInitials: 'YT' },
];

// ─── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<UserStatus, string> = {
  Active: 'text-emerald-600',
  Suspended: 'text-rose-600',
  Banned: 'text-slate-400',
};

const STATUS_DOT: Record<UserStatus, string> = {
  Active: 'bg-emerald-500 animate-pulse',
  Suspended: 'bg-rose-500',
  Banned: 'bg-slate-300',
};

const SCORE_BAR: Record<UserStatus, string> = {
  Active: 'bg-admin-primary',
  Suspended: 'bg-rose-500',
  Banned: 'bg-slate-400',
};

// ─── Role badge styles ────────────────────────────────────────────────────────
const ROLE_STYLES: Record<UserRole, string> = {
  Seeker: 'bg-blue-100 text-blue-600',
  Provider: 'bg-amber-100 text-amber-600',
};

const PAGE_SIZE = 5;

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All Roles'>('All Roles');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);

  // Filter users
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    const matchesRole = roleFilter === 'All Roles' || u.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleAction(userId: string, action: 'suspend' | 'ban' | 'activate') {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        if (action === 'suspend') return { ...u, status: 'Suspended' };
        if (action === 'ban') return { ...u, status: 'Banned' };
        if (action === 'activate') return { ...u, status: 'Active' };
        return u;
      })
    );
    setOpenMenuId(null);
  }

  return (
    <div className="p-6 md:p-8 max-w-[1440px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-slate-500">Search, monitor, and moderate SyncLiving ecosystem participants.</p>
        </div>
        <button className="bg-admin-primary hover:opacity-90 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-admin-primary/20">
          <UserPlus className="w-5 h-5" />
          Add New User
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          {/* Search input */}
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-admin-primary text-foreground placeholder:text-slate-400 focus:outline-none"
              placeholder="Search by name, email, or user ID..."
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as UserStatus | 'All'); setCurrentPage(1); }}
                className="appearance-none flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-admin-primary transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-admin-primary/30 pr-8 cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="Active">Status: Active</option>
                <option value="Suspended">Status: Suspended</option>
                <option value="Banned">Status: Banned</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value as UserRole | 'All Roles'); setCurrentPage(1); }}
                className="appearance-none flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-admin-primary transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-admin-primary/30 pr-8 cursor-pointer"
              >
                <option value="All Roles">Role: All Roles</option>
                <option value="Seeker">Role: Seeker</option>
                <option value="Provider">Role: Provider</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-admin-primary/10 text-admin-primary rounded-full font-bold hover:bg-admin-primary/20 transition-colors">
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        <div className="flex flex-wrap gap-2">
          {statusFilter !== 'All' && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-2">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('All')} className="hover:text-admin-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {roleFilter !== 'All Roles' && (
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-2">
              Role: {roleFilter}
              <button onClick={() => setRoleFilter('All Roles')} className="hover:text-admin-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {(statusFilter !== 'All' || roleFilter !== 'All Roles') && (
            <button
              onClick={() => { setStatusFilter('All'); setRoleFilter('All Roles'); }}
              className="text-xs text-admin-primary font-bold ml-2 hover:opacity-80"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Activity Score</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                    No users match your current filters.
                  </td>
                </tr>
              ) : (
                pageUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-admin-primary/5 transition-colors cursor-pointer relative"
                    onClick={() => setOpenMenuId(null)}
                  >
                    {/* User Profile */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-admin-primary/20 flex items-center justify-center text-admin-primary text-xs font-bold border-2 border-admin-primary/10 overflow-hidden">
                          {user.avatarInitials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.name}</span>
                          <span className="text-sm text-slate-500">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-xl uppercase ${ROLE_STYLES[user.role]}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 font-semibold text-sm ${STATUS_STYLES[user.status]}`}>
                        <span className={`size-2 rounded-full ${STATUS_DOT[user.status]}`} />
                        {user.status}
                      </span>
                    </td>

                    {/* Activity Score */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${SCORE_BAR[user.status]}`}
                            style={{ width: `${user.activityScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{user.activityScore}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right relative">
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user.id ? null : user.id);
                          }}
                          className="p-2 text-slate-400 hover:text-admin-primary rounded-xl hover:bg-slate-50 transition-colors"
                          aria-label="User actions"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openMenuId === user.id && (
                          <div
                            className="absolute right-0 top-10 z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700">
                                <Eye className="w-4 h-4" /> View Activity
                              </button>
                              {user.status !== 'Suspended' ? (
                                <button
                                  onClick={() => handleAction(user.id, 'suspend')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-amber-600"
                                >
                                  <Ban className="w-4 h-4" /> Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleAction(user.id, 'activate')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-emerald-600"
                                >
                                  <Eye className="w-4 h-4" /> Reactivate
                                </button>
                              )}
                              {user.status !== 'Banned' && (
                                <button
                                  onClick={() => handleAction(user.id, 'ban')}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-rose-600"
                                >
                                  <Gavel className="w-4 h-4" /> Ban User
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {pageUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1} to{' '}
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} users
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`size-8 rounded-xl text-sm font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-admin-primary text-white font-bold'
                    : 'hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
