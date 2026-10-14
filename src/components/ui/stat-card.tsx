import React from "react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("hover:border-slate-300 transition-colors", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="h-9 w-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-600">
            {icon}
          </div>
        </div>
        <div className="mt-2">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </h2>
          {(description || trend) && (
            <div className="mt-1 flex items-center text-xs text-slate-500">
              {trend && (
                <span
                  className={cn(
                    "mr-1.5 font-medium",
                    trend.isPositive ? "text-emerald-600" : "text-slate-600"
                  )}
                >
                  {trend.value}
                </span>
              )}
              <span>{description}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
