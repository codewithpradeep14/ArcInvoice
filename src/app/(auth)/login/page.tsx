"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt, ShieldCheck } from "lucide-react";
import { WalletLoginButton } from "@/components/auth/wallet-login-button";
import { getActiveNetworkConfig } from "@/config/arc";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";
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
          Sign In with Web3 Wallet
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Connect MetaMask or Zerion to instantly access your invoices and manage USDC settlements on Circle Arc.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="border-slate-200 shadow-card">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3 text-center">
                Select Your Wallet to Enter
              </p>
              <WalletLoginButton redirectUrl={redirectUrl} />
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2 text-slate-800 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Non-Custodial Authentication</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                No email or password needed. Your merchant account is linked directly to your non-custodial EVM wallet on Circle Arc ({network.chainName}).
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              Want to pay an existing invoice instead?{" "}
              <Link
                href="/pay/ARC-DEMO-2026"
                className="font-semibold text-blue-600 hover:underline"
              >
                View demo invoice
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
