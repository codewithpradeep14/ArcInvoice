"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewInvoicePage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Invoices</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Invoice
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fill in the invoice parameters to generate a public Arc USDC payment link.
          </p>
        </div>

        <InvoiceForm />
      </div>
    </DashboardShell>
  );
}
