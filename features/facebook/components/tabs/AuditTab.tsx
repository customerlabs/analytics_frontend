"use client";

interface AuditTabProps {
  accountId: string;
}

export function AuditTab({ accountId }: AuditTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Audit</h2>
        <p className="text-sm text-muted-foreground">
          Review audit logs and track changes made to your Facebook Ads account.
        </p>
      </div>
    </div>
  );
}
