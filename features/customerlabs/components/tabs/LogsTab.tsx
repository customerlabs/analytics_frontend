"use client";

interface LogsTabProps {
  accountId: string;
}

export function LogsTab({ accountId }: LogsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Logs</h2>
        <p className="text-sm text-muted-foreground">
          View activity logs and event history for this CustomerLabs account.
        </p>
      </div>
    </div>
  );
}
