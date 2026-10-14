"use client";

import React, { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Receipt,
  LayoutDashboard,
  FilePlus2,
  FileText,
  History,
  Settings,
  LogOut,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { cn, shortenAddress } from "@/lib/utils";
import { getActiveNetworkConfig } from "@/config/arc";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const { user, profile, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const network = getActiveNetworkConfig();

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-medium text-slate-500">Loading ArcInvoice...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoices", label: "Invoices", icon: FileText },
    { href: "/invoices/new", label: "Create Invoice", icon: FilePlus2 },
    { href: "/payments", label: "Payment History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <Receipt className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-slate-900 text-base">
              ArcInvoice
            </span>
            <span className="block text-[10px] font-medium text-slate-400">
              Arc Mainnet MVP
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.business_name || profile?.full_name || user.email}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          {profile?.default_wallet_address && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
              <Wallet className="h-3 w-3 text-slate-400" />
              <span className="truncate">{shortenAddress(profile.default_wallet_address)}</span>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isActive ? "text-blue-600" : "text-slate-400"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Network & Signout */}
        <div className="border-t border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{network.chainName}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">ID:{network.chainId}</span>
          </div>

          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden">
        {/* Mobile Header */}
        <div className="flex md:hidden h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600 text-white">
              <Receipt className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 text-sm">ArcInvoice</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded font-medium"
            >
              + Invoice
            </Link>
            <button
              onClick={signOut}
              className="p-1.5 text-slate-500 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden border-b border-slate-200 bg-slate-50 overflow-x-auto px-2 py-1 gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded text-xs whitespace-nowrap font-medium",
                  isActive
                    ? "bg-white text-blue-700 shadow-subtle border border-slate-200"
                    : "text-slate-600"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
