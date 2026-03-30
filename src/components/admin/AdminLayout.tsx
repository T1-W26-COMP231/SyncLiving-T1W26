'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu, X } from 'lucide-react';
import SyncLivingLogo from '@/components/ui/SyncLivingLogo';

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',       href: '/admin/dashboard' },
  { label: 'Users',           href: '/admin/users'     },
  { label: 'Safety & Reports',href: '/admin/reports'   },
  { label: 'Support',         href: '/admin/support'   },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">

      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">

          {/* Logo + Admin badge */}
          <div className="flex items-center gap-3 shrink-0">
            <SyncLivingLogo size="md" href="/admin/dashboard" accentColor="text-admin-primary" />
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-admin-primary/15 text-admin-primary border border-admin-primary/30">
              Admin
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {NAV_ITEMS.map(({ label, href }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-2 px-1 text-sm font-bold transition-colors ${
                    isActive ? 'text-admin-primary' : 'text-slate-500 hover:text-foreground'
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
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

            {/* Admin avatar */}
            <div className="size-9 rounded-full bg-admin-primary/20 flex items-center justify-center font-extrabold text-admin-primary text-xs border border-admin-primary/30 cursor-default select-none">
              AD
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => setMobileOpen(prev => !prev)}
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
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-admin-primary/10 text-admin-primary font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
