"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema, type CreateInvoiceFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "@/components/providers/web3-provider";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Receipt,
  Wallet,
  Eye,
  CheckCircle2,
  Calendar,
  DollarSign,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { formatUsdcDisplay, formatDate } from "@/lib/utils";
import { getActiveNetworkConfig } from "@/config/arc";

export function InvoiceForm() {
  const router = useRouter();
  const { profile } = useAuth();
  const { address: connectedWallet } = useAccount();
  const network = getActiveNetworkConfig();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Default due date: 14 days from now
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const defaultReceivingAddress =
    profile?.default_wallet_address || connectedWallet || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      client_name: "",
      client_email: "",
      description: "",
      amount: "",
      due_date: defaultDueDate,
      notes: "Payment due via Circle Arc USDC. Please connect your EVM wallet to settle.",
      receiving_wallet_address: defaultReceivingAddress,
    },
  });

  const formValues = watch();

  const handleUseConnectedWallet = () => {
    if (connectedWallet) {
      setValue("receiving_wallet_address", connectedWallet, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateInvoiceFormData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.error || "Failed to create invoice");
        return;
      }

      // Redirect to invoice details or invoices list
      router.push(`/invoices/${result.id}`);
    } catch (err: unknown) {
      setServerError((err as Error)?.message || "Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Column */}
      <div className="lg:col-span-7 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New USDC Invoice</CardTitle>
            <CardDescription>
              Generate a shareable payment link with automated on-chain verification on Circle Arc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {serverError && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <p>{serverError}</p>
                </div>
              )}

              {/* Client Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Client Name *"
                  placeholder="e.g. Acme Corp or Jane Doe"
                  error={errors.client_name?.message}
                  {...register("client_name")}
                />
                <Input
                  label="Client Email (Optional)"
                  type="email"
                  placeholder="client@acme.com"
                  error={errors.client_email?.message}
                  {...register("client_email")}
                />
              </div>

              {/* Description */}
              <Input
                label="Invoice Title / Description *"
                placeholder="e.g. Full-Stack Web3 Development - Milestone 1"
                error={errors.description?.message}
                {...register("description")}
              />

              {/* Amount and Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Amount in USDC *"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="1250.00"
                    helperText="USDC has 6 decimal places."
                    error={errors.amount?.message}
                    {...register("amount")}
                  />
                </div>
                <div>
                  <Input
                    label="Due Date *"
                    type="date"
                    error={errors.due_date?.message}
                    {...register("due_date")}
                  />
                </div>
              </div>

              {/* Receiving Wallet Address */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Merchant Receiving Wallet Address *
                  </label>
                  {connectedWallet && (
                    <button
                      type="button"
                      onClick={handleUseConnectedWallet}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      Use connected wallet
                    </button>
                  )}
                </div>
                <Input
                  placeholder="0x..."
                  className="font-mono text-xs"
                  helperText={`Funds will settle directly to this wallet on ${network.chainName}.`}
                  error={errors.receiving_wallet_address?.message}
                  {...register("receiving_wallet_address")}
                />
              </div>

              {/* Notes */}
              <Textarea
                label="Invoice Notes (Optional)"
                placeholder="Add payment terms, deliverables summary, or thank-you message..."
                rows={3}
                error={errors.notes?.message}
                {...register("notes")}
              />

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full sm:w-auto gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {showPreview ? "Hide Preview" : "Preview Invoice"}
                </Button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="flex-1 sm:flex-initial gap-1.5"
                  >
                    Create & Generate Link
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Live Invoice Preview
          </span>
          <span className="text-xs text-slate-400">Updates as you type</span>
        </div>

        <Card className="border-slate-200 bg-white shadow-card">
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">
                    {profile?.business_name || profile?.full_name || "Your Business"}
                  </p>
                  <p className="text-[11px] text-slate-400">Invoice Draft</p>
                </div>
              </div>
              <Badge status="pending">Unpaid</Badge>
            </div>

            {/* Client & Due */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                  Billed To
                </span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {formValues.client_name || "Client Name"}
                </p>
                {formValues.client_email && (
                  <p className="text-slate-500">{formValues.client_email}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-400 uppercase font-semibold text-[10px] block">
                  Due Date
                </span>
                <p className="font-medium text-slate-800 mt-0.5">
                  {formatDate(formValues.due_date)}
                </p>
              </div>
            </div>

            {/* Description & Amount */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
              <span className="text-slate-500 text-[11px] block">
                {formValues.description || "Milestone description..."}
              </span>
              <div className="flex items-baseline justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Total Due</span>
                <span className="text-xl font-bold text-slate-900">
                  {formValues.amount ? `$${parseFloat(formValues.amount || "0").toFixed(2)} USDC` : "$0.00 USDC"}
                </span>
              </div>
            </div>

            {/* Wallet destination */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 text-[10px] font-semibold uppercase block">
                Destination Wallet
              </span>
              <p className="font-mono text-[11px] text-slate-700 bg-slate-100 p-2 rounded truncate border border-slate-200/60">
                {formValues.receiving_wallet_address || "No wallet specified"}
              </p>
            </div>

            {/* Network pill */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Circle Arc ({network.chainName})</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
