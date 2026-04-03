"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Filter,
  UserPlus,
  Eye,
  Ban,
  Gavel,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────
type UserRole = "Seeker" | "Provider";
type UserStatus = "Active" | "Suspended" | "Banned";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  activityScore: number;
  avatarInitials: string;
  joinedDate?: string;
}

// ─── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<UserStatus, string> = {
  Active: "text-emerald-600",
  Suspended: "text-rose-600",
  Banned: "text-slate-400",
};

const STATUS_DOT: Record<UserStatus, string> = {
  Active: "bg-emerald-500 animate-pulse",
  Suspended: "bg-rose-500",
  Banned: "bg-slate-300",
};

// ─── Role badge styles ────────────────────────────────────────────────────────
const ROLE_STYLES: Record<UserRole, string> = {
  Seeker: "bg-blue-100 text-blue-600",
  Provider: "bg-amber-100 text-amber-600",
};

const PAGE_SIZE = 10;

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "All">("All");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All Roles">(
    "All Roles",
  );
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();

    // Close menu when clicking anywhere else
    const handleGlobalClick = () => setOpenMenuId(null);
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedUsers: AdminUser[] = (data || []).map((profile) => ({
        id: profile.id,
        name: profile.full_name || "Anonymous User",
        email: profile.email || "No Email",
        role: profile.role === "provider" ? "Provider" : "Seeker",
        status: (profile.account_status
          ? profile.account_status.charAt(0).toUpperCase() +
            profile.account_status.slice(1)
          : "Active") as UserStatus,
        activityScore: 100, // Default for now
        avatarInitials: (profile.full_name || "A U")
          .split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        joinedDate: profile.created_at
          ? new Date(profile.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })
          : "N/A",
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filter users
  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    const matchesRole = roleFilter === "All Roles" || u.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageUsers = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  async function handleAction(
    userId: string,
    action: "suspend" | "ban" | "activate",
  ) {
    const statusMap: Record<
      "suspend" | "ban" | "activate",
      "active" | "suspended" | "banned"
    > = {
      suspend: "suspended",
      ban: "banned",
      activate: "active",
    };

    const newStatus = statusMap[action];

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const statusLabel = (newStatus.charAt(0).toUpperCase() +
            newStatus.slice(1)) as UserStatus;
          return { ...u, status: statusLabel };
        }),
      );
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status");
    }
    setOpenMenuId(null);
  }

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-slate-500">
            Search, monitor, and moderate SyncLiving ecosystem participants.
          </p>
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
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-admin-primary text-foreground placeholder:text-slate-400 focus:outline-none"
              placeholder="Search by name, email, or user ID..."
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as UserStatus | "All");
                  setCurrentPage(1);
                }}
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
                onChange={(e) => {
                  setRoleFilter(e.target.value as UserRole | "All Roles");
                  setCurrentPage(1);
                }}
                className="appearance-none flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-admin-primary transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-admin-primary/30 pr-8 cursor-pointer"
              >
                <option value="All Roles">Role: All Roles</option>
                <option value="Seeker">Role: Seeker</option>
                <option value="Provider">Role: Provider</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 px-4 py-2.5 bg-admin-primary/10 text-admin-primary rounded-full font-bold hover:bg-admin-primary/20 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 text-admin-primary animate-spin" />
          <p className="text-slate-400 font-medium">Loading participants...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      User Profile
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-slate-400 text-sm"
                      >
                        No users match your current filters.
                      </td>
                    </tr>
                  ) : (
                    pageUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        {/* User Profile */}
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="flex items-center gap-3 group cursor-pointer"
                          >
                            <div className="size-10 rounded-full bg-admin-primary/20 flex items-center justify-center text-admin-primary text-xs font-bold border-2 border-admin-primary/10 overflow-hidden group-hover:bg-admin-primary/30 group-hover:scale-105 transition-all">
                              {user.avatarInitials}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold truncate max-w-[150px] group-hover:text-admin-primary transition-colors">
                                {user.name}
                              </span>
                              <span className="text-xs text-slate-500 truncate max-w-[150px]">
                                {user.email}
                              </span>
                            </div>
                          </Link>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase ${ROLE_STYLES[user.role]}`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`flex items-center gap-1.5 font-semibold text-xs ${STATUS_STYLES[user.status]}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${STATUS_DOT[user.status]}`}
                            />
                            {user.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right relative">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                setOpenMenuId(
                                  openMenuId === user.id ? null : user.id,
                                );
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-admin-primary bg-slate-50 hover:bg-white border border-slate-200 rounded-lg transition-colors uppercase tracking-wider"
                            >
                              Actions
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${openMenuId === user.id ? "rotate-180" : ""}`}
                              />
                            </button>

                            {openMenuId === user.id && (
                              <div
                                className="absolute right-0 top-10 z-50 w-48 bg-white rounded-xl shadow-xl border border-slate-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  <Link
                                    href={`/admin/users/${user.id}`}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                                  >
                                    <Eye className="w-4 h-4" /> View Details
                                  </Link>
                                  {user.status !== "Suspended" ? (
                                    <button
                                      onClick={() =>
                                        handleAction(user.id, "suspend")
                                      }
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-amber-600"
                                    >
                                      <Ban className="w-4 h-4" /> Suspend
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleAction(user.id, "activate")
                                      }
                                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 text-emerald-600"
                                    >
                                      <Eye className="w-4 h-4" /> Reactivate
                                    </button>
                                  )}
                                  {user.status !== "Banned" && (
                                    <button
                                      onClick={() =>
                                        handleAction(user.id, "ban")
                                      }
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-600">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
