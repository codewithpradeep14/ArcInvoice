"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  QrCode,
  Wallet,
  Coins,
  ArrowUpRight,
  FileCheck2,
} from "lucide-react";
import { getActiveNetworkConfig } from "@/config/arc";

export default function LandingPage() {
  const network = getActiveNetworkConfig();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headline & Value Prop */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span>Circle Arc Mainnet Native USDC Invoicing</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                  Stablecoin invoicing for modern builders & agencies.
                </h1>

                <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                  Bill clients in USDC, share clean payment links, and settle directly to your non-custodial wallet on Circle's Arc blockchain with automated on-chain verification.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <Link href="/login">
                    <Button size="lg" className="gap-2 w-full sm:w-auto shadow-md">
                      <span>Connect Wallet & Create Invoice</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pay/ARC-DEMO-2026">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      View Demo Invoice
                    </Button>
                  </Link>
                </div>

                {/* Network & Security Trust Badges */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Independent RPC Verification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-blue-600" />
                    <span>USDC Native Gas Layer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-700" />
                    <span>Non-Custodial Direct Settlement</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Realistic Interactive Invoice Card Preview */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        <Receipt className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">
                          Apex Studio Inc.
                        </p>
                        <p className="text-[11px] text-slate-400">ARC-2026-F89A</p>
                      </div>
                    </div>
                    <Badge status="pending">Unpaid</Badge>
                  </div>

                  {/* Amount Callout */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-4 space-y-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Amount Due
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-slate-900">
                        $2,500.00
                      </span>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        USDC on Arc
                      </span>
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Client:</span>
                      <span className="font-medium text-slate-900">Meridian Labs</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Description:</span>
                      <span className="font-medium text-slate-900">Q4 Smart Contract Audit</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Due Date:</span>
                      <span className="font-medium text-slate-900">Nov 04, 2026</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Network:</span>
                      <span className="font-medium text-emerald-700">Circle Arc ({network.chainName})</span>
                    </div>
                  </div>

                  {/* Payment Button Simulation */}
                  <div className="pt-2">
                    <div className="w-full bg-blue-600 text-white rounded-md py-3 text-center text-sm font-semibold shadow-sm flex items-center justify-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span>Connect Wallet & Pay 2,500 USDC</span>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                      Zero intermediaries. Settles in seconds directly to your wallet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                End-To-End Invoicing Flow
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Designed for non-technical clients to pay seamlessly
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                ArcInvoice bridges standard business operations with instant on-chain settlement on Circle Arc.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Create in Seconds
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your client name, milestone description, amount in USDC, and destination address. ArcInvoice generates a unique public invoice link and QR code.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Client Approves in Wallet
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your client opens the link, connects MetaMask, Zerion, or any EVM wallet, and signs the standard USDC transfer on Circle Arc.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Independent Verification
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Our backend independently scans Arc RPC, verifies the ERC-20 Transfer event, matches the recipient and amount, and marks the invoice as Paid with an immutable receipt.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Fintech Architecture
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Built specifically for Circle's Arc Mainnet
              </h2>
              <p className="text-slate-600 text-sm">
                No fake statistics. No simulated confirmations. Genuine on-chain payments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2 p-5 rounded-lg border border-slate-200 bg-slate-50/50">
                <Zap className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-sm text-slate-900">USDC Native Gas</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  On Arc, USDC is integrated directly as the native currency layer, eliminating multi-token friction.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-lg border border-slate-200 bg-slate-50/50">
                <Lock className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-sm text-slate-900">Non-Custodial</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Payments settle directly to your chosen wallet. ArcInvoice never holds your private keys or funds.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-lg border border-slate-200 bg-slate-50/50">
                <QrCode className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-sm text-slate-900">QR & Share Links</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clients scan on mobile or click payment links to review transparent breakdown without registering.
                </p>
              </div>

              <div className="space-y-2 p-5 rounded-lg border border-slate-200 bg-slate-50/50">
                <FileCheck2 className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-sm text-slate-900">Printable Receipts</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Print or download verified PDF receipts complete with transaction hashes and explorer links.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Network & Infrastructure Transparency */}
        <section className="py-16 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Arc Configuration
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Target Network: {network.chainName}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xl">
                    ArcInvoice communicates with official RPC endpoints at <span className="font-mono text-slate-700">{network.rpcUrl}</span> (EIP-155 Chain ID: {network.chainId}).
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={network.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <span>View Explorer</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  <Link href="/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
