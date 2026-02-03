"use client";

interface GoalsTabProps {
  accountId: string;
}

export function GoalsTab({ accountId }: GoalsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Goals</h2>
        <p className="text-sm text-muted-foreground">
          Configure and track campaign goals for this Facebook Ads account.
        </p>
      </div>
    </div>
  );
}
