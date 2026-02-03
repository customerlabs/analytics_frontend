"use client";

interface ProductsTabProps {
  accountId: string;
}

export function ProductsTab({ accountId }: ProductsTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Products</h2>
        <p className="text-sm text-muted-foreground">
          Manage product catalogs and feeds for your Facebook Ads campaigns.
        </p>
      </div>
    </div>
  );
}
