"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Receipt, ArrowRight, ShieldCheck, User } from "lucide-react";
import { getActiveNetworkConfig } from "@/config/arc";

export function Navbar() {
  const { user, profile } = useAuth();
  const network = getActiveNetworkConfig();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-900 text-lg leading-tight">
                ArcInvoice
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Circle Arc USDC Invoicing
              </span>
            </div>
          </Link>

          {/* Network pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{network.chainName} ({network.chainId})</span>
          </div>
        </div>

        {/* Navigation links & actions */}
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/invoices">
                <Button variant="ghost" size="sm">
                  Invoices
                </Button>
              </Link>
              <Link href="/invoices/new">
                <Button size="sm" className="hidden sm:inline-flex">
                  New Invoice
                </Button>
              </Link>
              <Link href="/settings">
                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                  <User className="h-4 w-4" />
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Connect Wallet
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="gap-1.5 shadow-sm">
                  <span>Enter App</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
