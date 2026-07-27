"use client";

import { BarChart3 } from "lucide-react";

export interface ChartEmptyStateProps {
  title?: string;
  description?: string;
}

export function ChartEmptyState({
  title = "No data for this period",
  description = "Try adjusting the date range or filters to see results.",
}: ChartEmptyStateProps) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center border-2 border-dashed border-foreground/30 font-mono text-sm text-muted-foreground p-6 text-center"
      role="status"
      aria-label={title}
    >
      <BarChart3 className="w-8 h-8 mb-3 text-muted-foreground/50" aria-hidden="true" />
      <p className="font-bold text-foreground/70">{title}</p>
      <p className="text-xs mt-1">{description}</p>
    </div>
  );
}
