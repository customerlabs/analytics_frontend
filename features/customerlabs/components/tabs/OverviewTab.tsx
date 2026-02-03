"use client";

interface OverviewTabProps {
  accountId: string;
}

export function OverviewTab({ accountId }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
        <p className="text-sm text-muted-foreground">
          CustomerLabs account overview and key metrics will be displayed here.
        </p>
      </div>
    </div>
  );
}
