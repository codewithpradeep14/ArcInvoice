"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrModal } from "@/components/invoices/qr-modal";
import {
  Search,
  QrCode,
  Copy,
  Check,
  Eye,
  Ban,
  Filter,
  FilePlus2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { formatUsdcDisplay, formatDate, isOverdue } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";

interface InvoiceTableProps {
  initialInvoices: Invoice[];
  onRefresh?: () => void;
}

export function InvoiceTable({ initialInvoices, onRefresh }: InvoiceTableProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedQrInvoice, setSelectedQrInvoice] = useState<Invoice | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // Copy payment link helper
  const handleCopyLink = (invoiceNumber: string, id: string) => {
    const url = `${window.location.origin}/pay/${invoiceNumber}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cancel invoice action
  const handleCancelInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this unpaid invoice?")) return;
    setCancelingId(id);

    try {
      const res = await fetch(`/api/invoices/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status: "canceled" } : inv))
        );
        if (onRefresh) onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel invoice");
      }
    } catch {
      alert("Error canceling invoice");
    } finally {
      setCancelingId(null);
    }
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchTerm.toLowerCase());

    const isCurrentOverdue = isOverdue(inv.due_date, inv.status);

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "overdue") return matchesSearch && isCurrentOverdue;
    return matchesSearch && inv.status === statusFilter;
  });

  const statuses = [
    { id: "all", label: "All Invoices" },
    { id: "pending", label: "Pending" },
    { id: "paid", label: "Paid" },
    { id: "overdue", label: "Overdue" },
    { id: "canceled", label: "Canceled" },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by client, invoice #, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-subtle"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table Card */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Calendar className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No invoices found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search query or status filter."
                : "Create your first Arc invoice to start receiving USDC payments directly on-chain."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <div className="pt-2">
                <Link href="/invoices/new">
                  <Button size="sm" className="gap-1.5">
                    <FilePlus2 className="h-4 w-4" />
                    Create First Invoice
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => {
                  const overdue = isOverdue(inv.due_date, inv.status);
                  const displayStatus = overdue ? "overdue" : inv.status;

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Invoice Number */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {inv.invoice_number}
                        </Link>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {inv.client_name}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">
                          {inv.description}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 text-xs">
                        <span className={overdue ? "text-rose-600 font-medium" : "text-slate-600"}>
                          {formatDate(inv.due_date)}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {formatUsdcDisplay(inv.amount_minor)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge status={displayStatus} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Link */}
                          <button
                            onClick={() => handleCopyLink(inv.invoice_number, inv.id)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Copy payment link"
                          >
                            {copiedId === inv.id ? (
                              <Check className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>

                          {/* QR Code */}
                          <button
                            onClick={() => setSelectedQrInvoice(inv)}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="Show QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>

                          {/* View details */}
                          <Link
                            href={`/invoices/${inv.id}`}
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                            title="View invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {/* Cancel if pending */}
                          {inv.status === "pending" && (
                            <button
                              onClick={() => handleCancelInvoice(inv.id)}
                              disabled={cancelingId === inv.id}
                              className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Cancel invoice"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}
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

      {/* QR Code Modal */}
      {selectedQrInvoice && (
        <QrModal
          isOpen={!!selectedQrInvoice}
          onClose={() => setSelectedQrInvoice(null)}
          invoiceNumber={selectedQrInvoice.invoice_number}
          amountDisplay={formatUsdcDisplay(selectedQrInvoice.amount_minor)}
          clientName={selectedQrInvoice.client_name}
        />
      )}
    </div>
  );
}
