"use client";

import { Skeleton } from "@/components/ui/skeleton";

export interface ChartSkeletonProps {
  /** Shows range selector placeholders in the header */
  showRangeButtons?: boolean;
  /** Height class for the chart area placeholder */
  height?: string;
}

export function ChartSkeleton({
  showRangeButtons = false,
  height = "flex-1",
}: ChartSkeletonProps) {
  return (
    <div
      className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between h-[360px]"
      role="status"
      aria-label="Loading chart"
    >
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 border-2 border-foreground/10" />
          <Skeleton className="h-3 w-64 border-2 border-foreground/10" />
        </div>
        {showRangeButtons && (
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-12 border-2 border-foreground/10" />
            <Skeleton className="h-8 w-12 border-2 border-foreground/10" />
            <Skeleton className="h-8 w-12 border-2 border-foreground/10" />
          </div>
        )}
      </div>
      <div className={`${height} w-full`}>
        <Skeleton className="h-full w-full border-2 border-foreground/10" />
      </div>
      <span className="sr-only">Loading chart data…</span>
    </div>
  );
}

export interface KPISkeletonProps {
  height?: string;
}

export function KPISkeleton({ height = "h-40" }: KPISkeletonProps) {
  return (
    <div
      className={`border-3 border-foreground bg-card p-6 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between ${height}`}
      role="status"
      aria-label="Loading metric"
    >
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 border-2 border-foreground/10" />
        <Skeleton className="h-8 w-32 border-2 border-foreground/10" />
      </div>
      <Skeleton className="h-4 w-40 border-2 border-foreground/10" />
      <span className="sr-only">Loading metric data…</span>
    </div>
  );
}
