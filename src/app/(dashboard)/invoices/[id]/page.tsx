"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrModal } from "@/components/invoices/qr-modal";
import {
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  Printer,
  ExternalLink,
  Ban,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { formatUsdcDisplay, formatDate, formatDateTime, shortenAddress, shortenTxHash, isOverdue } from "@/lib/utils";
import { getExplorerTxUrl, getActiveNetworkConfig } from "@/config/arc";
import type { Invoice, Payment } from "@/types";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const network = getActiveNetworkConfig();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      } else {
        const errData = await res.json();
        setError(errData.error || "Invoice not found");
      }
    } catch {
      setError("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handleCopyLink = () => {
    if (!invoice) return;
    const url = `${window.location.origin}/pay/${invoice.invoice_number}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCancelInvoice = async () => {
    if (!invoice || !confirm("Are you sure you want to cancel this unpaid invoice?")) return;
    setCanceling(true);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/cancel`, { method: "POST" });
      if (res.ok) {
        setInvoice({ ...invoice, status: "canceled" });
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel invoice");
      }
    } catch {
      alert("Error canceling invoice");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-4 animate-pulse">
          <div className="h-6 w-32 bg-slate-200 rounded" />
          <div className="h-72 bg-white rounded-lg border border-slate-200" />
        </div>
      </DashboardShell>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardShell>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <h2 className="text-base font-semibold text-rose-900">Unable to load invoice</h2>
          <p className="text-xs text-rose-700">{error || "Invoice not found or access denied."}</p>
          <Link href="/invoices">
            <Button variant="outline" size="sm">Back to Invoices</Button>
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const overdue = isOverdue(invoice.due_date, invoice.status);
  const displayStatus = overdue ? "overdue" : invoice.status;
  const payment: Payment | undefined = invoice.payments?.[0];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-4xl">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Invoices</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {invoice.invoice_number}
              </h1>
              <Badge status={displayStatus} />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQr(true)}
              className="gap-1.5"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Code</span>
            </Button>

            <Link href={`/pay/${invoice.invoice_number}`} target="_blank">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <span>View Public Page</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>

            {invoice.status === "pending" && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelInvoice}
                isLoading={canceling}
                className="gap-1.5"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </Button>
            )}
          </div>
        </div>

        {/* Invoice Summary Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-8 space-y-8">
            {/* Amount Banner */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Amount Due
                </span>
                <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
                  {formatUsdcDisplay(invoice.amount_minor)}
                </h2>
                <span className="text-xs text-slate-500">
                  Target Settlement: Circle Arc ({network.chainName})
                </span>
              </div>
              <div className="sm:text-right space-y-1 text-xs">
                <div className="flex items-center sm:justify-end gap-1.5 text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Created: {formatDate(invoice.created_at)}</span>
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 font-medium text-slate-800">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className={overdue ? "text-rose-600 font-semibold" : ""}>
                    Due: {formatDate(invoice.due_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Client & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Billed Client
                </span>
                <p className="font-semibold text-slate-900 text-base">{invoice.client_name}</p>
                {invoice.client_email && (
                  <p className="text-xs text-slate-500">{invoice.client_email}</p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Merchant Receiving Wallet
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-100 p-2 rounded border border-slate-200">
                  <Wallet className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{invoice.receiving_wallet_address}</span>
                </div>
              </div>
            </div>

            {/* Description & Notes */}
            <div className="space-y-3 pb-6 border-b border-slate-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Deliverables & Description
              </span>
              <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded border border-slate-100">
                {invoice.description}
              </p>
              {invoice.notes && (
                <div className="text-xs text-slate-500 pt-1">
                  <span className="font-semibold text-slate-700">Notes: </span>
                  {invoice.notes}
                </div>
              )}
            </div>

            {/* On-Chain Payment Verification Details (if paid) */}
            {invoice.status === "paid" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Verified On-Chain Settlement
                  </span>
                  <Link href={`/receipt/${invoice.invoice_number}`} target="_blank">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print Receipt</span>
                    </Button>
                  </Link>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-500">Paid Timestamp:</span>
                    <span className="font-medium text-slate-900">{formatDateTime(invoice.paid_at)}</span>
                  </div>
                  {payment && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-500">Payer Address:</span>
                        <span className="font-mono text-slate-800">{shortenAddress(payment.payer_wallet_address)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-500">Arc Tx Hash:</span>
                        <a
                          href={getExplorerTxUrl(payment.transaction_hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <span>{shortenTxHash(payment.transaction_hash)}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {payment.block_number && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-slate-500">Block Number:</span>
                          <span className="font-mono text-slate-700">#{payment.block_number}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        <QrModal
          isOpen={showQr}
          onClose={() => setShowQr(false)}
          invoiceNumber={invoice.invoice_number}
          amountDisplay={formatUsdcDisplay(invoice.amount_minor)}
          clientName={invoice.client_name}
        />
      </div>
    </DashboardShell>
  );
}
