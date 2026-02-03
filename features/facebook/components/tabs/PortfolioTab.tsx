"use client";

interface PortfolioTabProps {
  accountId: string;
}

export function PortfolioTab({ accountId }: PortfolioTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio</h2>
        <p className="text-sm text-muted-foreground">
          Manage your ad portfolio and campaign structures.
        </p>
      </div>
    </div>
  );
}
