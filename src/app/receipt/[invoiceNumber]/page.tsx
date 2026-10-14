"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PaymentReceipt } from "@/components/payments/payment-receipt";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { PublicInvoice } from "@/types";

export default function PrintableReceiptPage() {
  const params = useParams();
  const invoiceNumber = params?.invoiceNumber as string;

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceNumber) return;

    if (invoiceNumber === "ARC-DEMO-2026") {
      setInvoice({
        invoice_number: "ARC-DEMO-2026",
        client_name: "Meridian Labs & Partners",
        client_email: "billing@meridianlabs.io",
        description: "Full-Stack Web3 Application Milestone 1 Settlement (Circle Arc Mainnet Demonstration)",
        amount_minor: "250000000",
        currency: "USDC",
        receiving_wallet_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        network_identifier: "arc-mainnet",
        status: "paid",
        due_date: new Date().toISOString(),
        notes: "Settled via Arc Mainnet",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        paid_at: new Date().toISOString(),
        business_name: "Apex Studio Inc.",
        full_name: "Alex Morgan",
        payment_tx_hash: "0x89ab12cd34ef5678901234567890abcdef1234567890abcdef1234567890abcdef",
        payment_confirmed_at: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/public/invoices/${invoiceNumber}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data);
        } else {
          setError("Invoice not found");
        }
      } catch {
        setError("Error loading receipt");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [invoiceNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="rounded-lg border border-rose-200 bg-white p-8 text-center space-y-3 max-w-md">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Receipt Not Available</h2>
          <p className="text-xs text-slate-500">{error || "Could not locate this receipt."}</p>
          <Link href="/">
            <Button size="sm">Go to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto mb-4 no-print flex items-center justify-between">
        <Link
          href={`/pay/${invoice.invoice_number}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Invoice</span>
        </Link>
      </div>

      <PaymentReceipt invoice={invoice} />
    </div>
  );
}
