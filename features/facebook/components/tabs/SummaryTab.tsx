"use client";

interface SummaryTabProps {
  accountId: string;
}

export function SummaryTab({ accountId }: SummaryTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Summary</h2>
        <p className="text-sm text-muted-foreground">
          Facebook Ads account summary and key metrics will be displayed here.
        </p>
      </div>
    </div>
  );
}
