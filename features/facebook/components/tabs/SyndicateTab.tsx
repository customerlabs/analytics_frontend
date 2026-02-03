"use client";

interface SyndicateTabProps {
  accountId: string;
}

export function SyndicateTab({ accountId }: SyndicateTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Syndicate</h2>
        <p className="text-sm text-muted-foreground">
          Syndicate campaigns and assets across multiple ad accounts.
        </p>
      </div>
    </div>
  );
}
