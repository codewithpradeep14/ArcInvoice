"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Printer,
  ExternalLink,
  Receipt,
  Copy,
  Check,
  Building,
  Calendar,
  Wallet,
} from "lucide-react";
import {
  formatUsdcDisplay,
  formatDateTime,
  shortenAddress,
  shortenTxHash,
} from "@/lib/utils";
import { getExplorerTxUrl, getActiveNetworkConfig } from "@/config/arc";
import type { PublicInvoice } from "@/types";

interface PaymentReceiptProps {
  invoice: PublicInvoice;
  transactionHash?: string;
  blockNumber?: number;
  confirmedAt?: string;
}

export function PaymentReceipt({
  invoice,
  transactionHash = invoice.payment_tx_hash || "",
  blockNumber,
  confirmedAt = invoice.payment_confirmed_at || invoice.paid_at || new Date().toISOString(),
}: PaymentReceiptProps) {
  const [copied, setCopied] = React.useState(false);
  const network = getActiveNetworkConfig();

  const handleCopyTx = () => {
    if (!transactionHash) return;
    navigator.clipboard.writeText(transactionHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 print-container">
      {/* Top Banner */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 text-emerald-900 flex flex-col sm:flex-row items-center justify-between gap-4 no-print shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-emerald-950">Payment Verified on Arc</h3>
            <p className="text-xs text-emerald-700">
              The on-chain transfer has been independently verified and settled in USDC.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="gap-2 bg-white text-slate-800 hover:bg-slate-50 border-slate-300 shrink-0"
        >
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      </div>

      {/* Official Receipt Card */}
      <Card className="border-slate-200 shadow-sm print:shadow-none print:border-none">
        <CardContent className="p-8 space-y-8">
          {/* Receipt Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-6 w-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  <Receipt className="h-3.5 w-3.5" />
                </div>
                <span className="font-bold tracking-tight text-slate-900 text-base">ArcInvoice</span>
              </div>
              <p className="text-xs text-slate-500">Official Payment Settlement Receipt</p>
            </div>
            <div className="sm:text-right">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                Invoice Number
              </span>
              <span className="font-mono font-bold text-slate-900 text-base">
                {invoice.invoice_number}
              </span>
              <div className="mt-1">
                <Badge status="paid" />
              </div>
            </div>
          </div>

          {/* Amount Callout */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount Paid (USDC)
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">
                {formatUsdcDisplay(invoice.amount_minor)}
              </h2>
              <span className="text-xs text-slate-500">
                Settled on Circle Arc ({network.chainName})
              </span>
            </div>
            <div className="sm:text-right text-xs text-slate-500">
              <div className="flex items-center sm:justify-end gap-1.5 text-slate-700 font-medium">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Settled: {formatDateTime(confirmedAt)}</span>
              </div>
              {blockNumber && (
                <p className="mt-1 text-[11px] font-mono text-slate-400">
                  Block #{blockNumber.toString()}
                </p>
              )}
            </div>
          </div>

          {/* Parties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200 text-sm">
            {/* Merchant / Payee */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Paid To (Merchant)
              </span>
              <p className="font-semibold text-slate-900">
                {invoice.business_name || invoice.full_name || "Merchant"}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-100/70 p-2 rounded border border-slate-200/60">
                <Wallet className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{invoice.receiving_wallet_address}</span>
              </div>
            </div>

            {/* Client / Payer */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Billed To (Client)
              </span>
              <p className="font-semibold text-slate-900">{invoice.client_name}</p>
              {invoice.client_email && (
                <p className="text-xs text-slate-500">{invoice.client_email}</p>
              )}
            </div>
          </div>

          {/* Description & Item Details */}
          <div className="space-y-3 pb-6 border-b border-slate-200">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Service Description
            </span>
            <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded-md border border-slate-100">
              {invoice.description}
            </p>
            {invoice.notes && (
              <div className="text-xs text-slate-500 mt-2">
                <span className="font-semibold text-slate-600">Notes: </span>
                {invoice.notes}
              </div>
            )}
          </div>

          {/* On-Chain Verification Reference */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Arc Blockchain Verification Details
            </span>

            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500">Transaction Hash:</span>
                {transactionHash ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900 font-medium">
                      {shortenTxHash(transactionHash, 8)}
                    </span>
                    <button
                      onClick={handleCopyTx}
                      className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Copy transaction hash"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={getExplorerTxUrl(transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium ml-1"
                    >
                      <span>Arcscan</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-400">Recorded on Arc Mainnet</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500">Settlement Network:</span>
                <span className="font-medium text-slate-800">
                  {network.chainName} (EIP-155 Chain ID: {network.chainId})
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-500">Token Contract:</span>
                <span className="font-mono text-slate-700 text-[11px] truncate max-w-xs">
                  {network.usdcContractAddress} (USDC, 6 decimals)
                </span>
              </div>
            </div>
          </div>

          {/* Printable Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified by ArcInvoice Payment Engine</span>
            <span>https://arcinvoice.app</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
