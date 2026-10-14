import React from "react";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: InvoiceStatus | string;
  variant?: "default" | "success" | "warning" | "danger" | "neutral" | "info";
}

export function Badge({
  className,
  status,
  variant,
  children,
  ...props
}: BadgeProps) {
  let computedVariant = variant || "default";

  if (status) {
    switch (status.toLowerCase()) {
      case "paid":
      case "confirmed":
        computedVariant = "success";
        break;
      case "pending":
        computedVariant = "warning";
        break;
      case "overdue":
      case "reverted":
      case "failed":
        computedVariant = "danger";
        break;
      case "canceled":
      case "draft":
        computedVariant = "neutral";
        break;
      default:
        computedVariant = "neutral";
    }
  }

  const styles = {
    default: "bg-blue-50 text-blue-700 border-blue-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize select-none",
        styles[computedVariant],
        className
      )}
      {...props}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", {
          "bg-emerald-500": computedVariant === "success",
          "bg-amber-500": computedVariant === "warning",
          "bg-rose-500": computedVariant === "danger",
          "bg-slate-400": computedVariant === "neutral",
          "bg-blue-500": computedVariant === "default" || computedVariant === "info",
        })}
      />
      {children || status}
    </span>
  );
}
