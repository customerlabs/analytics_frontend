"use client";

import { cn } from "@/lib/utils";

interface AccountTemplateGridSkeletonProps {
  count?: number;
  className?: string;
}

function AccountTemplateCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function AccountTemplateGridSkeleton({
  count = 6,
  className,
}: AccountTemplateGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <AccountTemplateCardSkeleton key={i} />
      ))}
    </div>
  );
}
