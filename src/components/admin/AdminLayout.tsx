"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, X, ChevronDown, LogOut } from "lucide-react";
import SyncLivingLogo from "@/components/ui/SyncLivingLogo";
import { logout } from "../../../app/auth/actions";
import { createClient } from "@/utils/supabase/client";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Users", href: "/admin/users" },
  { label: "Safety & Reports", href: "/admin/reports" },
  { label: "Support", href: "/admin/support" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setAdminName(
          profile?.full_name || user.email?.split("@")[0] || "Admin",
        );
      }
    };
    fetchAdmin();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Logo + Admin badge */}
          <div className="flex items-center gap-3 shrink-0">
            <SyncLivingLogo
              size="md"
              href="/admin/dashboard"
              accentColor="text-admin-primary"
            />
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-admin-primary/15 text-admin-primary border border-admin-primary/30">
              Admin
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {NAV_ITEMS.map(({ label, href }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-2 px-1 text-sm font-bold transition-colors ${
                    isActive
                      ? "text-admin-primary"
                      : "text-slate-500 hover:text-foreground"
                  }`}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-admin-primary rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={15}
              />
              <input
                type="text"
                placeholder="Quick search..."
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-admin-primary/30 w-48 outline-none transition-all"
              />
            </div>

            {/* Notifications */}
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* User menu (Avatar + Dropdown) */}
            <div
              className="relative pl-4 border-l border-slate-200"
              ref={dropdownRef}
            >
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="size-9 rounded-full bg-admin-primary/20 flex items-center justify-center font-extrabold text-admin-primary text-xs border border-admin-primary/30 shadow-sm">
                  {adminName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-admin-primary transition-colors">
                    {adminName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tight">
                    System Admin
                  </p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 group-hover:text-slate-800 transition-all ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {adminName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Administrator Access
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut size={15} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-1 z-40">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-admin-primary/10 text-admin-primary font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
