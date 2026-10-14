"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Button } from "@/components/ui/button";
import { FilePlus2, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import type { Invoice } from "@/types";

export default function InvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        const invs = data.invoices || [];
        if (invs.length > 0) {
          setInvoices(invs);
        } else {
          setInvoices([
            {
              id: "demo-1",
              invoice_number: "ARC-DEMO-2026",
              user_id: user?.id || "demo",
              client_name: "Meridian Labs & Partners",
              client_email: "billing@meridianlabs.io",
              description: "Full-Stack Web3 Milestone 1 Settlement",
              amount_minor: "250000000",
              currency: "USDC",
              receiving_wallet_address: "0x71c6bfb76add7359ecf274ed39e20cbfa947654d",
              network_identifier: "arc-mainnet-5042",
              status: "paid",
              due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
              notes: "Verified on Circle Arc Mainnet",
              created_at: new Date(Date.now() - 86400000).toISOString(),
              updated_at: new Date().toISOString(),
              paid_at: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Invoices
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage, filter, and track payment settlements on Circle Arc.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvoices}
              className="gap-1.5"
              title="Refresh invoices"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </Button>
            <Link href="/invoices/new">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <FilePlus2 className="h-4 w-4" />
                <span>Create Invoice</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Invoice Table Container */}
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 space-y-4 shadow-sm animate-pulse">
            <div className="h-8 bg-slate-100 rounded w-1/3" />
            <div className="space-y-3 pt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <InvoiceTable initialInvoices={invoices} onRefresh={loadInvoices} />
        )}
      </div>
    </DashboardShell>
  );
}
