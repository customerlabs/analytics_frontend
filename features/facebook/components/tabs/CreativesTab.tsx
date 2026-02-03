"use client";

interface CreativesTabProps {
  accountId: string;
}

export function CreativesTab({ accountId }: CreativesTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Creatives</h2>
        <p className="text-sm text-muted-foreground">
          Manage ad creatives, images, videos, and copy for your campaigns.
        </p>
      </div>
    </div>
  );
}
