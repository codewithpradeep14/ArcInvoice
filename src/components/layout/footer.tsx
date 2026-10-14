import React from "react";
import Link from "next/link";
import { Receipt, ExternalLink, ShieldCheck } from "lucide-react";
import { getActiveNetworkConfig } from "@/config/arc";

export function Footer() {
  const network = getActiveNetworkConfig();

  return (
    <footer className="border-t border-slate-200 bg-white no-print">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Brand & info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white">
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold text-slate-900 text-sm">
                ArcInvoice
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Non-custodial, stablecoin invoicing application for freelancers and agencies. Direct USDC settlements verified on Circle Arc.
            </p>
          </div>

          {/* Network details */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Target: <strong>{network.chainName}</strong> (Chain ID {network.chainId})</span>
            </div>
            <a
              href={network.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              <span>Block Explorer</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://docs.arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900"
            >
              <span>Arc Docs</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} ArcInvoice. Built for Circle Arc Mainnet.</p>
          <div className="flex gap-4">
            <Link href="/api/health" className="hover:text-slate-600">
              API Health
            </Link>
            <span>•</span>
            <span>USDC Native Gas Layer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
