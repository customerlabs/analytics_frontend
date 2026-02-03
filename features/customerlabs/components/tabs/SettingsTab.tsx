"use client";

interface SettingsTabProps {
  accountId: string;
}

export function SettingsTab({ accountId }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure CustomerLabs account settings and preferences.
        </p>
      </div>
    </div>
  );
}
