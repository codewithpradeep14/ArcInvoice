import React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { DollarSign, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { formatUsdcDisplay } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

interface MetricsViewProps {
  metrics: DashboardMetrics;
}

export function MetricsView({ metrics }: MetricsViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Invoiced */}
      <StatCard
        title="Total Invoiced"
        value={formatUsdcDisplay(metrics.totalInvoicedMinor)}
        description={`${metrics.totalInvoiceCount} total invoices issued`}
        icon={<DollarSign className="h-5 w-5 text-blue-600" />}
      />

      {/* Confirmed Payments */}
      <StatCard
        title="Confirmed Paid"
        value={formatUsdcDisplay(metrics.totalConfirmedMinor)}
        description={`${metrics.paidInvoiceCount} settled via Arc blockchain`}
        icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
        trend={{
          value: metrics.totalInvoiceCount > 0
            ? `${Math.round((metrics.paidInvoiceCount / metrics.totalInvoiceCount) * 100)}%`
            : "0%",
          isPositive: true,
        }}
      />

      {/* Outstanding */}
      <StatCard
        title="Outstanding"
        value={formatUsdcDisplay(metrics.outstandingMinor)}
        description={`${metrics.pendingInvoiceCount} invoices pending payment`}
        icon={<Clock className="h-5 w-5 text-amber-600" />}
      />

      {/* Overdue */}
      <StatCard
        title="Overdue Invoices"
        value={metrics.overdueCount.toString()}
        description={
          metrics.overdueCount === 0
            ? "No past-due invoices"
            : "Requires follow-up"
        }
        icon={<AlertTriangle className="h-5 w-5 text-rose-600" />}
      />
    </div>
  );
}
