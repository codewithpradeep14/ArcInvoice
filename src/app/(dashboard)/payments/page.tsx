"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ExternalLink,
  History,
  CheckCircle2,
  Calendar,
  Wallet,
  RefreshCw,
  Printer,
} from "lucide-react";
import {
  formatUsdcDisplay,
  formatDateTime,
  shortenAddress,
  shortenTxHash,
} from "@/lib/utils";
import { getExplorerTxUrl, getActiveNetworkConfig } from "@/config/arc";
import type { Payment } from "@/types";

interface ExtendedPayment extends Payment {
  invoices?: {
    invoice_number: string;
    client_name: string;
  };
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const network = getActiveNetworkConfig();
  const [payments, setPayments] = useState<ExtendedPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/history");
      if (res.ok) {
        const data = await res.json();
        setPayments(data || []);
      }
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Payment History
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Verified USDC settlements recorded directly from the Circle Arc blockchain.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayments}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Payments Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <History className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">No confirmed payments yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When clients pay your invoices in USDC on Arc, verified transaction records will appear here automatically.
              </p>
              <div className="pt-2">
                <Link href="/invoices">
                  <Button size="sm" variant="outline">
                    View Invoices
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payer Wallet</th>
                    <th className="py-3 px-4">Confirmed At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Arc Explorer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map((pay) => {
                    const invoiceNumber = pay.invoices?.invoice_number || "—";
                    const clientName = pay.invoices?.client_name || "Client";

                    return (
                      <tr
                        key={pay.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                          {invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">
                          {clientName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {formatUsdcDisplay(pay.amount_minor)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {shortenAddress(pay.payer_wallet_address)}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {formatDateTime(pay.confirmed_at || pay.created_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge status={pay.verification_status} />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={getExplorerTxUrl(pay.transaction_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline"
                            >
                              <span>{shortenTxHash(pay.transaction_hash)}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <Link
                              href={`/receipt/${invoiceNumber}`}
                              target="_blank"
                              className="p-1 text-slate-400 hover:text-slate-700"
                              title="Print receipt"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
