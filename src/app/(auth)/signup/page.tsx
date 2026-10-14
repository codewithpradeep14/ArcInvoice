"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, ShieldCheck, CheckCircle2 } from "lucide-react";
import { WalletLoginButton } from "@/components/auth/wallet-login-button";
import { getActiveNetworkConfig } from "@/config/arc";

export default function SignupPage() {
  const network = getActiveNetworkConfig();

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Receipt className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl text-slate-900 tracking-tight">
            ArcInvoice
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 pt-2">
          Create Your Merchant Account
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Connect your wallet once to automatically register and begin issuing USDC invoices on Circle Arc.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="border-slate-200 shadow-card">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 text-center">
                Connect Wallet to Get Started
              </p>
              <WalletLoginButton redirectUrl="/dashboard" />
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero registration forms or passwords to remember</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Invoices settle directly to your non-custodial address</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Targeting Circle Arc Mainnet ({network.chainName})</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              Already connected?{" "}
              <Link
                href="/dashboard"
                className="font-semibold text-blue-600 hover:underline"
              >
                Go to Dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
