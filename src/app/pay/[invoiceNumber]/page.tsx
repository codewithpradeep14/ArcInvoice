"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Web3Provider } from "@/components/providers/web3-provider";
import { ConnectWalletButton } from "@/components/payments/connect-wallet-button";
import { PayInvoiceButton } from "@/components/payments/pay-invoice-button";
import { PaymentReceipt } from "@/components/payments/payment-receipt";
import {
  Receipt,
  Copy,
  Check,
  Calendar,
  Wallet,
  ShieldCheck,
  ExternalLink,
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  Printer,
} from "lucide-react";
import {
  formatUsdcDisplay,
  formatDate,
  formatDateTime,
  shortenAddress,
  isOverdue,
} from "@/lib/utils";
import { getActiveNetworkConfig } from "@/config/arc";
import type { PublicInvoice, VerificationResult } from "@/types";

function PublicPaymentPageInner() {
  const params = useParams();
  const invoiceNumber = params?.invoiceNumber as string;
  const network = getActiveNetworkConfig();

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [verifiedPayment, setVerifiedPayment] = useState<VerificationResult | null>(null);

  useEffect(() => {
    if (!invoiceNumber) return;

    // Handle Demo Invoice for immediate evaluation
    if (invoiceNumber === "ARC-DEMO-2026") {
      setInvoice({
        invoice_number: "ARC-DEMO-2026",
        client_name: "Meridian Labs & Partners",
        client_email: "billing@meridianlabs.io",
        description: "Full-Stack Web3 Application Milestone 1 Settlement (Circle Arc Mainnet Demonstration)",
        amount_minor: "250000000", // 250.00 USDC
        currency: "USDC",
        receiving_wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        network_identifier: "arc-mainnet",
        status: "pending",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        notes: "Thank you for your business. Please connect your MetaMask or compatible EVM wallet to settle in USDC directly on Circle Arc.",
        created_at: new Date().toISOString(),
        paid_at: null,
        business_name: "Apex Studio Inc.",
        full_name: "Alex Morgan",
        payment_tx_hash: null,
        payment_confirmed_at: null,
      });
      setLoading(false);
      return;
    }

    const fetchPublicInvoice = async () => {
      try {
        const res = await fetch(`/api/public/invoices/${invoiceNumber}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        } else {
          const errData = await res.json();
          setError(errData.error || "Invoice not found or expired");
        }
      } catch {
        setError("Network communication error while loading invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicInvoice();
  }, [invoiceNumber]);

  const handleCopyAddress = () => {
    if (!invoice) return;
    navigator.clipboard.writeText(invoice.receiving_wallet_address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handlePaymentSuccess = (result: VerificationResult) => {
    setVerifiedPayment(result);
    if (invoice) {
      setInvoice({
        ...invoice,
        status: "paid",
        paid_at: result.confirmed_at || new Date().toISOString(),
        payment_tx_hash: result.transaction_hash,
        payment_confirmed_at: result.confirmed_at || new Date().toISOString(),
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Loading State */}
          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center space-y-4 shadow-sm animate-pulse">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto" />
              <p className="text-xs font-medium text-slate-500">
                Loading verified invoice details...
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && (error || !invoice) && (
            <Card className="border-rose-200 bg-rose-50/50 p-8 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Invoice Unavailable</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {error || "The requested invoice could not be located or may have been canceled by the issuer."}
              </p>
              <div className="pt-2">
                <Link href="/">
                  <Button variant="outline" size="sm">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Active Invoice Content */}
          {!loading && invoice && (
            <>
              {invoice.status === "paid" ? (
                /* Confirmed Payment Receipt View */
                <PaymentReceipt
                  invoice={invoice}
                  transactionHash={invoice.payment_tx_hash || verifiedPayment?.transaction_hash}
                  blockNumber={verifiedPayment?.block_number}
                  confirmedAt={invoice.paid_at || verifiedPayment?.confirmed_at}
                />
              ) : (
                /* Payment Request View */
                <div className="space-y-6">
                  {/* Top Merchant Brand & Wallet Connector Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-900 leading-tight">
                          {invoice.business_name || invoice.full_name || "Merchant"}
                        </h2>
                        <p className="text-xs text-slate-500">
                          Invoice <span className="font-mono font-medium text-slate-700">{invoice.invoice_number}</span>
                        </p>
                      </div>
                    </div>

                    <ConnectWalletButton />
                  </div>

                  {/* Main Invoice Card */}
                  <Card className="border-slate-200 shadow-card">
                    <CardContent className="p-6 sm:p-8 space-y-8">
                      {/* Amount Due Big Banner */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Total Due
                          </span>
                          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1">
                            {formatUsdcDisplay(invoice.amount_minor)}
                          </h1>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              USDC on Arc
                            </span>
                            <span className="text-xs text-slate-500">
                              (Direct on-chain settlement)
                            </span>
                          </div>
                        </div>

                        <div className="sm:text-right space-y-1 text-xs">
                          <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                            Payment Due Date
                          </span>
                          <span className="text-slate-800 font-medium text-sm">
                            {formatDate(invoice.due_date)}
                          </span>
                          {isOverdue(invoice.due_date, invoice.status) && (
                            <p className="text-rose-600 font-semibold text-xs">
                              Past Due
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Client & Description Details */}
                      <div className="space-y-4 pb-6 border-b border-slate-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                              Billed To
                            </span>
                            <p className="font-semibold text-slate-900 text-sm mt-0.5">
                              {invoice.client_name}
                            </p>
                            {invoice.client_email && (
                              <p className="text-slate-500">{invoice.client_email}</p>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                              Invoice Status
                            </span>
                            <div className="mt-1">
                              <Badge status={invoice.status} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 uppercase font-semibold text-[10px] block mb-1">
                            Service / Deliverables
                          </span>
                          <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/60 p-4 rounded-lg border border-slate-100">
                            {invoice.description}
                          </p>
                        </div>

                        {invoice.notes && (
                          <div className="text-xs text-slate-500 pt-1">
                            <span className="font-semibold text-slate-700">Payment Notes: </span>
                            {invoice.notes}
                          </div>
                        )}
                      </div>

                      {/* Merchant Receiving Address */}
                      <div className="space-y-2 pb-6 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Merchant Receiving Wallet
                          </span>
                          <button
                            onClick={handleCopyAddress}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                          >
                            {copiedAddress ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Address</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-md bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 break-all select-all">
                          <Wallet className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{invoice.receiving_wallet_address}</span>
                        </div>
                      </div>

                      {/* Interactive Pay With USDC Action */}
                      <div className="space-y-4">
                        <PayInvoiceButton
                          invoice={invoice}
                          onPaymentSuccess={handlePaymentSuccess}
                        />
                      </div>

                      {/* Network Guidance Callout */}
                      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span>Circle Arc ({network.chainName})</span>
                        </div>
                        <a
                          href={network.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function PublicPaymentPage() {
  return (
    <Web3Provider>
      <PublicPaymentPageInner />
    </Web3Provider>
  );
}

