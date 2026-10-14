"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { minorToUsdc } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

interface RevenueChartProps {
  metrics: DashboardMetrics;
}

export function RevenueChart({ metrics }: RevenueChartProps) {
  const invoicedUsdc = parseFloat(minorToUsdc(metrics.totalInvoicedMinor));
  const paidUsdc = parseFloat(minorToUsdc(metrics.totalConfirmedMinor));
  const outstandingUsdc = parseFloat(minorToUsdc(metrics.outstandingMinor));

  const data = [
    {
      name: "Total Invoiced",
      amount: invoicedUsdc,
      color: "#2563eb", // blue-600
    },
    {
      name: "Confirmed Paid",
      amount: paidUsdc,
      color: "#10b981", // emerald-500
    },
    {
      name: "Outstanding",
      amount: outstandingUsdc,
      color: "#f59e0b", // amber-500
    },
  ];

  const hasData = invoicedUsdc > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Financial Breakdown</CardTitle>
        <CardDescription>
          Comparison of invoiced, settled, and outstanding USDC volume.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(val: any) => [`$${Number(val || 0).toFixed(2)} USDC`, "Amount"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <p className="text-xs">No payment data recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Create an invoice to see your revenue breakdown.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
