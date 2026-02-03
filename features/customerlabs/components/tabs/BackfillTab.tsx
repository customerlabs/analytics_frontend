"use client";

interface BackfillTabProps {
  accountId: string;
}

export function BackfillTab({ accountId }: BackfillTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Backfill Data</h2>
        <p className="text-sm text-muted-foreground">
          Configure and manage data backfill operations for historical data import.
        </p>
      </div>
    </div>
  );
}
